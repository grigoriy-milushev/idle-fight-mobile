import {EQUIPMENT_SLOTS, getItemDefinition, RARITY_COLORS} from '@/constants/items'
import {EquippedItems, EquipmentSlotType, InventoryItem, ItemDefinition} from '@/types/game'
import React, {useCallback, useMemo, useState} from 'react'
import {Dimensions, Pressable, ScrollView, StyleSheet, View} from 'react-native'
import {Button, Dialog, Portal, Surface, Text} from 'react-native-paper'
import {SafeAreaView} from 'react-native-safe-area-context'

// ============================================================================
// CONSTANTS
// ============================================================================

const GRID_COLS = 5
const GRID_ROWS = 6
const CELL_SIZE = 52
const CELL_GAP = 4

const {width: SCREEN_WIDTH} = Dimensions.get('window')

// ============================================================================
// INITIAL TEST DATA
// ============================================================================

const createTestInventory = (): InventoryItem[] => [
  {instanceId: 'test-1', definitionId: 'rusty_sword'},
  {instanceId: 'test-2', definitionId: 'leather_cap'},
  {instanceId: 'test-3', definitionId: 'cloth_tunic'},
  {instanceId: 'test-4', definitionId: 'wooden_shield'},
  {instanceId: 'test-5', definitionId: 'leather_boots'},
  {instanceId: 'test-6', definitionId: 'copper_ring'},
  {instanceId: 'test-7', definitionId: 'bone_amulet'},
  {instanceId: 'test-8', definitionId: 'cloth_gloves'},
  {instanceId: 'test-9', definitionId: 'steel_blade'},
  {instanceId: 'test-10', definitionId: 'iron_helm'},
  {instanceId: 'test-11', definitionId: 'chainmail'},
  {instanceId: 'test-12', definitionId: 'iron_shield'},
  {instanceId: 'test-13', definitionId: 'doom_blade'},
  {instanceId: 'test-14', definitionId: 'crown_of_kings'},
  {instanceId: 'test-15', definitionId: 'swift_boots'}
]

const MAX_INVENTORY_SIZE = GRID_COLS * GRID_ROWS

const createEmptyEquipped = (): EquippedItems => ({
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

// ============================================================================
// ITEM CELL COMPONENT
// ============================================================================

interface ItemCellProps {
  item: InventoryItem
  definition: ItemDefinition
  cellSize: number
  onTap: (item: InventoryItem, isEquipped: boolean) => void
  isEquipped: boolean
}

function ItemCell({item, definition, cellSize, onTap, isEquipped}: ItemCellProps) {
  const rarityColor = RARITY_COLORS[definition.rarity]

  return (
    <Pressable
      onPress={() => onTap(item, isEquipped)}
      style={({pressed}) => [
        styles.itemCell,
        {
          width: cellSize,
          height: cellSize,
          borderColor: rarityColor,
          backgroundColor: `${rarityColor}33`,
          opacity: pressed ? 0.7 : 1
        }
      ]}
    >
      <Text style={styles.itemIcon}>{definition.icon}</Text>
    </Pressable>
  )
}

// ============================================================================
// EQUIPMENT SLOT COMPONENT
// ============================================================================

interface EquipmentSlotProps {
  slotType: EquipmentSlotType
  item: InventoryItem | null
  cellSize: number
  slotInfo: {label: string; icon: string}
  onTap: (item: InventoryItem, isEquipped: boolean) => void
}

function EquipmentSlot({slotType, item, cellSize, slotInfo, onTap}: EquipmentSlotProps) {
  const definition = item ? getItemDefinition(item.definitionId) : null

  return (
    <View
      style={[
        styles.equipmentSlot,
        {
          width: cellSize,
          height: cellSize
        }
      ]}
    >
      {item && definition ? (
        <ItemCell
          item={item}
          definition={definition}
          cellSize={cellSize - 4}
          onTap={onTap}
          isEquipped={true}
        />
      ) : (
        <View style={styles.emptySlot}>
          <Text style={styles.slotIcon}>{slotInfo.icon}</Text>
          <Text style={styles.slotLabel}>{slotInfo.label}</Text>
        </View>
      )}
    </View>
  )
}

// ============================================================================
// BACKPACK GRID COMPONENT
// ============================================================================

interface BackpackGridProps {
  items: InventoryItem[]
  cellSize: number
  onTap: (item: InventoryItem, isEquipped: boolean) => void
}

function BackpackGrid({items, cellSize, onTap}: BackpackGridProps) {
  // Create grid cells
  const gridCells = useMemo(() => {
    const cells = []
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        cells.push(
          <View
            key={`cell-${x}-${y}`}
            style={[
              styles.gridCell,
              {
                width: cellSize,
                height: cellSize,
                left: x * (cellSize + CELL_GAP),
                top: y * (cellSize + CELL_GAP)
              }
            ]}
          />
        )
      }
    }
    return cells
  }, [cellSize])

  // Render items - position calculated from array index
  const itemElements = useMemo(() => {
    return items.map((item, index) => {
      const definition = getItemDefinition(item.definitionId)
      if (!definition) return null

      const gridX = index % GRID_COLS
      const gridY = Math.floor(index / GRID_COLS)

      return (
        <View
          key={item.instanceId}
          style={[
            styles.itemWrapper,
            {
              left: gridX * (cellSize + CELL_GAP),
              top: gridY * (cellSize + CELL_GAP)
            }
          ]}
        >
          <ItemCell
            item={item}
            definition={definition}
            cellSize={cellSize}
            onTap={onTap}
            isEquipped={false}
          />
        </View>
      )
    })
  }, [items, cellSize, onTap])

  const gridWidth = GRID_COLS * (cellSize + CELL_GAP) - CELL_GAP
  const gridHeight = GRID_ROWS * (cellSize + CELL_GAP) - CELL_GAP

  return (
    <View style={[styles.backpackGrid, {width: gridWidth, height: gridHeight}]}>
      {gridCells}
      {itemElements}
    </View>
  )
}

// ============================================================================
// MAIN INVENTORY SCREEN
// ============================================================================

export default function InventoryScreen() {
  const [inventory, setInventory] = useState<InventoryItem[]>(createTestInventory)
  const [equipped, setEquipped] = useState<EquippedItems>(createEmptyEquipped)

  // Confirmation dialog state
  const [dialogVisible, setDialogVisible] = useState(false)
  const [dialogItem, setDialogItem] = useState<{item: InventoryItem; isEquipped: boolean} | null>(null)

  const cellSize = useMemo(() => {
    const availableWidth = SCREEN_WIDTH - 32 // padding
    return Math.min(CELL_SIZE, Math.floor((availableWidth - (GRID_COLS - 1) * CELL_GAP) / GRID_COLS))
  }, [])

  // Check if there's room in the backpack
  const hasRoom = useCallback(
    (excludeItem?: InventoryItem): boolean => {
      const count = excludeItem 
        ? inventory.filter(i => i.instanceId !== excludeItem.instanceId).length 
        : inventory.length
      return count < MAX_INVENTORY_SIZE
    },
    [inventory]
  )

  // Handle tap for equip/unequip confirmation
  const handleTap = useCallback((item: InventoryItem, isEquipped: boolean) => {
    setDialogItem({item, isEquipped})
    setDialogVisible(true)
  }, [])

  // Confirm equip/unequip
  const handleConfirmAction = useCallback(() => {
    if (!dialogItem) return

    const {item, isEquipped} = dialogItem
    const definition = getItemDefinition(item.definitionId)
    if (!definition) return

    if (isEquipped) {
      // Unequip: move to inventory
      if (hasRoom()) {
        const slotType = Object.entries(equipped).find(([_, v]) => v?.instanceId === item.instanceId)?.[0]
        if (slotType) {
          setEquipped(prev => ({
            ...prev,
            [slotType]: null
          }))
          setInventory(prev => [...prev, item])
        }
      }
    } else {
      // Equip: find appropriate slot
      let targetSlot: EquipmentSlotType = definition.slot

      // For rings, check which slot is available
      if (definition.slot === 'ring1') {
        if (equipped.ring1 === null) {
          targetSlot = 'ring1'
        } else if (equipped.ring2 === null) {
          targetSlot = 'ring2'
        }
      }

      const existingItem = equipped[targetSlot]

      setEquipped(prev => ({
        ...prev,
        [targetSlot]: item
      }))
      setInventory(prev => prev.filter(i => i.instanceId !== item.instanceId))

      // Move existing item to inventory (swap)
      if (existingItem && hasRoom(item)) {
        setInventory(prev => [...prev, existingItem])
      }
    }

    setDialogVisible(false)
    setDialogItem(null)
  }, [dialogItem, equipped, hasRoom])

  // Get dialog info
  const dialogInfo = useMemo(() => {
    if (!dialogItem) return null
    const definition = getItemDefinition(dialogItem.item.definitionId)
    if (!definition) return null

    const action = dialogItem.isEquipped ? 'Unequip' : 'Equip'
    const rarityColor = RARITY_COLORS[definition.rarity]

    // Format stats
    const stats: string[] = []
    if (definition.stats.damage) {
      stats.push(`Damage: ${definition.stats.damage.from}-${definition.stats.damage.to}`)
    }
    if (definition.stats.armor) stats.push(`Armor: ${definition.stats.armor}`)
    if (definition.stats.maxHealth) stats.push(`Max Health: +${definition.stats.maxHealth}`)
    if (definition.stats.strength) stats.push(`Strength: +${definition.stats.strength}`)
    if (definition.stats.agility) stats.push(`Agility: +${definition.stats.agility}`)
    if (definition.stats.vitality) stats.push(`Vitality: +${definition.stats.vitality}`)
    if (definition.stats.attackSpeed) {
      const speedText =
        definition.stats.attackSpeed < 0 ? `${definition.stats.attackSpeed}ms` : `+${definition.stats.attackSpeed}ms`
      stats.push(`Attack Speed: ${speedText}`)
    }

    return {
      action,
      name: definition.name,
      icon: definition.icon,
      rarityColor,
      description: definition.description,
      stats
    }
  }, [dialogItem])

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Surface style={styles.header} elevation={2}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Inventory
        </Text>
      </Surface>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Equipment Section */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Equipment
          </Text>
          <View style={styles.equipmentGrid}>
            {/* Row 0: Helmet, Amulet */}
            <View style={styles.equipmentRow}>
              <View style={[styles.equipmentCell, {width: cellSize}]} />
              <EquipmentSlot
                slotType="helmet"
                item={equipped.helmet}
                cellSize={cellSize}
                slotInfo={EQUIPMENT_SLOTS.find(s => s.type === 'helmet')!}
                onTap={handleTap}
              />
              <EquipmentSlot
                slotType="amulet"
                item={equipped.amulet}
                cellSize={cellSize}
                slotInfo={EQUIPMENT_SLOTS.find(s => s.type === 'amulet')!}
                onTap={handleTap}
              />
            </View>

            {/* Row 1: Weapon, Armor, Offhand */}
            <View style={styles.equipmentRow}>
              <EquipmentSlot
                slotType="weapon"
                item={equipped.weapon}
                cellSize={cellSize}
                slotInfo={EQUIPMENT_SLOTS.find(s => s.type === 'weapon')!}
                onTap={handleTap}
              />
              <EquipmentSlot
                slotType="armor"
                item={equipped.armor}
                cellSize={cellSize}
                slotInfo={EQUIPMENT_SLOTS.find(s => s.type === 'armor')!}
                onTap={handleTap}
              />
              <EquipmentSlot
                slotType="offhand"
                item={equipped.offhand}
                cellSize={cellSize}
                slotInfo={EQUIPMENT_SLOTS.find(s => s.type === 'offhand')!}
                onTap={handleTap}
              />
            </View>

            {/* Row 2: Gloves, Ring1, Ring2 */}
            <View style={styles.equipmentRow}>
              <EquipmentSlot
                slotType="gloves"
                item={equipped.gloves}
                cellSize={cellSize}
                slotInfo={EQUIPMENT_SLOTS.find(s => s.type === 'gloves')!}
                onTap={handleTap}
              />
              <EquipmentSlot
                slotType="ring1"
                item={equipped.ring1}
                cellSize={cellSize}
                slotInfo={EQUIPMENT_SLOTS.find(s => s.type === 'ring1')!}
                onTap={handleTap}
              />
              <EquipmentSlot
                slotType="ring2"
                item={equipped.ring2}
                cellSize={cellSize}
                slotInfo={EQUIPMENT_SLOTS.find(s => s.type === 'ring2')!}
                onTap={handleTap}
              />
            </View>

            {/* Row 3: Boots */}
            <View style={styles.equipmentRow}>
              <View style={[styles.equipmentCell, {width: cellSize}]} />
              <EquipmentSlot
                slotType="boots"
                item={equipped.boots}
                cellSize={cellSize}
                slotInfo={EQUIPMENT_SLOTS.find(s => s.type === 'boots')!}
                onTap={handleTap}
              />
              <View style={[styles.equipmentCell, {width: cellSize}]} />
            </View>
          </View>
        </View>

        {/* Backpack Section */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Backpack
          </Text>
          <View style={styles.backpackContainer}>
            <BackpackGrid items={inventory} cellSize={cellSize} onTap={handleTap} />
          </View>
        </View>
      </ScrollView>

      {/* Equip/Unequip Confirmation Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
          <View style={styles.dialogHeader}>
            <Text style={[styles.dialogTitle, dialogInfo && {color: dialogInfo.rarityColor}]}>
              {dialogInfo ? `${dialogInfo.icon} ${dialogInfo.name}` : ''}
            </Text>
          </View>
          <Dialog.Content>
            {dialogInfo?.description && <Text style={styles.dialogDescription}>{dialogInfo.description}</Text>}
            <View style={styles.dialogStats}>
              {dialogInfo?.stats.map((stat, i) => (
                <Text key={i} style={styles.dialogStat}>
                  {stat}
                </Text>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)} textColor="#888">
              Cancel
            </Button>
            <Button onPress={handleConfirmAction} mode="contained" buttonColor="#4a90e2">
              {dialogInfo?.action ?? 'Equip'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  )
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460'
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold'
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: 16,
    gap: 16
  },
  section: {
    gap: 8
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: 'bold'
  },
  equipmentGrid: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 12,
    gap: CELL_GAP
  },
  equipmentRow: {
    flexDirection: 'row',
    gap: CELL_GAP,
    justifyContent: 'center'
  },
  equipmentCell: {
    height: CELL_SIZE
  },
  equipmentSlot: {
    borderWidth: 2,
    borderRadius: 8,
    borderStyle: 'dashed',
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f3460'
  },
  emptySlot: {
    alignItems: 'center',
    gap: 2
  },
  slotIcon: {
    fontSize: 18,
    opacity: 0.5
  },
  slotLabel: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center'
  },
  backpackContainer: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center'
  },
  backpackGrid: {
    position: 'relative'
  },
  gridCell: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 6,
    borderColor: '#333',
    backgroundColor: '#0f3460'
  },
  itemWrapper: {
    position: 'absolute'
  },
  itemCell: {
    borderWidth: 2,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  itemIcon: {
    fontSize: 24
  },
  dialog: {
    backgroundColor: '#16213e'
  },
  dialogHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  dialogDescription: {
    color: '#aaa',
    marginBottom: 12,
    fontStyle: 'italic'
  },
  dialogStats: {
    gap: 4
  },
  dialogStat: {
    color: '#4ade80',
    fontSize: 14
  }
})
