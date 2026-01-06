import {FloatingNumbersContainer} from '@/components/FloatingNumbersContainer'
import {ProgressBarWithText} from '@/components/ui/ProgressBarWithText'
import {monsters} from '@/constants/monsters'
import {useFightAnimations} from '@/hooks/useFightAnimations'
import {GameState, Monster, User} from '@/types/game'
import {calculateDamageDealt, calculateExpToNextLevel, calculateGoldGain, healthAfterAttack} from '@/utils/calculations'
import React, {useCallback, useEffect, useReducer, useRef} from 'react'
import {StyleSheet, View} from 'react-native'
import {Button, Card, Chip, Surface, Text} from 'react-native-paper'
import Animated from 'react-native-reanimated'
import {SafeAreaView} from 'react-native-safe-area-context'

const TICK_RATE = 100 // ms per tick (~10 ticks/sec)
const RESPAWN_DELAY = 2000 // ms

const createInitialUser = (): User => ({
  health: 100,
  maxHealth: 100,
  damage: {from: 1, to: 3},
  attackSpeed: 1000,
  experience: 0,
  level: 1,
  experienceToNextLevel: calculateExpToNextLevel(1),
  gold: 0
})

const createMonster = (stage: number = 1): Monster => {
  const cycle = Math.floor((stage - 1) / monsters.length)
  const baseMonster = monsters[(stage - 1) % monsters.length]
  const buffMultiplier = 1 + cycle * 0.5

  return {
    ...baseMonster,
    id: `${baseMonster.id}-${Date.now()}`,
    health: Math.floor(baseMonster.health * buffMultiplier),
    maxHealth: Math.floor(baseMonster.maxHealth * buffMultiplier),
    damage: {
      from: Math.floor(baseMonster.damage.from * buffMultiplier),
      to: Math.floor(baseMonster.damage.to * buffMultiplier)
    },
    attackSpeed: Math.max(Math.floor(baseMonster.attackSpeed - cycle * 100), 500),
    expGain: Math.floor(baseMonster.expGain * buffMultiplier),
    goldGain: Math.floor(baseMonster.goldGain * buffMultiplier)
  }
}

// ============================================================================
// GAME STATE & REDUCER (Battle Engine)
// ============================================================================

type GameAction = {type: 'TICK'; deltaMs: number} | {type: 'SET_FIGHTING'; value: boolean} | {type: 'RESTART'}

const createInitialState = (user?: User): GameState => ({
  user: user || createInitialUser(),
  monster: createMonster(1),
  currentStage: 1,
  isFighting: true,
  userAttackTimer: 0,
  monsterAttackTimer: 0,
  respawnTimer: 0,
  userAttacked: undefined,
  monsterAttacked: undefined,
  goldGained: undefined
})

function processTick(state: GameState, deltaMs: number): GameState {
  let {user, monster, currentStage, userAttackTimer, monsterAttackTimer, respawnTimer} = state
  let userAttacked = undefined
  let monsterAttacked = undefined
  let goldGained = undefined

  if (respawnTimer > 0) {
    respawnTimer -= deltaMs
    if (respawnTimer <= 0) {
      respawnTimer = 0
      monster = createMonster(currentStage)
    }

    return {
      ...state,
      respawnTimer,
      monster
    }
  }

  if (user.health > 0 && monster.health > 0) {
    userAttackTimer += deltaMs
    monsterAttackTimer += deltaMs

    if (userAttackTimer >= user.attackSpeed) {
      userAttackTimer -= user.attackSpeed
      const damageDealt = calculateDamageDealt(user.damage)
      const monsterNewHealth = healthAfterAttack(monster.health, damageDealt)
      monster = {...monster, health: monsterNewHealth}
      userAttacked = damageDealt

      if (monsterNewHealth <= 0) {
        const expGain = monster.expGain
        const newExp = user.experience + expGain

        if (newExp >= user.experienceToNextLevel) {
          const newLevel = user.level + 1
          user = {
            ...user,
            experience: newExp - user.experienceToNextLevel,
            level: newLevel,
            experienceToNextLevel: calculateExpToNextLevel(newLevel),
            maxHealth: user.maxHealth + 20,
            health: user.maxHealth + 20,
            damage: {from: user.damage.from + 2, to: user.damage.to + 2},
            attackSpeed: Math.max(user.attackSpeed - 5, 300)
          }
        } else {
          user = {...user, experience: newExp}
        }

        goldGained = calculateGoldGain(monster.goldGain)
        user.gold += goldGained
        currentStage += 1
        respawnTimer = RESPAWN_DELAY
        monsterAttackTimer = 0
      }
    }

    if (monster.health > 0 && monsterAttackTimer >= monster.attackSpeed) {
      monsterAttackTimer -= monster.attackSpeed
      const damageDealt = calculateDamageDealt(monster.damage)
      const userNewHealth = healthAfterAttack(user.health, damageDealt)
      user = {...user, health: userNewHealth}
      monsterAttacked = damageDealt

      if (userNewHealth <= 0) {
        return {
          ...state,
          user,
          monster,
          isFighting: false,
          userAttackTimer: 0,
          monsterAttackTimer: 0,
          respawnTimer: 0,
          userAttacked,
          monsterAttacked,
          goldGained: undefined
        }
      }
    }
  }

  return {
    ...state,
    user,
    monster,
    currentStage,
    userAttackTimer,
    monsterAttackTimer,
    respawnTimer,
    userAttacked,
    monsterAttacked,
    goldGained
  }
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TICK': {
      if (!state.isFighting) return state
      return processTick(state, action.deltaMs)
    }

    case 'SET_FIGHTING':
      return {...state, isFighting: action.value}

    case 'RESTART':
      return createInitialState({
        ...state.user,
        health: state.user.maxHealth
      })

    default:
      return state
  }
}

export default function IdleFightScreen() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)
  const {user, monster, currentStage, isFighting, respawnTimer, userAttacked, monsterAttacked, goldGained} = state

  const {
    userAnimatedStyle,
    monsterAnimatedStyle,
    monsterNumbers,
    userNumbers,
    removeMonsterDamage,
    removeUserDamage,
    resetAnimations
  } = useFightAnimations(userAttacked, monsterAttacked, goldGained)

  // Game loop refs
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastTickRef = useRef<number>(Date.now())

  function stopGameLoop() {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current)
      gameLoopRef.current = null
    }
  }

  // Game loop
  useEffect(() => {
    if (!isFighting) {
      console.log('stopping game loop')
      stopGameLoop()
      return
    }
    console.log('starting game loop')
    lastTickRef.current = Date.now()

    gameLoopRef.current = setInterval(() => {
      const now = Date.now()
      const deltaMs = now - lastTickRef.current
      lastTickRef.current = now
      dispatch({type: 'TICK', deltaMs})
    }, TICK_RATE)

    return () => stopGameLoop()
  }, [isFighting])

  const handleRestart = useCallback(() => {
    resetAnimations()
    dispatch({type: 'RESTART'})
  }, [resetAnimations])

  const isMonsterDead = monster.health <= 0

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerSpacer} />
        <Chip style={styles.goldChip} textStyle={styles.goldText} mode="flat">
          💰 {user.gold}
        </Chip>
      </Surface>
      <View style={styles.monsterSection}>
        <Card style={styles.monsterCard}>
          <Card.Content style={styles.monsterContent}>
            <Text variant="headlineSmall" style={styles.monsterLabel}>
              Stage {currentStage}
            </Text>
            <View style={styles.avatarWrapper}>
              <Animated.View
                style={[styles.monsterPlaceholder, monsterAnimatedStyle, isMonsterDead && styles.deadPlaceholder]}
              >
                <Text variant="displayLarge">{isMonsterDead ? '💀' : monster.img}</Text>
              </Animated.View>
              <FloatingNumbersContainer numbers={monsterNumbers} onFloatingComplete={removeMonsterDamage} />
            </View>
            <Text variant="headlineSmall" style={styles.userLabel}>
              {monster.name}
            </Text>
            <ProgressBarWithText current={monster.health} maxNumber={monster.maxHealth} />
            <Text variant="bodySmall" style={styles.statsText}>
              Attack: {monster.damage.from}-{monster.damage.to} | Speed: {monster.attackSpeed / 1000}s
              {respawnTimer > 0 && ` (respawn in ${Math.ceil(respawnTimer / 1000)}s)`}
            </Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.middleSection}>
        <Button mode="contained" onPress={handleRestart} style={styles.restartButton} buttonColor="#4a90e2">
          Restart
        </Button>
        {user.health <= 0 ? (
          <View style={styles.gameOverContainer}>
            <Text variant="headlineSmall" style={styles.gameOverText}>
              Game Over!
            </Text>
          </View>
        ) : !isFighting ? (
          <Button
            mode="contained"
            onPress={() => dispatch({type: 'SET_FIGHTING', value: true})}
            style={styles.restartButton}
            buttonColor="#4a90e2"
          >
            Fight!
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={() => dispatch({type: 'SET_FIGHTING', value: false})}
            style={styles.restartButton}
            buttonColor="#4a90e2"
          >
            Stop
          </Button>
        )}
      </View>

      <View style={styles.userSection}>
        <Card style={styles.userCard}>
          <Card.Content style={styles.userContent}>
            <View style={styles.avatarWrapper}>
              <Animated.View style={[styles.userPlaceholder, userAnimatedStyle]}>
                <Text variant="displayLarge">⚔️</Text>
              </Animated.View>
              <FloatingNumbersContainer numbers={userNumbers} onFloatingComplete={removeUserDamage} />
            </View>
            <Text variant="headlineSmall" style={styles.userLabel}>
              Hero Lv.{user.level}
            </Text>
            <ProgressBarWithText current={user.health} maxNumber={user.maxHealth} />
            <ProgressBarWithText
              current={user.experience}
              maxNumber={user.experienceToNextLevel}
              label="EXP"
              color="#ffd700"
              size="small"
            />
            <Text variant="bodySmall" style={styles.statsText}>
              Attack: {user.damage.from}-{user.damage.to} | Speed: {user.attackSpeed / 1000}s
            </Text>
          </Card.Content>
        </Card>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460'
  },
  headerSpacer: {
    flex: 1
  },
  goldChip: {
    backgroundColor: '#0f3460',
    borderColor: '#ffd700',
    borderWidth: 1
  },
  goldText: {
    color: '#ffd700',
    fontWeight: 'bold'
  },
  monsterSection: {
    justifyContent: 'flex-start',
    paddingTop: 10,
    paddingHorizontal: 16
  },
  monsterCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    elevation: 4
  },
  monsterContent: {
    alignItems: 'center',
    paddingVertical: 16
  },
  monsterLabel: {
    color: '#fff',
    marginBottom: 16,
    fontWeight: 'bold'
  },
  monsterPlaceholder: {
    width: 150,
    height: 150,
    backgroundColor: '#0f3460',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#e94560'
  },
  deadPlaceholder: {
    opacity: 0.5,
    borderColor: '#666'
  },
  statsText: {
    color: '#fff',
    opacity: 0.7,
    marginTop: 4
  },
  middleSection: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  gameOverContainer: {
    alignItems: 'center',
    gap: 16
  },
  gameOverText: {
    color: '#e94560',
    fontWeight: 'bold'
  },
  restartButton: {
    marginTop: 8,
    paddingHorizontal: 24
  },
  userSection: {
    justifyContent: 'flex-end',
    paddingBottom: 10,
    paddingHorizontal: 16
  },
  userCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    elevation: 4
  },
  userContent: {
    alignItems: 'center',
    paddingVertical: 16
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  userPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#0f3460',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4a90e2'
  },
  userLabel: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8
  }
})
