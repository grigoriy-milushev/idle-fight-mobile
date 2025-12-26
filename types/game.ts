export interface Monster {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  damage: number;
  attackSpeed: number;
}

export interface User {
  health: number;
  maxHealth: number;
  damage: number;
  attackSpeed: number;
  experience: number;
  level: number;
  experienceToNextLevel: number;
}
