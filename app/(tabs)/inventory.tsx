import {EQUIPMENT_SLOTS, getItemDefinition, getSellPrice, RARITY_COLORS, SHOP_RESTOCK_MS} from '@/constants/items'
import {useGameDispatch, useGameState} from '@/contexts/GameContext'
import {EquipmentSlotType, InventoryItem, ItemDefinition, ShopListing} from '@/types/game'
import {useLocalSearchParams} from 'expo-router'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Dimensions, Pressable, ScrollView, StyleSheet, View} from 'react-native'
import {Button, Chip, Dialog, Portal, SegmentedButtons, Surface, Text} from 'react-native-paper'
import {SafeAreaView} from 'react-native-safe-area-context'

const GRID_COLS = 5
const GRID_ROWS = 6

const CELL_SIZE = 52
const CELL_GAP = 4

const SHOP_CELL_SIZE = 64

const {width: SCREEN_WIDTH} = Dimensions.get('window')

type DialogTarget = {mode: 'bag'; item: InventoryItem; isEquipped: boolean} | {mode: 'shop'; listing: ShopListing}

function formatDuration(ms: number): string {
  if (ms <= 0) return 'Restocking...'
  const totalSeconds = Math.ceil(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

function ItemCell({
  definition,
  onTap,
  size = CELL_SIZE
}: {
  definition: ItemDefinition
  onTap: () => void
  size?: number
}) {
  const rarityColor = RARITY_COLORS[definition.rarity]

  return (
    <Pressable
      onPress={onTap}
      style={({pressed}) => [
        styles.itemCell,
        {
          width: size,
          height: size,
          borderColor: rarityColor,
          backgroundColor: `${rarityColor}33`,
          opacity: pressed ? 0.7 : 1
        }
      ]}
    >
      <Text style={[styles.itemIcon, size >= SHOP_CELL_SIZE && styles.itemIconLarge]}>{definition.icon}</Text>
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

function ShopItemCard({
  definition,
  canAfford,
  onTap
}: {
  definition: ItemDefinition
  canAfford: boolean
  onTap: () => void
}) {
  return (
    <View style={styles.shopItem}>
      <ItemCell definition={definition} onTap={onTap} size={SHOP_CELL_SIZE} />
      <View style={[styles.priceTag, !canAfford && styles.priceTagUnaffordable]}>
        <Text style={[styles.priceText, !canAfford && styles.priceTextUnaffordable]}>💰 {definition.price}</Text>
      </View>
    </View>
  )
}

function BagView({cellSize, onTap}: {cellSize: number; onTap: (item: InventoryItem, isEquipped: boolean) => void}) {
  const {equipped, inventory} = useGameState()

  return (
    <>
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Equipment
        </Text>
        <View style={styles.equipmentGrid}>
          <View style={styles.equipmentRow}>
            <View style={[styles.equipmentCell, {width: cellSize}]} />
            <EquipmentSlot item={equipped.helmet} slotInfo={EQUIPMENT_SLOTS.helmet} onTap={onTap} />
            <View style={[styles.equipmentCell, {width: cellSize}]} />
          </View>

          <View style={styles.equipmentRow}>
            <EquipmentSlot item={equipped.weapon} slotInfo={EQUIPMENT_SLOTS.weapon} onTap={onTap} />
            <EquipmentSlot item={equipped.armor} slotInfo={EQUIPMENT_SLOTS.armor} onTap={onTap} />
            <EquipmentSlot item={equipped.offhand} slotInfo={EQUIPMENT_SLOTS.offhand} onTap={onTap} />
          </View>

          <View style={styles.equipmentRow}>
            <EquipmentSlot item={equipped.gloves} slotInfo={EQUIPMENT_SLOTS.gloves} onTap={onTap} />
            <EquipmentSlot item={equipped.ring} slotInfo={EQUIPMENT_SLOTS.ring} onTap={onTap} />
            <EquipmentSlot item={equipped.amulet} slotInfo={EQUIPMENT_SLOTS.amulet} onTap={onTap} />
          </View>

          <View style={styles.equipmentRow}>
            <EquipmentSlot item={equipped.pocket1} slotInfo={EQUIPMENT_SLOTS.pocket1} onTap={onTap} />
            <EquipmentSlot item={equipped.boots} slotInfo={EQUIPMENT_SLOTS.boots} onTap={onTap} />
            <EquipmentSlot item={equipped.pocket2} slotInfo={EQUIPMENT_SLOTS.pocket2} onTap={onTap} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Backpack
        </Text>
        <View style={styles.backpackContainer}>
          <BackpackGrid items={inventory} onTap={onTap} />
        </View>
      </View>
    </>
  )
}

function ShopView({
  gold,
  stock,
  restockInMs,
  onTap
}: {
  gold: number
  stock: ShopListing[]
  restockInMs: number
  onTap: (listing: ShopListing) => void
}) {
  const entries = useMemo(
    () =>
      stock.flatMap((listing) => {
        const definition = getItemDefinition(listing.definitionId)
        return definition ? [{listing, definition}] : []
      }),
    [stock]
  )

  return (
    <View style={styles.section}>
      <View style={styles.shopHeader}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Shop
        </Text>
        <Text style={styles.restockText}>Restocks in {formatDuration(restockInMs)}</Text>
      </View>
      <View style={styles.shopGrid}>
        {entries.length === 0 ? (
          <Text style={styles.emptyShopText}>Stock exhausted. Come back after the next restock!</Text>
        ) : (
          entries.map(({listing, definition}) => (
            <ShopItemCard
              key={listing.listingId}
              definition={definition}
              canAfford={gold >= definition.price}
              onTap={() => onTap(listing)}
            />
          ))
        )}
      </View>
    </View>
  )
}

export default function InventoryScreen() {
  const {equipped, inventory, user, shopStock, shopLastRestockAt} = useGameState()
  const dispatch = useGameDispatch()
  const params = useLocalSearchParams<{view?: string}>()
  const [segment, setSegment] = useState<'bag' | 'shop'>('bag')
  const [dialogTarget, setDialogTarget] = useState<DialogTarget | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (params.view === 'shop') setSegment('shop')
    else if (params.view === 'bag') setSegment('bag')
  }, [params.view])

  const restockInMs = Math.max(0, shopLastRestockAt + SHOP_RESTOCK_MS - now)
  useEffect(() => {
    if (segment !== 'shop') return

    const tick = () => {
      const nowTs = Date.now()
      if (nowTs >= shopLastRestockAt + SHOP_RESTOCK_MS) dispatch({type: 'RESTOCK_SHOP'})
      setNow(nowTs)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [segment, shopLastRestockAt, dispatch])

  // TODO: too complex, simplify this
  const cellSize = useMemo(() => {
    const availableWidth = SCREEN_WIDTH - 32 // padding
    return Math.min(CELL_SIZE, Math.floor((availableWidth - (GRID_COLS - 1) * CELL_GAP) / GRID_COLS))
  }, [])

  const handleBagTap = useCallback((item: InventoryItem, isEquipped: boolean) => {
    setDialogTarget({mode: 'bag', item, isEquipped})
  }, [])

  const handleShopTap = useCallback((listing: ShopListing) => {
    setDialogTarget({mode: 'shop', listing})
  }, [])

  const handleSell = useCallback(() => {
    if (!dialogTarget || dialogTarget.mode !== 'bag' || dialogTarget.isEquipped) return
    dispatch({type: 'SELL_ITEM', instanceId: dialogTarget.item.instanceId})
    setDialogTarget(null)
  }, [dialogTarget, dispatch])

  const handleConfirmAction = useCallback(() => {
    if (!dialogTarget) return

    if (dialogTarget.mode === 'shop') {
      dispatch({type: 'BUY_ITEM', listingId: dialogTarget.listing.listingId})
      setDialogTarget(null)
      return
    }

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
      if (slotType) {
        dispatch({type: 'UNEQUIP_ITEM', slotType})
      }
    } else if (definition.slot) {
      let targetSlot: EquipmentSlotType = definition.slot

      dispatch({type: 'EQUIP_ITEM', item, targetSlot})
    }

    setDialogTarget(null)
  }, [dialogTarget, equipped, dispatch])

  const dialogInfo = useMemo(() => {
    if (!dialogTarget) return null

    const definitionId =
      dialogTarget.mode === 'bag' ? dialogTarget.item.definitionId : dialogTarget.listing.definitionId
    const definition = getItemDefinition(definitionId)
    if (!definition) return null

    const {name, icon, rarity, description, stats, consumableEffect, price} = definition
    const rarityColor = RARITY_COLORS[rarity]

    const statsDescription: string[] = []
    if (consumableEffect) {
      if (consumableEffect.type === 'stat_boost') {
        const statLabel = consumableEffect.stat.charAt(0).toUpperCase() + consumableEffect.stat.slice(1)
        statsDescription.push(`${statLabel}: +${consumableEffect.amount}`)
      } else if (consumableEffect.type === 'heal') {
        statsDescription.push(`Restores ${consumableEffect.amount} HP`)
      }
    }
    if (stats.damage) statsDescription.push(`Damage: ${stats.damage.from}-${stats.damage.to}`)
    if (stats.armor) statsDescription.push(`Armor: ${stats.armor}`)
    if (stats.maxHealth) statsDescription.push(`Max Health: +${stats.maxHealth}`)
    if (stats.attackSpeed) {
      statsDescription.push(`Attack Speed: ${stats.attackSpeed < 0 ? '' : '+'}${stats.attackSpeed}ms`)
    }

    let action = 'Equip'
    let actionDisabled = false
    let disabledReason: string | null = null
    let sellPrice: number | null = null

    if (dialogTarget.mode === 'shop') {
      action = `Buy (💰 ${price})`
      if (user.gold < price) {
        actionDisabled = true
        disabledReason = 'Not enough gold'
      } else if (inventory.length >= 30) {
        actionDisabled = true
        disabledReason = 'Inventory is full'
      }
    } else if (consumableEffect?.type === 'stat_boost') {
      action = 'Use'
    } else if (dialogTarget.isEquipped) {
      action = 'Unequip'
    }

    if (dialogTarget.mode === 'bag' && !dialogTarget.isEquipped) sellPrice = getSellPrice(definition)

    return {
      action,
      name,
      icon,
      rarityColor,
      description,
      statsDescription,
      actionDisabled,
      disabledReason,
      price,
      sellPrice
    }
  }, [dialogTarget, user.gold, inventory.length])

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Surface style={styles.header} elevation={2}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Inventory
        </Text>
        <Chip style={styles.goldChip} textStyle={styles.goldText} mode="flat">
          💰 {user.gold}
        </Chip>
      </Surface>

      <View style={styles.segmentContainer}>
        <SegmentedButtons
          value={segment}
          onValueChange={(value) => setSegment(value as 'bag' | 'shop')}
          buttons={[
            {value: 'bag', label: 'Bag', icon: 'bag-personal'},
            {value: 'shop', label: 'Shop', icon: 'store'}
          ]}
        />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {segment === 'bag' ? (
          <BagView cellSize={cellSize} onTap={handleBagTap} />
        ) : (
          <ShopView gold={user.gold} stock={shopStock} restockInMs={restockInMs} onTap={handleShopTap} />
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={!!dialogTarget} onDismiss={() => setDialogTarget(null)} style={styles.dialog}>
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
            {dialogInfo?.sellPrice != null && (
              <Text style={styles.dialogSellHint}>Sells for 💰 {dialogInfo.sellPrice}</Text>
            )}
            {dialogInfo?.disabledReason && <Text style={styles.dialogWarning}>{dialogInfo.disabledReason}</Text>}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogTarget(null)} textColor="#888">
              Cancel
            </Button>
            {dialogInfo?.sellPrice != null && (
              <Button onPress={handleSell} textColor="#ffd700">
                Sell (💰 {dialogInfo.sellPrice})
              </Button>
            )}
            <Button
              onPress={handleConfirmAction}
              mode="contained"
              buttonColor="#4a90e2"
              disabled={dialogInfo?.actionDisabled}
            >
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
    justifyContent: 'space-between',
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
  goldChip: {
    backgroundColor: '#0f3460',
    borderColor: '#ffd700',
    borderWidth: 1
  },
  goldText: {
    color: '#ffd700',
    fontWeight: 'bold'
  },
  segmentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12
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
  itemIconLarge: {
    fontSize: 32
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  restockText: {
    color: '#ffd700',
    fontSize: 12,
    opacity: 0.8
  },
  emptyShopText: {
    color: '#aaa',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16
  },
  shopGrid: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    minHeight: 120
  },
  shopItem: {
    alignItems: 'center',
    gap: 4,
    width: SHOP_CELL_SIZE
  },
  priceTag: {
    backgroundColor: '#0f3460',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffd700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: SHOP_CELL_SIZE,
    alignItems: 'center'
  },
  priceTagUnaffordable: {
    borderColor: '#666',
    opacity: 0.6
  },
  priceText: {
    color: '#ffd700',
    fontSize: 11,
    fontWeight: 'bold'
  },
  priceTextUnaffordable: {
    color: '#888'
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
  },
  dialogSellHint: {
    color: '#ffd700',
    fontSize: 12,
    marginTop: 12,
    opacity: 0.8
  },
  dialogWarning: {
    color: '#e94560',
    fontSize: 13,
    marginTop: 12,
    fontWeight: 'bold'
  }
})
