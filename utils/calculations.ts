import { Demage } from "@/types/game";

export const calculateExpToNextLevel = (level: number): number =>
  Math.floor(100 * Math.pow(1.5, level - 1));

export function calculateDamageDealt({ from, to }: Demage) {
  return Math.floor(Math.random() * (to - from + 1)) + from;
}

export function healthAfterAttack(health: number, damage: number) {
  return Math.max(0, health - damage);
}

export function calculateGoldGain(maxGold: number): number {
  const minGold = Math.floor(maxGold * 0.1);
  return Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;
}
