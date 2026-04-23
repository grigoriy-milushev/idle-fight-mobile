import {FloatingNumbersContainer} from '@/components/FloatingNumbersContainer'
import {ScreenHeader} from '@/components/ScreenHeader'
import {StatsModal, StatsSection} from '@/components/StatsModal'
import {ProgressBarWithText} from '@/components/ui/ProgressBarWithText'
import {RARITY_COLORS, getItemDefinition} from '@/constants/items'
import {useGameDispatch, useGameState} from '@/contexts/GameContext'
import {useFightAnimations} from '@/hooks/useFightAnimations'
import {ConsumableEffect, InventoryItem, StatType, User} from '@/types/game'
import {useIsFocused} from '@react-navigation/native'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {Button, Card, IconButton, Text} from 'react-native-paper'
import Animated from 'react-native-reanimated'
import {SafeAreaView} from 'react-native-safe-area-context'

const TICK_RATE = 100

const createHeroStatsSections = (user: User): StatsSection[] => [
  {
    stats: [
      {label: 'Level', value: user.level},
      {label: 'Attack Damage', value: `${user.damage.from} - ${user.damage.to}`},
      {label: 'Attack Speed', value: `${user.attackSpeed / 1000}s`},
      {label: 'Crit Chance', value: `${Math.round(user.critChance * 100)}%`},
      {label: 'Crit Damage', value: `${Math.round(user.critDamage * 100)}%`},
      {label: 'Max Health', value: user.maxHealth},
      {label: 'Armor', value: user.armor}
    ]
  },
  {
    title: 'Attributes',
    allocatable: true,
    stats: [
      {
        label: 'Strength',
        value: user.strength,
        statKey: 'strength',
        hint: 'Every 3 points: +1 damage'
      },
      {
        label: 'Agility',
        value: user.agility,
        statKey: 'agility',
        hint: 'Every 3 pts: +0.05s speed, every 5 pts: +1% crit'
      },
      {
        label: 'Vitality',
        value: user.vitality,
        statKey: 'vitality',
        hint: 'Every 1 point: +1 max health'
      }
    ]
  }
]

function PocketPotionButton({
  item,
  slot,
  onUse
}: {
  item: InventoryItem | null
  slot: 'pocket1' | 'pocket2'
  onUse: (slot: 'pocket1' | 'pocket2') => void
}) {
  if (!item) {
    return (
      <View style={[styles.pocketSlotBase, styles.pocketSlotEmpty]}>
        <Text style={styles.pocketSlotEmptyIcon}>🧪</Text>
      </View>
    )
  }

  const definition = getItemDefinition(item.definitionId)
  if (!definition) return null

  const rarityColor = RARITY_COLORS[definition.rarity]
  const healAmount = (definition.consumableEffect as ConsumableEffect & {type: 'heal'})?.amount

  return (
    <Pressable
      onPress={() => onUse(slot)}
      style={({pressed}) => [
        styles.pocketSlotBase,
        styles.pocketSlotFilled,
        {borderColor: rarityColor, backgroundColor: `${rarityColor}33`, opacity: pressed ? 0.6 : 1}
      ]}
    >
      <Text style={styles.pocketIcon}>{definition.icon}</Text>
      {healAmount && <Text style={styles.pocketHealText}>+{healAmount}</Text>}
    </Pressable>
  )
}

export default function IdleFightScreen() {
  const state = useGameState()
  const dispatch = useGameDispatch()
  const {user, monster, currentStage, isFighting, respawnTimer, userAttack, monsterAttack, goldGained, equipped} = state
  const [statsModalVisible, setStatsModalVisible] = useState(false)

  const {
    userAnimatedStyle,
    monsterAnimatedStyle,
    monsterNumbers,
    userNumbers,
    showFloatingNumber,
    removeMonsterDamage,
    removeUserDamage,
    resetAnimations
  } = useFightAnimations(userAttack, monsterAttack, goldGained)

  const isFocused = useIsFocused()

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
    if (!isFighting || !isFocused) {
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
  }, [isFighting, isFocused, dispatch])

  const handleRestart = useCallback(() => {
    resetAnimations()
    dispatch({type: 'RESTART'})
  }, [resetAnimations, dispatch])

  const isMonsterDead = monster.health <= 0
  const heroStatsSections = useMemo(() => createHeroStatsSections(user), [user])
  const handleAllocateStat = useCallback((stat: StatType) => dispatch({type: 'ALLOCATE_STAT', stat}), [dispatch])

  const handleUsePocketPotion = useCallback(
    (slot: 'pocket1' | 'pocket2') => {
      const pocketItem = equipped[slot]

      if (!pocketItem) return
      const def = getItemDefinition(pocketItem.definitionId)
      if (def?.consumableEffect?.type !== 'heal') return
      const healAmount = Math.min(def.consumableEffect.amount, user.maxHealth - user.health)
      if (healAmount <= 0) return

      showFloatingNumber(healAmount, 'user', 'heal')
      dispatch({type: 'USE_POTION', slot})
    },
    [dispatch, equipped, user.health, user.maxHealth, showFloatingNumber]
  )

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="Arena" />
      <View style={styles.monsterSection}>
        <Card style={styles.fighterCard}>
          <Card.Content style={styles.fighterContent}>
            <Text variant="headlineSmall" style={[styles.fighterLabel, styles.monsterLabel]}>
              Stage {currentStage}
            </Text>
            <View style={styles.avatarWrapper}>
              <Animated.View
                style={[
                  styles.fighterPlaceholder,
                  styles.monsterPlaceholder,
                  monsterAnimatedStyle,
                  isMonsterDead && styles.deadPlaceholder
                ]}
              >
                <Text variant="displayLarge">{isMonsterDead ? '💀' : monster.img}</Text>
              </Animated.View>
              <FloatingNumbersContainer numbers={monsterNumbers} onFloatingComplete={removeMonsterDamage} />
            </View>
            <Text variant="headlineSmall" style={styles.fighterLabel}>
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
        <Card style={styles.fighterCard}>
          <Card.Content style={styles.fighterContent}>
            <View style={styles.statsIconButton}>
              <IconButton
                icon="account-details"
                iconColor="#4a90e2"
                size={24}
                onPress={() => setStatsModalVisible(true)}
                style={{margin: 0}}
              />
              {user.statPoints > 0 && (
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeText}>{user.statPoints}</Text>
                </View>
              )}
            </View>
            <View style={styles.pocketSlots}>
              <PocketPotionButton item={equipped.pocket1} slot="pocket1" onUse={handleUsePocketPotion} />
              <PocketPotionButton item={equipped.pocket2} slot="pocket2" onUse={handleUsePocketPotion} />
            </View>
            <View style={styles.avatarWrapper}>
              <Animated.View style={[styles.fighterPlaceholder, styles.userPlaceholder, userAnimatedStyle]}>
                <Text variant="displayLarge">⚔️</Text>
              </Animated.View>
              <FloatingNumbersContainer numbers={userNumbers} onFloatingComplete={removeUserDamage} />
            </View>
            <Text variant="headlineSmall" style={[styles.fighterLabel, styles.userLabel]}>
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

      <StatsModal
        visible={statsModalVisible}
        onDismiss={() => setStatsModalVisible(false)}
        title="Hero Stats"
        sections={heroStatsSections}
        statPoints={user.statPoints}
        onAllocateStat={handleAllocateStat}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e'
  },
  monsterSection: {
    justifyContent: 'flex-start',
    paddingTop: 10,
    paddingHorizontal: 16
  },
  fighterCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    elevation: 4
  },
  fighterContent: {
    alignItems: 'center',
    paddingVertical: 16
  },
  fighterLabel: {
    color: '#fff',
    fontWeight: 'bold'
  },
  monsterLabel: {
    marginBottom: 16
  },
  fighterPlaceholder: {
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3
  },
  monsterPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
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
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  userPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderColor: '#4a90e2'
  },
  userLabel: {
    marginBottom: 8
  },
  statsIconButton: {
    position: 'absolute',
    top: 0,
    right: 0
  },
  statBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#4caf50',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4
  },
  statBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  pocketSlots: {
    position: 'absolute',
    top: 70,
    right: 8,
    gap: 6,
    zIndex: 1
  },
  pocketSlotBase: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pocketSlotEmpty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#444',
    backgroundColor: '#0f3460'
  },
  pocketSlotEmptyIcon: {
    fontSize: 16,
    opacity: 0.3
  },
  pocketSlotFilled: {
    borderWidth: 2
  },
  pocketIcon: {
    fontSize: 18
  },
  pocketHealText: {
    fontSize: 9,
    color: '#4ade80',
    fontWeight: 'bold',
    marginTop: -2
  }
})
