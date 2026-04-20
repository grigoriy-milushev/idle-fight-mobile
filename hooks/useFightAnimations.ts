import {FloatingNumberType} from '@/components/FloatingNumber'
import {FloatingNumbers} from '@/components/FloatingNumbersContainer'
import {DamageResult} from '@/types/game'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useAnimatedStyle, useSharedValue, withSequence, withTiming} from 'react-native-reanimated'

const MAX_FLOATING_NUMBERS = 4

/**
 * Hook for managing attack animations and floating damage/gold numbers.
 * Handles shake animations and floating number display.
 */
export function useFightAnimations(userAttack?: DamageResult, monsterAttack?: DamageResult, goldGained?: number) {
  const userShake = useShakeAnimationStyle()
  const monsterShake = useShakeAnimationStyle()

  const [monsterNumbers, setMonsterNumbers] = useState<FloatingNumbers>([])
  const [userNumbers, setUserNumbers] = useState<FloatingNumbers>([])
  const nextIdRef = useRef(0)

  const triggerShake = useCallback(
    (target: 'user' | 'opponent', isCrit: boolean = false) => {
      const shake = target === 'user' ? userShake : monsterShake

      if (isCrit) {
        // Violent jolt: larger amplitude, vertical bounce and rotation wobble
        shake.x.value = withSequence(
          withTiming(-18, {duration: 40}),
          withTiming(18, {duration: 40}),
          withTiming(-12, {duration: 40}),
          withTiming(8, {duration: 40}),
          withTiming(0, {duration: 40})
        )
        shake.y.value = withSequence(
          withTiming(-10, {duration: 40}),
          withTiming(6, {duration: 40}),
          withTiming(-4, {duration: 40}),
          withTiming(0, {duration: 80})
        )
        shake.rotate.value = withSequence(
          withTiming(-8, {duration: 40}),
          withTiming(8, {duration: 40}),
          withTiming(-4, {duration: 40}),
          withTiming(0, {duration: 80})
        )
        return
      }

      shake.x.value = withSequence(
        withTiming(-10, {duration: 50}),
        withTiming(10, {duration: 50}),
        withTiming(-5, {duration: 50}),
        withTiming(0, {duration: 50})
      )
    },
    [userShake, monsterShake]
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
      triggerShake('opponent', userAttack.isCrit)
      showFloatingNumber(userAttack.damage, 'opponent', userAttack.isCrit ? 'crit' : 'damage')
    }

    if (monsterAttack) {
      triggerShake('user', monsterAttack.isCrit)
      showFloatingNumber(monsterAttack.damage, 'user', monsterAttack.isCrit ? 'crit' : 'damage')
    }

    if (goldGained) showFloatingNumber(goldGained, 'user', 'gold')
  }, [userAttack, monsterAttack, goldGained, triggerShake, showFloatingNumber])

  return {
    userAnimatedStyle: userShake.animatedStyle,
    monsterAnimatedStyle: monsterShake.animatedStyle,
    monsterNumbers,
    userNumbers,
    showFloatingNumber,
    removeMonsterDamage: useCallback((id: string) => removeFloatingNumber(id, 'opponent'), [removeFloatingNumber]),
    removeUserDamage: useCallback((id: string) => removeFloatingNumber(id, 'user'), [removeFloatingNumber]),
    resetAnimations: useCallback(() => {
      userShake.reset()
      monsterShake.reset()
      setMonsterNumbers([])
      setUserNumbers([])
    }, [userShake, monsterShake])
  }
}

function useShakeAnimationStyle() {
  const x = useSharedValue(0)
  const y = useSharedValue(0)
  const rotate = useSharedValue(0)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: x.value}, {translateY: y.value}, {rotate: `${rotate.value}deg`}]
  }))

  return useMemo(
    () => ({
      x,
      y,
      rotate,
      animatedStyle,
      reset: () => {
        x.value = 0
        y.value = 0
        rotate.value = 0
      }
    }),
    [x, y, rotate, animatedStyle]
  )
}
