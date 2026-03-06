import {getItemDefinition} from '@/constants/items'
import {Demage, EquippedItems, ItemStats, User} from '@/types/game'

export const calculateExpToNextLevel = (level: number): number => Math.floor(100 * Math.pow(1.5, level - 1))
export const calculateDamageDealt = ({from, to}: Demage) => Math.floor(Math.random() * (to - from + 1)) + from
export const healthAfterAttack = (health: number, damage: number) => Math.max(0, health - damage)

export const calculateDamageFromStats = (strength: number): number => Math.floor(strength / 3)
export const calculateAttackSpeedFromStats = (agility: number): number => Math.floor(agility / 3) * 50
export const calculateMaxHealthFromStats = (vitality: number): number => vitality

export const BASE_DAMAGE = {from: 1, to: 3}
export const BASE_ATTACK_SPEED = 1000
export const BASE_MAX_HEALTH = 100

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
  }

  return bonuses
}

export const calculateEffectiveStats = (user: User, equipBonuses?: ItemStats) => {
  const strengthDmgBonus = calculateDamageFromStats(user.strength)

  return {
    damage: {
      from: BASE_DAMAGE.from + 20 + strengthDmgBonus + (equipBonuses?.damage?.from ?? 0),
      to: BASE_DAMAGE.to + 20 + strengthDmgBonus + (equipBonuses?.damage?.to ?? 0)
    },
    attackSpeed: Math.max(
      BASE_ATTACK_SPEED - calculateAttackSpeedFromStats(user.agility) + (equipBonuses?.attackSpeed ?? 0),
      100
    ),
    maxHealth: BASE_MAX_HEALTH + calculateMaxHealthFromStats(user.vitality) + (equipBonuses?.maxHealth ?? 0)
  }
}

export const calculateGoldGain = (maxGold: number): number => {
  const minGold = Math.floor(maxGold * 0.1)
  return Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold
}
