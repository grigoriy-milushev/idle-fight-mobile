import { useCallback, useEffect, useRef } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface AttackAnimationState {
  userHealth: number;
  monsterHealth: number;
}

/**
 * Custom hook for managing attack shake animations.
 * Detects when user or monster takes damage and triggers shake animations.
 */
export function useAttackAnimations(
  userHealth: number,
  monsterHealth: number
) {
  // Animation shared values
  const userShakeX = useSharedValue(0);
  const monsterShakeX = useSharedValue(0);

  // Track previous health values to detect attacks
  const prevStateRef = useRef<AttackAnimationState>({
    userHealth,
    monsterHealth,
  });

  // Animated styles for user and monster
  const userAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: userShakeX.value }],
  }));

  const monsterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: monsterShakeX.value }],
  }));

  // Shake animation helper
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

  // Reset animations (for restart)
  const resetAnimations = useCallback(() => {
    userShakeX.value = 0;
    monsterShakeX.value = 0;
  }, [userShakeX, monsterShakeX]);

  // Detect attacks by comparing previous health values
  useEffect(() => {
    const prev = prevStateRef.current;

    // Monster took damage -> user attacked monster
    if (monsterHealth < prev.monsterHealth && prev.monsterHealth > 0) {
      triggerShake("monster");
    }

    // User took damage -> monster attacked user
    if (userHealth < prev.userHealth && prev.userHealth > 0) {
      triggerShake("user");
    }

    // Update previous state
    prevStateRef.current = { userHealth, monsterHealth };
  }, [userHealth, monsterHealth, triggerShake]);

  return {
    userAnimatedStyle,
    monsterAnimatedStyle,
    resetAnimations,
  };
}

