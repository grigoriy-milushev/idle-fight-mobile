import {EQUIPMENT_SLOTS, getItemDefinition, RARITY_COLORS} from '@/constants/items'
import {useGameDispatch} from '@/contexts/GameContext'
import {useInventory} from '@/contexts/InventoryContext'
import {EquipmentSlotType, InventoryItem, ItemDefinition} from '@/types/game'
import React, {useCallback, useMemo, useState} from 'react'
import {Dimensions, Pressable, ScrollView, StyleSheet, View} from 'react-native'
import {Button, Dialog, Portal, Surface, Text} from 'react-native-paper'
import {SafeAreaView} from 'react-native-safe-area-context'

const GRID_COLS = 5
const GRID_ROWS = 6
const MAX_INVENTORY_SIZE = GRID_COLS * GRID_ROWS

const CELL_SIZE = 52
const CELL_GAP = 4

const {width: SCREEN_WIDTH} = Dimensions.get('window')

function ItemCell({definition, onTap}: {definition: ItemDefinition; onTap: () => void}) {
  const rarityColor = RARITY_COLORS[definition.rarity]

  return (
    <Pressable
      onPress={onTap}
      style={({pressed}) => [
        styles.itemCell,
        {
          width: CELL_SIZE,
          height: CELL_SIZE,
          borderColor: rarityColor,
          backgroundColor: `${rarityColor}33`, // TODO:
          opacity: pressed ? 0.7 : 1
        }
      ]}
    >
      <Text style={styles.itemIcon}>{definition.icon}</Text>
    </Pressable>
  )
}

function EquipmentSlot({
  item,
  slotInfo,
  onTap
}: {
  item: InventoryItem | null
  slotInfo: {label: string; icon: string}
  onTap: (item: InventoryItem, isEquipped: boolean) => void
}) {
  const definition = item && getItemDefinition(item.definitionId)

  return (
    <View style={[styles.equipmentSlot]}>
      {definition ? (
        <ItemCell definition={definition} onTap={() => onTap(item, true)} />
      ) : (
        <View style={styles.emptySlot}>
          <Text style={styles.slotIcon}>{slotInfo.icon}</Text>
          <Text style={styles.slotLabel}>{slotInfo.label}</Text>
        </View>
      )}
    </View>
  )
}

//TODO: GRID is too complex, simplify this
function BackpackGrid({
  items,
  onTap
}: {
  items: InventoryItem[]
  onTap: (item: InventoryItem, isEquipped: boolean) => void
}) {
  const gridCells = useMemo(() => {
    const cells = []
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        cells.push(
          <View
            key={`cell-${x}-${y}`}
            style={[styles.gridCell, {left: x * (CELL_SIZE + CELL_GAP), top: y * (CELL_SIZE + CELL_GAP)}]}
          />
        )
      }
    }
    return cells
  }, [])

  // Render items - position calculated from array index
  const itemElements = useMemo(() => {
    return items.map((item, index) => {
      const definition = getItemDefinition(item.definitionId)
      if (!definition) return null

      //TODO: too complex, simplify this
      const gridX = index % GRID_COLS
      const gridY = Math.floor(index / GRID_COLS)

      return (
        <View
          key={item.instanceId}
          style={[styles.itemWrapper, {left: gridX * (CELL_SIZE + CELL_GAP), top: gridY * (CELL_SIZE + CELL_GAP)}]}
        >
          <ItemCell definition={definition} onTap={() => onTap(item, false)} />
        </View>
      )
    })
  }, [items, onTap])

  //TODO: too complex, maybe we should just use a Dispaly: flex with gap
  const gridWidth = GRID_COLS * (CELL_SIZE + CELL_GAP) - CELL_GAP
  const gridHeight = GRID_ROWS * (CELL_SIZE + CELL_GAP) - CELL_GAP

  return (
    <View style={[styles.backpackGrid, {width: gridWidth, height: gridHeight}]}>
      {gridCells}
      {itemElements}
    </View>
  )
}

export default function InventoryScreen() {
  const {equipped, inventory, equipmentBonuses, setEquipped, setInventory} = useInventory()
  const dispatch = useGameDispatch()
  const [dialogItem, setDialogItem] = useState<{item: InventoryItem; isEquipped: boolean} | null>(null)

  // TODO: too complex, simplify this
  const cellSize = useMemo(() => {
    const availableWidth = SCREEN_WIDTH - 32 // padding
    return Math.min(CELL_SIZE, Math.floor((availableWidth - (GRID_COLS - 1) * CELL_GAP) / GRID_COLS))
  }, [])

  // Check if there's room in the backpack
  const hasRoom = useCallback(
    (excludeItem?: InventoryItem): boolean => {
      const count = excludeItem
        ? inventory.filter((item) => item.instanceId !== excludeItem.instanceId).length // TODO: lenght - 1 for excluded
        : inventory.length
      return count < MAX_INVENTORY_SIZE
    },
    [inventory]
  )

  const handleTap = useCallback((item: InventoryItem, isEquipped: boolean) => {
    setDialogItem({item, isEquipped})
  }, [])

  // Confirm equip/unequip/use
  //TODO: no notifications for errors of empty space
  const handleConfirmAction = useCallback(() => {
    if (!dialogItem) return

    const {item, isEquipped} = dialogItem
    const definition = getItemDefinition(item.definitionId)
    if (!definition) return

    if (definition.consumableEffect) {
      dispatch({
        type: 'ALLOCATE_STAT',
        stat: definition.consumableEffect.stat,
        amount: definition.consumableEffect.amount,
        equipBonuses: equipmentBonuses
      })
      setInventory((prev) => prev.filter((i) => i.instanceId !== item.instanceId))
      setDialogItem(null)
      return
    }

    if (isEquipped && hasRoom()) {
      const slotType = (Object.keys(equipped) as EquipmentSlotType[]).find(
        (type) => equipped[type]?.instanceId === item.instanceId
      )
      if (slotType) {
        setEquipped((prev) => ({...prev, [slotType]: null}))
        setInventory((prev) => [...prev, item])
      }
    } else if (definition.slot) {
      let targetSlot = definition.slot

      // For rings, check which slot is available
      //TODO: bug if slot is of ring2, alos it is complex
      if (definition.slot === 'ring1') {
        if (equipped.ring1 === null) {
          targetSlot = 'ring1'
        } else if (equipped.ring2 === null) {
          targetSlot = 'ring2'
        }
      }

      const existingItem = equipped[targetSlot]

      setEquipped((prev) => ({...prev, [targetSlot]: item}))
      //TODO checck hasr romm and instead of tow setInventory use one that replaces
      setInventory((prev) => prev.filter((prevItem) => prevItem.instanceId !== item.instanceId))

      // Move existing item to inventory (swap)
      if (existingItem && hasRoom(item)) {
        setInventory((prev) => [...prev, existingItem])
      }
    }

    setDialogItem(null)
  }, [dialogItem, equipped, equipmentBonuses, hasRoom, setEquipped, setInventory, dispatch])

  // ----------------------------------------------------------------------------

  // Get dialog info
  const dialogInfo = useMemo(() => {
    if (!dialogItem) return null
    const definition = getItemDefinition(dialogItem.item.definitionId)
    if (!definition) return null
    const {name, icon, rarity, description, stats, consumableEffect} = definition

    const action = !!consumableEffect ? 'Use' : dialogItem.isEquipped ? 'Unequip' : 'Equip'
    const rarityColor = RARITY_COLORS[rarity]

    const statsDescription: string[] = []
    if (consumableEffect) {
      const statLabel = consumableEffect.stat.charAt(0).toUpperCase() + consumableEffect.stat.slice(1)
      statsDescription.push(`${statLabel}: +${consumableEffect.amount}`)
    }
    if (stats.damage) statsDescription.push(`Damage: ${stats.damage.from}-${stats.damage.to}`)
    if (stats.armor) statsDescription.push(`Armor: ${stats.armor}`)
    if (stats.maxHealth) statsDescription.push(`Max Health: +${stats.maxHealth}`)
    if (stats.attackSpeed) {
      statsDescription.push(`Attack Speed: ${stats.attackSpeed < 0 ? '' : '+'}${stats.attackSpeed}ms`)
    }

    return {action, name, icon, rarityColor, description, statsDescription}
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
              <EquipmentSlot item={equipped.helmet} slotInfo={EQUIPMENT_SLOTS.helmet} onTap={handleTap} />
              <EquipmentSlot item={equipped.amulet} slotInfo={EQUIPMENT_SLOTS.amulet} onTap={handleTap} />
            </View>

            {/* Row 1: Weapon, Armor, Offhand */}
            <View style={styles.equipmentRow}>
              <EquipmentSlot item={equipped.weapon} slotInfo={EQUIPMENT_SLOTS.weapon} onTap={handleTap} />
              <EquipmentSlot item={equipped.armor} slotInfo={EQUIPMENT_SLOTS.armor} onTap={handleTap} />
              <EquipmentSlot item={equipped.offhand} slotInfo={EQUIPMENT_SLOTS.offhand} onTap={handleTap} />
            </View>

            {/* Row 2: Gloves, Ring1, Ring2 */}
            <View style={styles.equipmentRow}>
              <EquipmentSlot item={equipped.gloves} slotInfo={EQUIPMENT_SLOTS.gloves} onTap={handleTap} />
              <EquipmentSlot item={equipped.ring1} slotInfo={EQUIPMENT_SLOTS.ring1} onTap={handleTap} />
              <EquipmentSlot item={equipped.ring2} slotInfo={EQUIPMENT_SLOTS.ring2} onTap={handleTap} />
            </View>

            {/* Row 3: Boots */}
            <View style={styles.equipmentRow}>
              <View style={[styles.equipmentCell, {width: cellSize}]} />
              <EquipmentSlot item={equipped.boots} slotInfo={EQUIPMENT_SLOTS.boots} onTap={handleTap} />
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
            <BackpackGrid items={inventory} onTap={handleTap} />
          </View>
        </View>
      </ScrollView>

      {/* Equip/Unequip Confirmation Dialog */}
      <Portal>
        <Dialog visible={!!dialogItem} onDismiss={() => setDialogItem(null)} style={styles.dialog}>
          <View style={styles.dialogHeader}>
            <Text style={[styles.dialogTitle, dialogInfo && {color: dialogInfo.rarityColor}]}>
              {dialogInfo ? `${dialogInfo.icon} ${dialogInfo.name}` : ''}
            </Text>
          </View>
          <Dialog.Content>
            {dialogInfo?.description && <Text style={styles.dialogDescription}>{dialogInfo.description}</Text>}
            <View style={styles.dialogStats}>
              {dialogInfo?.statsDescription.map((stat, i) => (
                <Text key={i} style={styles.dialogStat}>
                  {stat}
                </Text>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogItem(null)} textColor="#888">
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
    backgroundColor: '#0f3460',
    width: CELL_SIZE,
    height: CELL_SIZE
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
    width: CELL_SIZE,
    height: CELL_SIZE,
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
