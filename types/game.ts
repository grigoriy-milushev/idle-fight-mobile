export interface Monster {
  id: string
  img: string
  name: string
  health: number
  maxHealth: number
  damage: Demage
  attackSpeed: number
  expGain: number
  goldGain: number
}

export interface User {
  health: number
  maxHealth: number
  damage: Demage
  attackSpeed: number
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
  userAttacked?: number
  monsterAttacked?: number
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
  | 'ring1'
  | 'ring2'
  | 'amulet'

export interface ItemStats {
  damage?: Demage
  armor?: number
  maxHealth?: number
  attackSpeed?: number // bonus/reduction in ms
}

export interface ItemDefinition {
  id: string
  name: string
  icon: string
  slot?: EquipmentSlotType
  rarity: ItemRarity
  stats: ItemStats
  description?: string
  consumableEffect?: {stat: StatType; amount: number}
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
  ring1: InventoryItem | null
  ring2: InventoryItem | null
  amulet: InventoryItem | null
}
