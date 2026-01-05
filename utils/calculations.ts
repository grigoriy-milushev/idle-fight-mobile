import {Demage} from '@/types/game'

export const calculateExpToNextLevel = (level: number): number => Math.floor(100 * Math.pow(1.5, level - 1))

export const calculateDamageDealt = ({from, to}: Demage) => Math.floor(Math.random() * (to - from + 1)) + from

export const healthAfterAttack = (health: number, damage: number) => Math.max(0, health - damage)

export const calculateGoldGain = (maxGold: number): number => {
  const minGold = Math.floor(maxGold * 0.1)
  return Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold
}
