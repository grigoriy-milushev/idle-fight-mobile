import {ItemCell} from '@/components/ItemCell'
import {ItemDialog} from '@/components/ItemDialog'
import {ScreenHeader} from '@/components/ScreenHeader'
import {EQUIPMENT_SLOTS, getItemDefinition, getSellPrice} from '@/constants/items'
import {useGameDispatch, useGameState} from '@/contexts/GameContext'
import {EquipmentSlotType, InventoryItem} from '@/types/game'
import React, {useCallback, useMemo, useState} from 'react'
import {Dimensions, ScrollView, StyleSheet, View} from 'react-native'
import {Text} from 'react-native-paper'
import {SafeAreaView} from 'react-native-safe-area-context'

const GRID_COLS = 5
const GRID_ROWS = 6

const CELL_SIZE = 52
const CELL_GAP = 4

const {width: SCREEN_WIDTH} = Dimensions.get('window')

type DialogTarget = {item: InventoryItem; isEquipped: boolean}

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
  const {equipped, inventory} = useGameState()
  const dispatch = useGameDispatch()
  const [dialogTarget, setDialogTarget] = useState<DialogTarget | null>(null)

  // TODO: too complex, simplify this
  const cellSize = useMemo(() => {
    const availableWidth = SCREEN_WIDTH - 32 // padding
    return Math.min(CELL_SIZE, Math.floor((availableWidth - (GRID_COLS - 1) * CELL_GAP) / GRID_COLS))
  }, [])

  const handleTap = useCallback((item: InventoryItem, isEquipped: boolean) => {
    setDialogTarget({item, isEquipped})
  }, [])

  const handleSell = useCallback(() => {
    if (!dialogTarget || dialogTarget.isEquipped) return
    dispatch({type: 'SELL_ITEM', instanceId: dialogTarget.item.instanceId})
    setDialogTarget(null)
  }, [dialogTarget, dispatch])

  const handleConfirmAction = useCallback(() => {
    if (!dialogTarget) return

    const {item, isEquipped} = dialogTarget
    const definition = getItemDefinition(item.definitionId)
    if (!definition) return

    if (definition.consumableEffect?.type === 'stat_boost') {
      dispatch({type: 'ALLOCATE_STAT', stat: definition.consumableEffect.stat, item})
      setDialogTarget(null)
      return
    }

    if (isEquipped) {
      const slotType = (Object.keys(equipped) as EquipmentSlotType[]).find(
        (type) => equipped[type]?.instanceId === item.instanceId
      )
      if (slotType) dispatch({type: 'UNEQUIP_ITEM', slotType})
    } else if (definition.slot) {
      dispatch({type: 'EQUIP_ITEM', item, targetSlot: definition.slot})
    }

    setDialogTarget(null)
  }, [dialogTarget, equipped, dispatch])

  const dialogInfo = useMemo(() => {
    if (!dialogTarget) return null

    const definition = getItemDefinition(dialogTarget.item.definitionId)
    if (!definition) return null

    let actionLabel = 'Equip'
    if (definition.consumableEffect?.type === 'stat_boost') actionLabel = 'Use'
    else if (dialogTarget.isEquipped) actionLabel = 'Unequip'

    const sellPrice = dialogTarget.isEquipped ? null : getSellPrice(definition)

    return {definition, actionLabel, sellPrice}
  }, [dialogTarget])

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="Inventory" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Equipment
          </Text>
          <View style={styles.equipmentGrid}>
            <View style={styles.equipmentRow}>
              <View style={[styles.equipmentCell, {width: cellSize}]} />
              <EquipmentSlot item={equipped.helmet} slotInfo={EQUIPMENT_SLOTS.helmet} onTap={handleTap} />
              <View style={[styles.equipmentCell, {width: cellSize}]} />
            </View>
            <View style={styles.equipmentRow}>
              <EquipmentSlot item={equipped.weapon} slotInfo={EQUIPMENT_SLOTS.weapon} onTap={handleTap} />
              <EquipmentSlot item={equipped.armor} slotInfo={EQUIPMENT_SLOTS.armor} onTap={handleTap} />
              <EquipmentSlot item={equipped.offhand} slotInfo={EQUIPMENT_SLOTS.offhand} onTap={handleTap} />
            </View>
            <View style={styles.equipmentRow}>
              <EquipmentSlot item={equipped.gloves} slotInfo={EQUIPMENT_SLOTS.gloves} onTap={handleTap} />
              <EquipmentSlot item={equipped.ring} slotInfo={EQUIPMENT_SLOTS.ring} onTap={handleTap} />
              <EquipmentSlot item={equipped.amulet} slotInfo={EQUIPMENT_SLOTS.amulet} onTap={handleTap} />
            </View>
            <View style={styles.equipmentRow}>
              <EquipmentSlot item={equipped.pocket1} slotInfo={EQUIPMENT_SLOTS.pocket1} onTap={handleTap} />
              <EquipmentSlot item={equipped.boots} slotInfo={EQUIPMENT_SLOTS.boots} onTap={handleTap} />
              <EquipmentSlot item={equipped.pocket2} slotInfo={EQUIPMENT_SLOTS.pocket2} onTap={handleTap} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Backpack
          </Text>
          <View style={styles.backpackContainer}>
            <BackpackGrid items={inventory} onTap={handleTap} />
          </View>
        </View>
      </ScrollView>

      <ItemDialog
        visible={!!dialogTarget}
        onDismiss={() => setDialogTarget(null)}
        definition={dialogInfo?.definition ?? null}
        primaryAction={{label: dialogInfo?.actionLabel ?? 'Equip', onPress: handleConfirmAction}}
        secondaryAction={
          dialogInfo?.sellPrice ? {label: `Sell (💰 ${dialogInfo.sellPrice})`, onPress: handleSell} : undefined
        }
        hint={dialogInfo?.sellPrice ? `Sells for 💰 ${dialogInfo.sellPrice}` : undefined}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e'
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
  }
})
