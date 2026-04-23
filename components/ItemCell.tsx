import {RARITY_COLORS} from '@/constants/items'
import {ItemDefinition} from '@/types/game'
import {Pressable, StyleSheet} from 'react-native'
import {Text} from 'react-native-paper'

const DEFAULT_SIZE = 52
const LARGE_ICON_THRESHOLD = 64

export function ItemCell({
  definition,
  onTap,
  size = DEFAULT_SIZE
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
      <Text style={[styles.itemIcon, size >= LARGE_ICON_THRESHOLD && styles.itemIconLarge]}>{definition.icon}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
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
  }
})
