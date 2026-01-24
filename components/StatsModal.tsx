import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { IconButton, Modal, Portal, Text } from 'react-native-paper'

export type StatItem = {
  label: string
  value: string | number
  disabled?: boolean
}

export type StatsSection = {
  title?: string
  stats: StatItem[]
  disabled?: boolean
}

type StatsModalProps = {
  visible: boolean
  onDismiss: () => void
  title: string
  sections: StatsSection[]
}

export function StatsModal({ visible, onDismiss, title, sections }: StatsModalProps) {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text variant="headlineMedium" style={styles.modalTitle}>
            {title}
          </Text>
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
                  <Text style={section.disabled || stat.disabled ? styles.statLabelDisabled : styles.statLabel}>
                    {stat.label}
                  </Text>
                  <Text style={section.disabled || stat.disabled ? styles.statValueDisabled : styles.statValue}>
                    {stat.value}
                  </Text>
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
  modalDivider: {
    backgroundColor: '#0f3460',
    marginVertical: 12
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  sectionTitle: {
    color: '#fff',
    opacity: 0.7,
    marginBottom: 8,
    marginTop: 4
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460'
  },
  statLabel: {
    color: '#fff',
    fontSize: 16
  },
  statValue: {
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: 'bold'
  },
  statLabelDisabled: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.4
  },
  statValueDisabled: {
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: 'bold',
    opacity: 0.4
  }
})
