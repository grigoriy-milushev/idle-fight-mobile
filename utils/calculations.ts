import {Demage, User} from '@/types/game'

export const calculateExpToNextLevel = (level: number): number => Math.floor(100 * Math.pow(1.5, level - 1))
export const calculateDamageDealt = ({from, to}: Demage) => Math.floor(Math.random() * (to - from + 1)) + from
export const healthAfterAttack = (health: number, damage: number) => Math.max(0, health - damage)

export const calculateDamageFromStats = (strength: number): number => Math.floor(strength / 3)
export const calculateAttackSpeedFromStats = (agility: number): number => Math.floor(agility / 3) * 50
export const calculateMaxHealthFromStats = (vitality: number): number => vitality

export const BASE_DAMAGE = {from: 1, to: 3}
export const BASE_ATTACK_SPEED = 1000
export const BASE_MAX_HEALTH = 100

export const calculateEffectiveStats = (user: User) => {
  const strengthBonus = calculateDamageFromStats(user.strength)

  return {
    damage: {
      from: BASE_DAMAGE.from + 20 + strengthBonus,
      to: BASE_DAMAGE.to + 20 + strengthBonus
    },
    attackSpeed: Math.max(BASE_ATTACK_SPEED - calculateAttackSpeedFromStats(user.agility), 100),
    maxHealth: BASE_MAX_HEALTH + calculateMaxHealthFromStats(user.vitality)
  }
}

export const calculateGoldGain = (maxGold: number): number => {
  const minGold = Math.floor(maxGold * 0.1)
  return Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold
}
