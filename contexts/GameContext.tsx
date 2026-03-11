import {monsters} from '@/constants/monsters'
import {GameState, ItemStats, Monster, StatType, User} from '@/types/game'
import {
  BASE_ATTACK_SPEED,
  BASE_DAMAGE,
  BASE_MAX_HEALTH,
  calculateDamageDealt,
  calculateEffectiveStats,
  calculateExpToNextLevel,
  calculateGoldGain,
  healthAfterAttack
} from '@/utils/calculations'
import React, {Dispatch, ReactNode, createContext, useContext, useReducer} from 'react'

const RESPAWN_DELAY = 2000
const STAT_POINTS_PER_LEVEL = 3

export type GameAction =
  | {type: 'TICK'; deltaMs: number}
  | {type: 'SET_FIGHTING'; value: boolean}
  | {type: 'RESTART'}
  | {type: 'ALLOCATE_STAT'; stat: StatType; amount?: number; equipBonuses?: ItemStats}
  | {type: 'UPDATE_EQUIPMENT'; equipBonuses: ItemStats}

const createInitialUser = (): User => {
  const baseUser = {
    strength: 0,
    agility: 0,
    vitality: 0,
    statPoints: 0,
    experience: 0,
    level: 1,
    experienceToNextLevel: calculateExpToNextLevel(1),
    gold: 0,
    damage: {from: BASE_DAMAGE.from, to: BASE_DAMAGE.to},
    attackSpeed: BASE_ATTACK_SPEED,
    maxHealth: BASE_MAX_HEALTH
  }

  const effectiveStats = calculateEffectiveStats(baseUser as User)

  return {
    ...baseUser,
    health: effectiveStats.maxHealth,
    maxHealth: effectiveStats.maxHealth,
    damage: effectiveStats.damage,
    attackSpeed: effectiveStats.attackSpeed
  }
}

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

function processTick(state: GameState, deltaMs: number): GameState {
  let {user, monster, currentStage, userAttackTimer, monsterAttackTimer, respawnTimer} = state
  let userAttacked = undefined
  let monsterAttacked = undefined

  if (respawnTimer > 0) {
    respawnTimer -= deltaMs
    if (respawnTimer <= 0) {
      respawnTimer = 0
      monster = createMonster(currentStage)
    }

    return {...state, respawnTimer, monster}
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
            health: user.maxHealth,
            statPoints: user.statPoints + STAT_POINTS_PER_LEVEL
          }
        } else {
          user = {...user, experience: newExp}
        }

        user.gold += calculateGoldGain(monster.goldGain)
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
  console.log(state.user.gold, user.gold, 'gold')
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
    goldGained: user.gold - state.user.gold
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

    case 'ALLOCATE_STAT': {
      if (state.user.statPoints <= 0 && !action.amount) return state

      const updatedUser = {
        ...state.user,
        [action.stat]: state.user[action.stat] + (action.amount ?? 1),
        ...(action.amount ? {} : {statPoints: state.user.statPoints - 1})
      }

      const effectiveStats = calculateEffectiveStats(updatedUser, action.equipBonuses)
      const healthIncrease = effectiveStats.maxHealth - state.user.maxHealth

      return {
        ...state,
        user: {
          ...updatedUser,
          damage: effectiveStats.damage,
          attackSpeed: effectiveStats.attackSpeed,
          maxHealth: effectiveStats.maxHealth,
          health: Math.min(updatedUser.health + healthIncrease, effectiveStats.maxHealth)
        }
      }
    }

    case 'UPDATE_EQUIPMENT': {
      const effectiveStats = calculateEffectiveStats(state.user, action.equipBonuses)
      const healthDiff = effectiveStats.maxHealth - state.user.maxHealth

      return {
        ...state,
        user: {
          ...state.user,
          damage: effectiveStats.damage,
          attackSpeed: effectiveStats.attackSpeed,
          maxHealth: effectiveStats.maxHealth,
          health: Math.min(Math.max(1, state.user.health + healthDiff), effectiveStats.maxHealth)
        }
      }
    }

    default:
      return state
  }
}

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

const GameStateContext = createContext<GameState | null>(null)
const GameDispatchContext = createContext<Dispatch<GameAction> | null>(null)

export function GameProvider({children}: {children: ReactNode}) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)

  return (
    <GameDispatchContext.Provider value={dispatch}>
      <GameStateContext.Provider value={state}>{children}</GameStateContext.Provider>
    </GameDispatchContext.Provider>
  )
}

export function useGameState() {
  const context = useContext(GameStateContext)
  if (!context) throw new Error('useGameState must be used within GameProvider')
  return context
}

export function useGameDispatch() {
  const context = useContext(GameDispatchContext)
  if (!context) throw new Error('useGameDispatch must be used within GameProvider')
  return context
}
