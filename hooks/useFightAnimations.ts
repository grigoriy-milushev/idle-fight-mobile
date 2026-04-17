import {FloatingNumberType} from '@/components/FloatingNumber'
import {FloatingNumbers} from '@/components/FloatingNumbersContainer'
import {DamageResult} from '@/types/game'
import {useCallback, useEffect, useRef, useState} from 'react'
import {useAnimatedStyle, useSharedValue, withSequence, withTiming} from 'react-native-reanimated'

const MAX_FLOATING_NUMBERS = 4

/**
 * Hook for managing attack animations and floating damage/gold numbers.
 * Handles shake animations and floating number display.
 */
export function useFightAnimations(userAttack?: DamageResult, monsterAttack?: DamageResult, goldGained?: number) {
  const {sharedValue: userShakeX, animatedStyle: userAnimatedStyle} = useShakeAnimationStyle()
  const {sharedValue: monsterShakeX, animatedStyle: monsterAnimatedStyle} = useShakeAnimationStyle()

  const [monsterNumbers, setMonsterNumbers] = useState<FloatingNumbers>([])
  const [userNumbers, setUserNumbers] = useState<FloatingNumbers>([])
  const nextIdRef = useRef(0)

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
        if (updated.length > MAX_FLOATING_NUMBERS) return updated.slice(-MAX_FLOATING_NUMBERS)

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
    if (userAttack) {
      triggerShake('opponent')
      showFloatingNumber(userAttack.damage, 'opponent', userAttack.isCrit ? 'crit' : 'damage')
    }

    if (monsterAttack) {
      triggerShake('user')
      showFloatingNumber(monsterAttack.damage, 'user', monsterAttack.isCrit ? 'crit' : 'damage')
    }

    if (goldGained) showFloatingNumber(goldGained, 'user', 'gold')
  }, [userAttack, monsterAttack, goldGained, triggerShake, showFloatingNumber])

  return {
    userAnimatedStyle,
    monsterAnimatedStyle,
    monsterNumbers,
    userNumbers,
    showFloatingNumber,
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

function useShakeAnimationStyle(initialValue: number = 0) {
  const sharedValue = useSharedValue(initialValue)
  const animatedStyle = useAnimatedStyle(() => ({transform: [{translateX: sharedValue.value}]}))

  return {sharedValue, animatedStyle}
}
