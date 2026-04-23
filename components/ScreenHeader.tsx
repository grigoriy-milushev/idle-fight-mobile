import {useGameState} from '@/contexts/GameContext'
import {router} from 'expo-router'
import {Pressable, StyleSheet} from 'react-native'
import {Chip, Surface, Text} from 'react-native-paper'

export function ScreenHeader({title, goldLinksToShop = true}: {title: string; goldLinksToShop?: boolean}) {
  const {user} = useGameState()

  const goldChip = (
    <Chip style={styles.goldChip} textStyle={styles.goldText} mode="flat">
      💰 {user.gold}
    </Chip>
  )

  return (
    <Surface style={styles.header} elevation={2}>
      <Text variant="headlineSmall" style={styles.headerTitle}>
        {title}
      </Text>
      {goldLinksToShop ? (
        <Pressable
          onPress={() => router.push('/shop')}
          style={({pressed}) => [styles.goldPressable, pressed && styles.goldPressed]}
        >
          {goldChip}
        </Pressable>
      ) : (
        goldChip
      )}
    </Surface>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460'
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold'
  },
  spacer: {
    flex: 1
  },
  goldPressable: {
    borderRadius: 16
  },
  goldPressed: {
    opacity: 0.6
  },
  goldChip: {
    backgroundColor: '#0f3460',
    borderColor: '#ffd700',
    borderWidth: 1
  },
  goldText: {
    color: '#ffd700',
    fontWeight: 'bold'
  }
})
