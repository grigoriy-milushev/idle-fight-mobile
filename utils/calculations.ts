import {getItemDefinition} from '@/constants/items'
import {DamageResult, Demage, EquippedItems, ItemStats, User} from '@/types/game'

export const calculateExpToNextLevel = (level: number): number => Math.floor(100 * Math.pow(1.5, level - 1))
export const healthAfterAttack = (health: number, damage: number) => Math.max(0, health - damage)

export const calculateDamageFromStats = (strength: number): number => Math.floor(strength / 3)
export const calculateAttackSpeedFromStats = (agility: number): number => Math.floor(agility / 3) * 50
export const calculateMaxHealthFromStats = (vitality: number): number => vitality
export const calculateCritChanceFromStats = (agility: number): number => Math.floor(agility / 5) * 0.01

export const BASE_DAMAGE = {from: 1, to: 3}
export const BASE_ATTACK_SPEED = 1000
export const BASE_MAX_HEALTH = 100
export const BASE_CRIT_CHANCE = 0.05
export const BASE_CRIT_DAMAGE = 1.5
const ARMOR_CONSTANT = 30
const MAX_ARMOR_REDUCTION = 0.8
const MAX_CRIT_CHANCE = 0.6

export const calculateEquipmentBonuses = (equipped: EquippedItems): ItemStats => {
  const bonuses: ItemStats = {}

  for (const item of Object.values(equipped)) {
    if (!item) continue
    const def = getItemDefinition(item.definitionId)
    if (!def) continue

    const {stats} = def
    if (stats.damage) {
      bonuses.damage = {
        from: (bonuses.damage?.from ?? 0) + stats.damage.from,
        to: (bonuses.damage?.to ?? 0) + stats.damage.to
      }
    }
    if (stats.armor) bonuses.armor = (bonuses.armor ?? 0) + stats.armor
    if (stats.maxHealth) bonuses.maxHealth = (bonuses.maxHealth ?? 0) + stats.maxHealth
    if (stats.attackSpeed) bonuses.attackSpeed = (bonuses.attackSpeed ?? 0) + stats.attackSpeed
    if (stats.critChance) bonuses.critChance = (bonuses.critChance ?? 0) + stats.critChance
    if (stats.critDamage) bonuses.critDamage = (bonuses.critDamage ?? 0) + stats.critDamage
  }

  return bonuses
}

export const calculateEffectiveStats = (user: User, equipBonuses?: ItemStats) => {
  const strengthDmgBonus = calculateDamageFromStats(user.strength)
  const maxHealth = BASE_MAX_HEALTH + calculateMaxHealthFromStats(user.vitality) + (equipBonuses?.maxHealth ?? 0)

  return {
    damage: {
      from: BASE_DAMAGE.from + strengthDmgBonus + (equipBonuses?.damage?.from ?? 0),
      to: BASE_DAMAGE.to + strengthDmgBonus + (equipBonuses?.damage?.to ?? 0)
    },
    attackSpeed: Math.max(
      BASE_ATTACK_SPEED - calculateAttackSpeedFromStats(user.agility) + (equipBonuses?.attackSpeed ?? 0),
      100
    ),
    maxHealth,
    health: Math.min(Math.max(1, user.health + (maxHealth - user.maxHealth)), maxHealth),
    armor: equipBonuses?.armor ?? 0,
    critChance: Math.min(
      BASE_CRIT_CHANCE + calculateCritChanceFromStats(user.agility) + (equipBonuses?.critChance ?? 0),
      MAX_CRIT_CHANCE
    ),
    critDamage: BASE_CRIT_DAMAGE + (equipBonuses?.critDamage ?? 0)
  }
}

export const calculateGoldGain = (maxGold: number): number => {
  const minGold = Math.floor(maxGold * 0.1)
  return Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold
}

// DAMAGE CALCULATIONS
export const calculateDamageDealt = (
  {from, to}: Demage,
  critChance: number,
  critDamage: number,
  armor?: number
): DamageResult => {
  const isCrit = Math.random() < critChance
  const roll = Math.floor(Math.random() * (to - from + 1)) + from
  const rawDamage = isCrit ? Math.floor(to * critDamage) : roll
  return {damage: calculateDamageAfterArmor(rawDamage, armor), isCrit}
}

const getArmorReduction = (armor: number): number => Math.min(armor / (armor + ARMOR_CONSTANT), MAX_ARMOR_REDUCTION)
const calculateDamageAfterArmor = (rawDamage: number, armor?: number): number => {
  return armor ? Math.max(1, Math.round(rawDamage * (1 - getArmorReduction(armor)))) : rawDamage
}
