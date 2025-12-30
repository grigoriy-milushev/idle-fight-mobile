import { useCallback, useEffect, useRef } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

/**
 * Custom hook for managing attack shake animations.
 * Detects when user or monster takes damage and triggers shake animations.
 */
export function useAttackAnimations(userHealth: number, monsterHealth: number) {
  const userShakeX = useSharedValue(0);
  const monsterShakeX = useSharedValue(0);

  const prevStateRef = useRef({ userHealth, monsterHealth });

  const userAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: userShakeX.value }],
  }));

  const monsterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: monsterShakeX.value }],
  }));

  const triggerShake = useCallback(
    (target: "user" | "monster") => {
      const shakeValue = target === "user" ? userShakeX : monsterShakeX;
      shakeValue.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    },
    [userShakeX, monsterShakeX]
  );

  useEffect(() => {
    const prev = prevStateRef.current;
    if (monsterHealth < prev.monsterHealth && prev.monsterHealth > 0) {
      triggerShake("monster");
    }

    if (userHealth < prev.userHealth && prev.userHealth > 0) {
      triggerShake("user");
    }

    prevStateRef.current = { userHealth, monsterHealth };
  }, [userHealth, monsterHealth, triggerShake]);

  return {
    userAnimatedStyle,
    monsterAnimatedStyle,
    resetAnimations: useCallback(() => {
      userShakeX.value = 0;
      monsterShakeX.value = 0;
    }, [userShakeX, monsterShakeX]),
  };
}
