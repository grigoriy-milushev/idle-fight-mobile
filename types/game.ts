export interface Monster {
  id: string
  img: string
  name: string
  health: number
  maxHealth: number
  damage: Demage
  attackSpeed: number
  critChance: number
  critDamage: number
  expGain: number
  goldGain: number
}

export interface User {
  health: number
  maxHealth: number
  damage: Demage
  attackSpeed: number
  critChance: number
  critDamage: number
  armor: number
  experience: number
  level: number
  experienceToNextLevel: number
  gold: number
  strength: number
  agility: number
  vitality: number
  statPoints: number
}

export type StatType = 'strength' | 'agility' | 'vitality'

export type Demage = {
  from: number
  to: number
}

export type DamageResult = {
  damage: number
  isCrit: boolean
}

export type GameState = {
  user: User
  monster: Monster
  currentStage: number
  isFighting: boolean
  userAttackTimer: number
  monsterAttackTimer: number
  respawnTimer: number
  equipped: EquippedItems
  inventory: InventoryItem[]
  userAttack?: DamageResult
  monsterAttack?: DamageResult
  goldGained?: number
}

// ============================================================================
// INVENTORY SYSTEM
// ============================================================================

export type ItemRarity = 'common' | 'magic' | 'rare' | 'legendary'

export type EquipmentSlotType =
  | 'helmet'
  | 'armor'
  | 'gloves'
  | 'boots'
  | 'weapon'
  | 'offhand'
  | 'ring'
  | 'amulet'
  | 'pocket1'
  | 'pocket2'

export interface ItemStats {
  damage?: Demage
  armor?: number
  maxHealth?: number
  attackSpeed?: number // bonus/reduction in ms
  critChance?: number // flat bonus (e.g. 0.05 = +5%)
  critDamage?: number // flat bonus (e.g. 0.25 = +25% crit multiplier)
}

export type ConsumableEffect =
  | {type: 'stat_boost'; stat: StatType; amount: number}
  | {type: 'heal'; amount: number}

export interface ItemDefinition {
  id: string
  name: string
  icon: string
  slot?: EquipmentSlotType
  rarity: ItemRarity
  stats: ItemStats
  description?: string
  consumableEffect?: ConsumableEffect
}

export interface InventoryItem {
  instanceId: string // unique per item instance
  definitionId: string
}

export interface EquippedItems {
  helmet: InventoryItem | null
  armor: InventoryItem | null
  gloves: InventoryItem | null
  boots: InventoryItem | null
  weapon: InventoryItem | null
  offhand: InventoryItem | null
  ring: InventoryItem | null
  amulet: InventoryItem | null
  pocket1: InventoryItem | null
  pocket2: InventoryItem | null
}
