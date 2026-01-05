import React from 'react'
import {StyleSheet, View} from 'react-native'
import {FloatingNumber, FloatingNumberType} from './FloatingNumber'

export type FloatingNumbers = {
  id: string
  value: number
  horizontalOffset: number
  type?: FloatingNumberType
}[]

/**
 * Container component that renders multiple floating damage numbers.
 * Positioned absolutely to overlay on top of monster/user.
 */
export function FloatingNumbersContainer({
  numbers,
  onFloatingComplete
}: {
  numbers: FloatingNumbers
  onFloatingComplete: (id: string) => void
}) {
  return (
    <View style={styles.container} pointerEvents="none">
      {numbers.map((number) => (
        <FloatingNumber
          key={number.id}
          value={number.value}
          horizontalOffset={number.horizontalOffset}
          onComplete={() => onFloatingComplete(number.id)}
          type={number.type}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  }
})
