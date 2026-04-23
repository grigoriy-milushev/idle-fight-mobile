import {RARITY_COLORS} from '@/constants/items'
import {ItemDefinition} from '@/types/game'
import {StyleSheet, View} from 'react-native'
import {Button, Dialog, Portal, Text} from 'react-native-paper'

export interface ItemDialogAction {
  label: string
  onPress: () => void
  disabled?: boolean
  textColor?: string
}

interface ItemDialogProps {
  visible: boolean
  onDismiss: () => void
  definition: ItemDefinition | null
  primaryAction: ItemDialogAction
  secondaryAction?: ItemDialogAction
  warning?: string | null
  hint?: string | null
}

function buildStatsDescription(definition: ItemDefinition): string[] {
  const lines: string[] = []
  const {stats, consumableEffect} = definition

  if (consumableEffect) {
    if (consumableEffect.type === 'stat_boost') {
      const statLabel = consumableEffect.stat.charAt(0).toUpperCase() + consumableEffect.stat.slice(1)
      lines.push(`${statLabel}: +${consumableEffect.amount}`)
    } else if (consumableEffect.type === 'heal') {
      lines.push(`Restores ${consumableEffect.amount} HP`)
    }
  }
  if (stats.damage) lines.push(`Damage: ${stats.damage.from}-${stats.damage.to}`)
  if (stats.armor) lines.push(`Armor: ${stats.armor}`)
  if (stats.maxHealth) lines.push(`Max Health: +${stats.maxHealth}`)
  if (stats.attackSpeed) lines.push(`Attack Speed: ${stats.attackSpeed < 0 ? '' : '+'}${stats.attackSpeed}ms`)
  return lines
}

export function ItemDialog({
  visible,
  onDismiss,
  definition,
  primaryAction,
  secondaryAction,
  warning,
  hint
}: ItemDialogProps) {
  const rarityColor = definition ? RARITY_COLORS[definition.rarity] : undefined
  const statsDescription = definition ? buildStatsDescription(definition) : []

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <View style={styles.header}>
          <Text style={[styles.title, rarityColor && {color: rarityColor}]}>
            {definition ? `${definition.icon} ${definition.name}` : ''}
          </Text>
        </View>
        <Dialog.Content>
          {definition?.description && <Text style={styles.description}>{definition.description}</Text>}
          <View style={styles.stats}>
            {statsDescription.map((stat, i) => (
              <Text key={i} style={styles.stat}>
                {stat}
              </Text>
            ))}
          </View>
          {warning && <Text style={styles.warning}>{warning}</Text>}
          {!warning && hint && <Text style={styles.hint}>{hint}</Text>}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} textColor="#888">
            Cancel
          </Button>
          {secondaryAction && (
            <Button
              onPress={secondaryAction.onPress}
              disabled={secondaryAction.disabled}
              textColor={secondaryAction.textColor ?? '#ffd700'}
            >
              {secondaryAction.label}
            </Button>
          )}
          <Button
            onPress={primaryAction.onPress}
            mode="contained"
            buttonColor={primaryAction.textColor ?? '#4a90e2'}
            disabled={primaryAction.disabled}
          >
            {primaryAction.label}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: '#16213e'
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  description: {
    color: '#aaa',
    marginBottom: 12,
    fontStyle: 'italic'
  },
  stats: {
    gap: 4
  },
  stat: {
    color: '#4ade80',
    fontSize: 14
  },
  warning: {
    color: '#e94560',
    fontSize: 13,
    marginTop: 12,
    fontWeight: 'bold'
  },
  hint: {
    color: '#ffd700',
    fontSize: 12,
    marginTop: 12,
    opacity: 0.8
  }
})
