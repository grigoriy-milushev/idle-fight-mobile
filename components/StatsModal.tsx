import {StatType} from '@/types/game'
import React from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import {IconButton, Modal, Portal, Text} from 'react-native-paper'

export type StatItem = {
  label: string
  value: string | number
  statKey?: StatType
  hint?: string
}

export type StatsSection = {
  title?: string
  stats: StatItem[]
  allocatable?: boolean
}

type StatsModalProps = {
  visible: boolean
  onDismiss: () => void
  title: string
  sections: StatsSection[]
  statPoints?: number
  onAllocateStat: (stat: StatType) => void
}

export function StatsModal({visible, onDismiss, title, sections, statPoints = 0, onAllocateStat}: StatsModalProps) {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View>
            <Text variant="headlineMedium" style={styles.modalTitle}>
              {title}
            </Text>
            {statPoints > 0 && <Text style={styles.statPointsText}>Available points: {statPoints}</Text>}
          </View>
          <IconButton icon="close" iconColor="#fff" size={24} onPress={onDismiss} />
        </View>
        <ScrollView style={styles.modalContent}>
          {sections.map((section, sectionIndex) => (
            <View key={sectionIndex}>
              {section.title && (
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {section.title}
                </Text>
              )}
              {section.stats.map((stat, statIndex) => (
                <View key={statIndex} style={styles.statRow}>
                  <View style={styles.statLabelContainer}>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                    {stat.hint && <Text style={styles.statHint}>{stat.hint}</Text>}
                  </View>
                  <View style={styles.statValueContainer}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    {section.allocatable && statPoints > 0 && (
                      <IconButton
                        icon="plus-circle"
                        iconColor="#4caf50"
                        size={24}
                        onPress={() => stat.statKey && onAllocateStat(stat.statKey)}
                        style={styles.allocateButton}
                      />
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </Modal>
    </Portal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#16213e',
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 8,
    paddingTop: 8
  },
  modalTitle: {
    color: '#fff',
    fontWeight: 'bold'
  },
  statPointsText: {
    color: '#4caf50',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  sectionTitle: {
    color: '#fff',
    opacity: 0.7,
    marginBottom: 8,
    marginTop: 12
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460'
  },
  statLabelContainer: {
    flex: 1
  },
  statLabel: {
    color: '#fff',
    fontSize: 16
  },
  statHint: {
    color: '#888',
    fontSize: 12,
    marginTop: 2
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statValue: {
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: 'bold'
  },
  allocateButton: {
    margin: 0,
    marginLeft: 4
  }
})
