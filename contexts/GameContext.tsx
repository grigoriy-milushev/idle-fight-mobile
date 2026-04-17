import {createEmptyEquippedItems, getItemDefinition} from '@/constants/items'
import {monsters} from '@/constants/monsters'
import {DamageResult, EquipmentSlotType, EquippedItems, GameState, InventoryItem, Monster, StatType, User} from '@/types/game'
import {
  BASE_ATTACK_SPEED,
  BASE_CRIT_CHANCE,
  BASE_CRIT_DAMAGE,
  BASE_DAMAGE,
  BASE_MAX_HEALTH,
  calculateDamageDealt,
  calculateEffectiveStats,
  calculateEquipmentBonuses,
  calculateExpToNextLevel,
  calculateGoldGain,
  healthAfterAttack
} from '@/utils/calculations'
import React, {Dispatch, ReactNode, createContext, useContext, useReducer} from 'react'

const RESPAWN_DELAY = 2000
const STAT_POINTS_PER_LEVEL = 3
const MAX_INVENTORY_SIZE = 30

export type GameAction =
  | {type: 'TICK'; deltaMs: number}
  | {type: 'SET_FIGHTING'; value: boolean}
  | {type: 'RESTART'}
  | {type: 'ALLOCATE_STAT'; stat: StatType; item?: InventoryItem}
  | {type: 'USE_CONSUMABLE'; item: InventoryItem}
  | {type: 'USE_POTION'; slot: 'pocket1' | 'pocket2'}
  | {type: 'EQUIP_ITEM'; item: InventoryItem; targetSlot: EquipmentSlotType}
  | {type: 'UNEQUIP_ITEM'; slotType: EquipmentSlotType}

const createTestInventory = (): InventoryItem[] => [
  {instanceId: 'test-1', definitionId: 'rusty_sword'},
  {instanceId: 'test-2', definitionId: 'leather_cap'},
  {instanceId: 'test-3', definitionId: 'cloth_tunic'},
  {instanceId: 'test-4', definitionId: 'wooden_shield'},
  {instanceId: 'test-5', definitionId: 'leather_boots'},
  {instanceId: 'test-6', definitionId: 'copper_ring'},
  {instanceId: 'test-7', definitionId: 'bone_amulet'},
  {instanceId: 'test-8', definitionId: 'cloth_gloves'},
  {instanceId: 'test-9', definitionId: 'steel_blade'},
  {instanceId: 'test-10', definitionId: 'iron_helm'},
  {instanceId: 'test-11', definitionId: 'chainmail'},
  {instanceId: 'test-12', definitionId: 'iron_shield'},
  {instanceId: 'test-13', definitionId: 'doom_blade'},
  {instanceId: 'test-14', definitionId: 'crown_of_kings'},
  {instanceId: 'test-15', definitionId: 'swift_boots'},
  {instanceId: 'test-16', definitionId: 'book_of_strength'},
  {instanceId: 'test-17', definitionId: 'book_of_agility'},
  {instanceId: 'test-18', definitionId: 'book_of_vitality'},
  {instanceId: 'test-19', definitionId: 'health_potion_small'},
  {instanceId: 'test-20', definitionId: 'health_potion_medium'},
  {instanceId: 'test-21', definitionId: 'health_potion_large'}
]

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
    critChance: BASE_CRIT_CHANCE,
    critDamage: BASE_CRIT_DAMAGE,
    maxHealth: BASE_MAX_HEALTH,
    armor: 0
  }

  const effectiveStats = calculateEffectiveStats(baseUser as User)

  return {
    ...baseUser,
    health: effectiveStats.maxHealth,
    maxHealth: effectiveStats.maxHealth,
    damage: effectiveStats.damage,
    attackSpeed: effectiveStats.attackSpeed,
    critChance: effectiveStats.critChance,
    critDamage: effectiveStats.critDamage,
    armor: effectiveStats.armor
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

function applyEffectiveStats(user: User, equipped: EquippedItems) {
  const equipBonuses = calculateEquipmentBonuses(equipped)
  return calculateEffectiveStats(user, equipBonuses)
}

function processTick(state: GameState, deltaMs: number): GameState {
  let {user, monster, currentStage, userAttackTimer, monsterAttackTimer, respawnTimer} = state
  let userAttack: DamageResult | undefined
  let monsterAttack: DamageResult | undefined

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
      userAttack = calculateDamageDealt(user.damage, undefined, user.critChance, user.critDamage)
      const monsterNewHealth = healthAfterAttack(monster.health, userAttack.damage)
      monster = {...monster, health: monsterNewHealth}

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
      monsterAttack = calculateDamageDealt(monster.damage, user.armor, monster.critChance, monster.critDamage)
      const userNewHealth = healthAfterAttack(user.health, monsterAttack.damage)
      user = {...user, health: userNewHealth}

      if (userNewHealth <= 0) {
        return {
          ...state,
          user,
          monster,
          isFighting: false,
          userAttackTimer: 0,
          monsterAttackTimer: 0,
          respawnTimer: 0,
          userAttack,
          monsterAttack,
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
    userAttack,
    monsterAttack,
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
      return {
        ...state,
        user: {...state.user, health: state.user.maxHealth},
        monster: createMonster(1),
        currentStage: 1,
        isFighting: true,
        userAttackTimer: 0,
        monsterAttackTimer: 0,
        respawnTimer: 0,
        userAttack: undefined,
        monsterAttack: undefined,
        goldGained: undefined
      }

    case 'ALLOCATE_STAT': {
      if (state.user.statPoints <= 0 && !action.item) return state
      const {stat, item} = action
      let amount = 1

      if (item) {
        const definition = getItemDefinition(item.definitionId)
        if (definition?.consumableEffect?.type === 'stat_boost') amount = definition.consumableEffect.amount
      }

      const updatedUser = {
        ...state.user,
        [stat]: state.user[stat] + amount,
        ...(item ? {} : {statPoints: state.user.statPoints - 1})
      }

      const effectiveStats = applyEffectiveStats(updatedUser, state.equipped)
      const healthIncrease = effectiveStats.maxHealth - state.user.maxHealth

      return {
        ...state,
        inventory: item ? state.inventory.filter((i) => i.instanceId !== item.instanceId) : state.inventory,
        user: {
          ...updatedUser,
          damage: effectiveStats.damage,
          attackSpeed: effectiveStats.attackSpeed,
          critChance: effectiveStats.critChance,
          critDamage: effectiveStats.critDamage,
          maxHealth: effectiveStats.maxHealth,
          armor: effectiveStats.armor,
          health: Math.min(updatedUser.health + healthIncrease, effectiveStats.maxHealth)
        }
      }
    }

    case 'USE_POTION': {
      const pocketItem = state.equipped[action.slot]
      if (!pocketItem) return state

      const item = getItemDefinition(pocketItem.definitionId)
      if (!item?.consumableEffect || item.consumableEffect.type !== 'heal') return state

      return {
        ...state,
        equipped: {...state.equipped, [action.slot]: null},
        user: {
          ...state.user,
          health: Math.min(state.user.health + item.consumableEffect.amount, state.user.maxHealth)
        }
      }
    }

    case 'EQUIP_ITEM': {
      const {item} = action
      let targetSlot = action.targetSlot
      if (targetSlot === 'pocket1' && state.equipped.pocket1 && !state.equipped.pocket2) targetSlot = 'pocket2'

      const prevEquippedItem = state.equipped[targetSlot]
      const inventoryAfterRemoval = state.inventory.filter((i) => i.instanceId !== item.instanceId)

      if (prevEquippedItem && inventoryAfterRemoval.length >= MAX_INVENTORY_SIZE) return state

      const newEquipped = {...state.equipped, [targetSlot]: item}
      const effectiveStats = applyEffectiveStats(state.user, newEquipped)
      const healthDiff = effectiveStats.maxHealth - state.user.maxHealth

      return {
        ...state,
        equipped: newEquipped,
        inventory: prevEquippedItem ? [...inventoryAfterRemoval, prevEquippedItem] : inventoryAfterRemoval,
        user: {
          ...state.user,
          damage: effectiveStats.damage,
          attackSpeed: effectiveStats.attackSpeed,
          critChance: effectiveStats.critChance,
          critDamage: effectiveStats.critDamage,
          maxHealth: effectiveStats.maxHealth,
          armor: effectiveStats.armor,
          health: Math.min(Math.max(1, state.user.health + healthDiff), effectiveStats.maxHealth)
        }
      }
    }

    case 'UNEQUIP_ITEM': {
      const item = state.equipped[action.slotType]
      if (!item || state.inventory.length >= MAX_INVENTORY_SIZE) return state

      const newEquipped = {...state.equipped, [action.slotType]: null}
      const effectiveStats = applyEffectiveStats(state.user, newEquipped)
      const healthDiff = effectiveStats.maxHealth - state.user.maxHealth

      return {
        ...state,
        equipped: newEquipped,
        inventory: [...state.inventory, item],
        user: {
          ...state.user,
          damage: effectiveStats.damage,
          attackSpeed: effectiveStats.attackSpeed,
          critChance: effectiveStats.critChance,
          critDamage: effectiveStats.critDamage,
          maxHealth: effectiveStats.maxHealth,
          armor: effectiveStats.armor,
          health: Math.min(Math.max(1, state.user.health + healthDiff), effectiveStats.maxHealth)
        }
      }
    }

    default:
      return state
  }
}

const createInitialState = (): GameState => ({
  user: createInitialUser(),
  monster: createMonster(1),
  currentStage: 1,
  isFighting: true,
  userAttackTimer: 0,
  monsterAttackTimer: 0,
  respawnTimer: 0,
  equipped: createEmptyEquippedItems(),
  inventory: createTestInventory(),
  userAttack: undefined,
  monsterAttack: undefined,
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
