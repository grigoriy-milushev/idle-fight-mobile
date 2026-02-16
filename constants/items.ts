import {ItemDefinition, ItemRarity} from '@/types/game'

// Rarity colors for UI
export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9d9d9d',
  magic: '#4169e1',
  rare: '#ffd700',
  legendary: '#ff8c00'
}

export const EQUIPMENT_SLOTS = {
  helmet: {label: 'Helmet', icon: '🪖'},
  amulet: {label: 'Amulet', icon: '📿'},
  weapon: {label: 'Weapon', icon: '🗡️'},
  armor: {label: 'Armor', icon: '🧥'},
  offhand: {label: 'Offhand', icon: '🛡️'},
  gloves: {label: 'Gloves', icon: '🧤'},
  ring1: {label: 'Ring', icon: '💍'},
  ring2: {label: 'Ring', icon: '💍'},
  boots: {label: 'Boots', icon: '🥾'}
}

// Item definitions - all available items in the game
export const ITEMS: Record<string, ItemDefinition> = {
  // ============================================================================
  // WEAPONS
  // ============================================================================
  rusty_sword: {
    id: 'rusty_sword',
    name: 'Rusty Sword',
    icon: '🗡️',
    slot: 'weapon',
    rarity: 'common',
    stats: {damage: {from: 2, to: 5}},
    description: 'A worn blade, still sharp enough to cut.'
  },
  iron_sword: {
    id: 'iron_sword',
    name: 'Iron Sword',
    icon: '🗡️',
    slot: 'weapon',
    rarity: 'common',
    stats: {damage: {from: 4, to: 8}},
    description: 'A sturdy iron blade.'
  },
  steel_blade: {
    id: 'steel_blade',
    name: 'Steel Blade',
    icon: '⚔️',
    slot: 'weapon',
    rarity: 'magic',
    stats: {damage: {from: 6, to: 12}, strength: 2},
    description: 'Finely crafted steel with a keen edge.'
  },
  battle_axe: {
    id: 'battle_axe',
    name: 'Battle Axe',
    icon: '🪓',
    slot: 'weapon',
    rarity: 'magic',
    stats: {damage: {from: 8, to: 15}},
    description: 'Heavy and devastating in combat.'
  },
  hunters_bow: {
    id: 'hunters_bow',
    name: "Hunter's Bow",
    icon: '🏹',
    slot: 'weapon',
    rarity: 'common',
    stats: {damage: {from: 3, to: 7}, agility: 1},
    description: 'A reliable bow for hunting prey.'
  },
  war_hammer: {
    id: 'war_hammer',
    name: 'War Hammer',
    icon: '🔨',
    slot: 'weapon',
    rarity: 'rare',
    stats: {damage: {from: 10, to: 20}, strength: 3},
    description: 'Crushes armor and bones alike.'
  },
  magic_staff: {
    id: 'magic_staff',
    name: 'Magic Staff',
    icon: '🪄',
    slot: 'weapon',
    rarity: 'rare',
    stats: {damage: {from: 5, to: 10}, vitality: 5, maxHealth: 20},
    description: 'Channels arcane energies.'
  },
  doom_blade: {
    id: 'doom_blade',
    name: 'Doom Blade',
    icon: '🧿',
    slot: 'weapon',
    rarity: 'legendary',
    stats: {damage: {from: 15, to: 30}, strength: 5, attackSpeed: -100},
    description: 'A cursed blade that hungers for souls.'
  },

  // ============================================================================
  // HELMETS
  // ============================================================================
  leather_cap: {
    id: 'leather_cap',
    name: 'Leather Cap',
    icon: '🪖',
    slot: 'helmet',
    rarity: 'common',
    stats: {armor: 2, maxHealth: 5},
    description: 'Basic head protection.'
  },
  iron_helm: {
    id: 'iron_helm',
    name: 'Iron Helm',
    icon: '🪖',
    slot: 'helmet',
    rarity: 'magic',
    stats: {armor: 5, maxHealth: 10, vitality: 1},
    description: 'Solid iron protection for your head.'
  },
  crown_of_kings: {
    id: 'crown_of_kings',
    name: 'Crown of Kings',
    icon: '👑',
    slot: 'helmet',
    rarity: 'legendary',
    stats: {armor: 8, maxHealth: 25, strength: 3, agility: 3, vitality: 3},
    description: 'Worn by ancient rulers.'
  },

  // ============================================================================
  // ARMOR
  // ============================================================================
  cloth_tunic: {
    id: 'cloth_tunic',
    name: 'Cloth Tunic',
    icon: '🧥',
    slot: 'armor',
    rarity: 'common',
    stats: {armor: 3, maxHealth: 10},
    description: 'Simple cloth garment.'
  },
  leather_armor: {
    id: 'leather_armor',
    name: 'Leather Armor',
    icon: '🧥',
    slot: 'armor',
    rarity: 'common',
    stats: {armor: 6, maxHealth: 15},
    description: 'Flexible leather protection.'
  },
  chainmail: {
    id: 'chainmail',
    name: 'Chainmail',
    icon: '🧥',
    slot: 'armor',
    rarity: 'magic',
    stats: {armor: 10, maxHealth: 20, vitality: 2},
    description: 'Interlocking metal rings.'
  },
  plate_armor: {
    id: 'plate_armor',
    name: 'Plate Armor',
    icon: '🧥',
    slot: 'armor',
    rarity: 'rare',
    stats: {armor: 15, maxHealth: 30, vitality: 4, attackSpeed: 50},
    description: 'Heavy but extremely protective.'
  },

  // ============================================================================
  // GLOVES
  // ============================================================================
  cloth_gloves: {
    id: 'cloth_gloves',
    name: 'Cloth Gloves',
    icon: '🧤',
    slot: 'gloves',
    rarity: 'common',
    stats: {armor: 1},
    description: 'Simple hand coverings.'
  },
  leather_gloves: {
    id: 'leather_gloves',
    name: 'Leather Gloves',
    icon: '🧤',
    slot: 'gloves',
    rarity: 'common',
    stats: {armor: 2, agility: 1},
    description: 'Good grip and protection.'
  },
  gauntlets: {
    id: 'gauntlets',
    name: 'Steel Gauntlets',
    icon: '🧤',
    slot: 'gloves',
    rarity: 'magic',
    stats: {armor: 4, strength: 2, damage: {from: 1, to: 2}},
    description: 'Armored gloves that pack a punch.'
  },

  // ============================================================================
  // BOOTS
  // ============================================================================
  sandals: {
    id: 'sandals',
    name: 'Sandals',
    icon: '🥾',
    slot: 'boots',
    rarity: 'common',
    stats: {agility: 1},
    description: 'Light footwear.'
  },
  leather_boots: {
    id: 'leather_boots',
    name: 'Leather Boots',
    icon: '🥾',
    slot: 'boots',
    rarity: 'common',
    stats: {armor: 2, agility: 1},
    description: 'Sturdy walking boots.'
  },
  swift_boots: {
    id: 'swift_boots',
    name: 'Swift Boots',
    icon: '🥾',
    slot: 'boots',
    rarity: 'rare',
    stats: {armor: 3, agility: 4, attackSpeed: -75},
    description: 'Enchanted for speed.'
  },

  // ============================================================================
  // SHIELDS / OFFHAND
  // ============================================================================
  wooden_shield: {
    id: 'wooden_shield',
    name: 'Wooden Shield',
    icon: '🛡️',
    slot: 'offhand',
    rarity: 'common',
    stats: {armor: 5, maxHealth: 10},
    description: 'Basic wooden protection.'
  },
  iron_shield: {
    id: 'iron_shield',
    name: 'Iron Shield',
    icon: '🛡️',
    slot: 'offhand',
    rarity: 'magic',
    stats: {armor: 10, maxHealth: 20, vitality: 2},
    description: 'Heavy iron defense.'
  },
  tower_shield: {
    id: 'tower_shield',
    name: 'Tower Shield',
    icon: '🛡️',
    slot: 'offhand',
    rarity: 'rare',
    stats: {armor: 18, maxHealth: 35, vitality: 4, attackSpeed: 100},
    description: 'Maximum protection at the cost of speed.'
  },

  // ============================================================================
  // RINGS
  // ============================================================================
  copper_ring: {
    id: 'copper_ring',
    name: 'Copper Ring',
    icon: '💍',
    slot: 'ring1', // Can be equipped in either ring slot
    rarity: 'common',
    stats: {maxHealth: 5},
    description: 'A simple copper band.'
  },
  silver_ring: {
    id: 'silver_ring',
    name: 'Silver Ring',
    icon: '💍',
    slot: 'ring1',
    rarity: 'magic',
    stats: {maxHealth: 10, vitality: 1},
    description: 'A polished silver ring.'
  },
  ring_of_power: {
    id: 'ring_of_power',
    name: 'Ring of Power',
    icon: '💍',
    slot: 'ring1',
    rarity: 'rare',
    stats: {strength: 3, damage: {from: 2, to: 4}},
    description: 'Grants immense strength.'
  },
  ring_of_speed: {
    id: 'ring_of_speed',
    name: 'Ring of Speed',
    icon: '💍',
    slot: 'ring1',
    rarity: 'rare',
    stats: {agility: 4, attackSpeed: -50},
    description: 'Quickens your movements.'
  },

  // ============================================================================
  // AMULETS
  // ============================================================================
  bone_amulet: {
    id: 'bone_amulet',
    name: 'Bone Amulet',
    icon: '📿',
    slot: 'amulet',
    rarity: 'common',
    stats: {maxHealth: 10},
    description: 'Carved from ancient bones.'
  },
  jade_amulet: {
    id: 'jade_amulet',
    name: 'Jade Amulet',
    icon: '📿',
    slot: 'amulet',
    rarity: 'magic',
    stats: {maxHealth: 15, vitality: 2},
    description: 'Smooth jade brings vitality.'
  },
  amulet_of_fury: {
    id: 'amulet_of_fury',
    name: 'Amulet of Fury',
    icon: '📿',
    slot: 'amulet',
    rarity: 'legendary',
    stats: {strength: 5, agility: 3, damage: {from: 5, to: 8}, attackSpeed: -100},
    description: 'Channels raw fury into power.'
  }
}

// Helper to get item definition by id
export const getItemDefinition = (id: string): ItemDefinition | undefined => ITEMS[id]

// Default empty equipped items
export const createEmptyEquippedItems = () => ({
  helmet: null,
  armor: null,
  gloves: null,
  boots: null,
  weapon: null,
  offhand: null,
  ring1: null,
  ring2: null,
  amulet: null
})
