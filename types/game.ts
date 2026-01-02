export interface Monster {
  id: string;
  img: string;
  name: string;
  health: number;
  maxHealth: number;
  damage: Demage;
  attackSpeed: number;
  expGain: number;
}

export interface User {
  health: number;
  maxHealth: number;
  damage: Demage;
  attackSpeed: number;
  experience: number;
  level: number;
  experienceToNextLevel: number;
}

export type Demage = {
  from: number;
  to: number;
};

export type GameState = {
  user: User;
  monster: Monster;
  currentStage: number;
  isFighting: boolean;
  userAttackTimer: number;
  monsterAttackTimer: number;
  respawnTimer: number;
  userAttackedDamage?: number;
  monsterAttackedDamage?: number;
};
