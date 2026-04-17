import {Monster} from '@/types/game'

export const monsters: Monster[] = [
  {
    id: 'goblin',
    img: '👹',
    name: 'Goblin',
    health: 50,
    maxHealth: 50,
    damage: {from: 1, to: 3},
    attackSpeed: 3000,
    critChance: 0.02,
    critDamage: 1.3,
    expGain: 20,
    goldGain: 10
  },
  {
    id: 'orc',
    img: '👺',
    name: 'Orc',
    health: 80,
    maxHealth: 80,
    damage: {from: 3, to: 6},
    attackSpeed: 2800,
    critChance: 0.03,
    critDamage: 1.4,
    expGain: 35,
    goldGain: 20
  },
  {
    id: 'troll',
    img: '🧟',
    name: 'Troll',
    health: 120,
    maxHealth: 120,
    damage: {from: 5, to: 10},
    attackSpeed: 2600,
    critChance: 0.03,
    critDamage: 1.4,
    expGain: 50,
    goldGain: 30
  },
  {
    id: 'ogre',
    img: '🧌',
    name: 'Ogre',
    health: 170,
    maxHealth: 170,
    damage: {from: 8, to: 15},
    attackSpeed: 2400,
    critChance: 0.04,
    critDamage: 1.5,
    expGain: 70,
    goldGain: 40
  },
  {
    id: 'demon',
    img: '😈',
    name: 'Demon',
    health: 230,
    maxHealth: 230,
    damage: {from: 12, to: 20},
    attackSpeed: 2200,
    critChance: 0.05,
    critDamage: 1.5,
    expGain: 95,
    goldGain: 50
  },
  {
    id: 'wraith',
    img: '👻',
    name: 'Wraith',
    health: 300,
    maxHealth: 300,
    damage: {from: 16, to: 28},
    attackSpeed: 2000,
    critChance: 0.06,
    critDamage: 1.6,
    expGain: 125,
    goldGain: 60
  },
  {
    id: 'vampire',
    img: '🧛',
    name: 'Vampire',
    health: 380,
    maxHealth: 380,
    damage: {from: 22, to: 36},
    attackSpeed: 1800,
    critChance: 0.08,
    critDamage: 1.7,
    expGain: 160,
    goldGain: 70
  },
  {
    id: 'wizzard',
    img: '🧙',
    name: 'Wizzard',
    health: 470,
    maxHealth: 470,
    damage: {from: 28, to: 45},
    attackSpeed: 1600,
    critChance: 0.07,
    critDamage: 1.8,
    expGain: 200,
    goldGain: 80
  },
  {
    id: 'hydra',
    img: '🐉',
    name: 'Hydra',
    health: 580,
    maxHealth: 580,
    damage: {from: 35, to: 55},
    attackSpeed: 1400,
    critChance: 0.08,
    critDamage: 1.8,
    expGain: 250,
    goldGain: 90
  },
  {
    id: 'dark-lord',
    img: '👑',
    name: 'Dark Lord',
    health: 1000,
    maxHealth: 1000,
    damage: {from: 50, to: 80},
    attackSpeed: 1200,
    critChance: 0.10,
    critDamage: 2.0,
    expGain: 500,
    goldGain: 100
  }
]

// 🐺 Wild Wolf
// 🐗 Rage Boar
// 🦅 Sky Raptor
// 🐍 Venom Serpent
// 🦂 Sand Scorcher
// 🐻 Dire Bear
// 🐐 Horned Beast
// 🦇 Night Bat
// 🐝 Swarm Stinger
// 🐸 Bog Lurker
// 🦴 Bone Walker
// 🕷️ Shadow Spider

// 🐀 Plague Rat
// 🧟‍♂️ Rotting Ghoul
// 👁️ Watcher Orb
// 🕯️ Cursed Flame
// 🪱 Crypt Worm
// 🧛‍♂️ Blood Thrall
// 🪦 Grave Spirit
// 🗡️ Possessed Blade
// 😈 Hell Imp
// 👹 Abyss Brute
// 🔥 Flame Wraith
// 🐲 Lesser Drake
// 👁️‍🗨️ Void Eye
// 🦑 Mind Devourer
// 🩸 Blood Horror
// ⚡ Storm Fiend
// 👑 Demon Lord Minion
// ✨
// 🌙

// 🌿 Field / Nature Monsters
// 🐺
// 🐗
// 🦌
// 🐍
// 🦂
// 🐻
// 🐐
// 🦅
// 🐝
// 🐸
// 🦊
// 🐊
// 🐢
// 🦎
// 🐌

// 🕯️ Dungeon / Undead Monsters
// 💀
// 🦴
// 🧟
// 🧟‍♂️
// 🧟‍♀️
// 👻
// ☠️
// 🪦
// 🕷️
// 🕸️

// 🧛 Dark / Cursed Enemies
// 🧛
// 🧛‍♂️
// 🧛‍♀️
// 🦇
// 👁️
// 🕯️
// 🔮
// 🗡️
// ⚰️
// 🩸

// 🔥 Fire / Hell Monsters
// 😈
// 👹
// 🔥
// 🐲
// 🌋
// 💣
// ⚡
// 🧨
// 🌪️
// ☄️

// ❄️ Ice / Cold Zone
// ❄️
// 🧊
// 🥶
// 🐧
// 🐻‍❄️
// 🦭
// 🌨️
// ⛄
// 🧤
// 🏔️

// 🧠 Psychic / Weird Monsters
// 👁️‍🗨️
// 🧠
// 🦑
// 🐙
// 🌀
// 🌑
// 🌒
// 🕳️
// 🪐
// 🌌

// 🤖 Construct / Mechanical
// 🤖
// ⚙️
// 🛠️
// 🔩
// 🧲
// 🪛
// 🏗️
// 🧱
// 🔋
// 🪤

// 👑 Boss / Elite Monsters
// 👑
// 🐉
// 🐲
// 👁️
// 💀
// 👹
// 🧛
// 🔥
// 🌑
// ⚡

// 🪐 Late-Game / Cosmic
// 🌍
// 🌕
// 🌑
// ☄️
// 🪐
