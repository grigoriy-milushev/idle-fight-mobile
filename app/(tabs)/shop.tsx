import {ItemCell} from '@/components/ItemCell'
import {ItemDialog} from '@/components/ItemDialog'
import {ScreenHeader} from '@/components/ScreenHeader'
import {getItemDefinition, SHOP_RESTOCK_MS} from '@/constants/items'
import {useGameDispatch, useGameState} from '@/contexts/GameContext'
import {ItemDefinition, ShopListing} from '@/types/game'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import {Text} from 'react-native-paper'
import {SafeAreaView} from 'react-native-safe-area-context'

const SHOP_CELL_SIZE = 64
const MAX_INVENTORY_SIZE = 30

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

export default function ShopScreen() {
  const {user, inventory, shopStock, shopLastRestockAt} = useGameState()
  const dispatch = useGameDispatch()
  const [selected, setSelected] = useState<ShopListing | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const restockInMs = Math.max(0, shopLastRestockAt + SHOP_RESTOCK_MS - now)

  useEffect(() => {
    const tick = () => {
      const nowTs = Date.now()
      if (nowTs >= shopLastRestockAt + SHOP_RESTOCK_MS) dispatch({type: 'RESTOCK_SHOP'})
      setNow(nowTs)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [shopLastRestockAt, dispatch])

  const entries = useMemo(
    () =>
      shopStock.flatMap((listing) => {
        const definition = getItemDefinition(listing.definitionId)
        return definition ? [{listing, definition}] : []
      }),
    [shopStock]
  )

  const handleBuy = useCallback(() => {
    if (!selected) return
    dispatch({type: 'BUY_ITEM', listingId: selected.listingId})
    setSelected(null)
  }, [selected, dispatch])

  const dialogInfo = useMemo(() => {
    if (!selected) return null
    const definition = getItemDefinition(selected.definitionId)
    if (!definition) return null

    let disabledReason: string | null = null
    if (user.gold < definition.price) disabledReason = 'Not enough gold'
    else if (inventory.length >= MAX_INVENTORY_SIZE) disabledReason = 'Inventory is full'

    return {definition, disabledReason}
  }, [selected, user.gold, inventory.length])

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="Shop" goldLinksToShop={false} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.restockRow}>
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
                canAfford={user.gold >= definition.price}
                onTap={() => setSelected(listing)}
              />
            ))
          )}
        </View>
      </ScrollView>
      <ItemDialog
        visible={!!selected}
        onDismiss={() => setSelected(null)}
        definition={dialogInfo?.definition ?? null}
        primaryAction={{
          label: `Buy (💰 ${dialogInfo?.definition.price ?? 0})`,
          onPress: handleBuy,
          disabled: !!dialogInfo?.disabledReason
        }}
        warning={dialogInfo?.disabledReason}
      />
    </SafeAreaView>
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
    gap: 12
  },
  restockRow: {
    alignItems: 'flex-end'
  },
  restockText: {
    color: '#ffd700',
    fontSize: 12,
    opacity: 0.8
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
  emptyShopText: {
    color: '#aaa',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16
  }
})
