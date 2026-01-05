import {FloatingNumberType} from '@/components/FloatingNumber'
import {FloatingNumbers} from '@/components/FloatingNumbersContainer'
import {useCallback, useEffect, useRef, useState} from 'react'
import {useAnimatedStyle, useSharedValue, withSequence, withTiming} from 'react-native-reanimated'

const MAX_FLOATING_NUMBERS = 4

/**
 * Hook for managing attack animations and floating damage/gold numbers.
 * Handles shake animations and floating number display.
 */
export function useFightAnimations(userAttacked?: number, monsterAttacked?: number, goldGained?: number) {
  const userShakeX = useSharedValue(0)
  const monsterShakeX = useSharedValue(0)

  const [monsterNumbers, setMonsterNumbers] = useState<FloatingNumbers>([])
  const [userNumbers, setUserNumbers] = useState<FloatingNumbers>([])
  const nextIdRef = useRef(0)

  const userAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: userShakeX.value}]
  }))

  const monsterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: monsterShakeX.value}]
  }))

  const triggerShake = useCallback(
    (target: 'user' | 'opponent') => {
      const shakeValue = target === 'user' ? userShakeX : monsterShakeX
      shakeValue.value = withSequence(
        withTiming(-10, {duration: 50}),
        withTiming(10, {duration: 50}),
        withTiming(-5, {duration: 50}),
        withTiming(0, {duration: 50})
      )
    },
    [userShakeX, monsterShakeX]
  )

  const showFloatingNumber = useCallback(
    (value: number, target: 'user' | 'opponent', type: FloatingNumberType = 'damage') => {
      const id = `${target}-${type}-${nextIdRef.current}`
      nextIdRef.current = (nextIdRef.current + 1) % 100
      const horizontalOffset = (Math.random() - 0.5) * 40

      const setFloatingNumbers = target === 'opponent' ? setMonsterNumbers : setUserNumbers
      setFloatingNumbers((prev) => {
        const updated = [...prev, {id, value, horizontalOffset, type}]
        if (updated.length > MAX_FLOATING_NUMBERS) {
          return updated.slice(-MAX_FLOATING_NUMBERS)
        }
        return updated
      })
    },
    []
  )

  const removeFloatingNumber = useCallback((id: string, target: 'user' | 'opponent') => {
    const setFloatingNumbers = target === 'opponent' ? setMonsterNumbers : setUserNumbers
    setFloatingNumbers((prev) => prev.filter((d) => d.id !== id))
  }, [])

  useEffect(() => {
    if (userAttacked) {
      triggerShake('opponent')
      showFloatingNumber(userAttacked, 'opponent', 'damage')
    }

    if (monsterAttacked) {
      triggerShake('user')
      showFloatingNumber(monsterAttacked, 'user', 'damage')
    }

    if (goldGained) showFloatingNumber(goldGained, 'user', 'gold')
  }, [userAttacked, monsterAttacked, goldGained, triggerShake, showFloatingNumber])

  return {
    userAnimatedStyle,
    monsterAnimatedStyle,
    monsterNumbers,
    userNumbers,
    removeMonsterDamage: useCallback((id: string) => removeFloatingNumber(id, 'opponent'), [removeFloatingNumber]),
    removeUserDamage: useCallback((id: string) => removeFloatingNumber(id, 'user'), [removeFloatingNumber]),
    resetAnimations: useCallback(() => {
      userShakeX.value = 0
      monsterShakeX.value = 0
      setMonsterNumbers([])
      setUserNumbers([])
    }, [userShakeX, monsterShakeX])
  }
}
