import { FloatingDamage } from "@/components/FloatingDamageContainer";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const MAX_DAMAGE_NUMBERS = 4;

/**
 * Hook for managing attack animations and floating damage numbers.
 * Handles shake animations and damage display in a single useEffect.
 */
export function useAttackAnimations(
  userAttacked?: number,
  monsterAttacked?: number
) {
  const userShakeX = useSharedValue(0);
  const monsterShakeX = useSharedValue(0);

  const [monsterDamages, setMonsterDamages] = useState<FloatingDamage[]>([]);
  const [userDamages, setUserDamages] = useState<FloatingDamage[]>([]);
  const nextIdRef = useRef(0);

  const userAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: userShakeX.value }],
  }));

  const monsterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: monsterShakeX.value }],
  }));

  const triggerShake = useCallback(
    (target: "user" | "opponent") => {
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

  const showDamage = useCallback(
    (damage: number, target: "user" | "opponent") => {
      const id = `${target}-${nextIdRef.current}`;
      nextIdRef.current = (nextIdRef.current + 1) % 100;
      const horizontalOffset = (Math.random() - 0.5) * 40;

      const setDamages =
        target === "opponent" ? setMonsterDamages : setUserDamages;
      setDamages((prev) => {
        const updated = [...prev, { id, value: damage, horizontalOffset }];
        if (updated.length > MAX_DAMAGE_NUMBERS) {
          return updated.slice(-MAX_DAMAGE_NUMBERS);
        }
        return updated;
      });
    },
    []
  );

  const removeFloatingDamage = useCallback(
    (id: string, target: "user" | "opponent") => {
      const setDamages =
        target === "opponent" ? setMonsterDamages : setUserDamages;
      setDamages((prev) => prev.filter((d) => d.id !== id));
    },
    []
  );

  useEffect(() => {
    if (userAttacked) {
      triggerShake("opponent");
      showDamage(userAttacked, "opponent");
    }

    if (monsterAttacked) {
      triggerShake("user");
      showDamage(monsterAttacked, "user");
    }
  }, [userAttacked, monsterAttacked, triggerShake, showDamage]);

  return {
    userAnimatedStyle,
    monsterAnimatedStyle,
    monsterDamages,
    userDamages,
    removeMonsterDamage: useCallback(
      (id: string) => removeFloatingDamage(id, "opponent"),
      [removeFloatingDamage]
    ),
    removeUserDamage: useCallback(
      (id: string) => removeFloatingDamage(id, "user"),
      [removeFloatingDamage]
    ),
    resetAnimations: useCallback(() => {
      userShakeX.value = 0;
      monsterShakeX.value = 0;
      setMonsterDamages([]);
      setUserDamages([]);
    }, [userShakeX, monsterShakeX]),
  };
}
