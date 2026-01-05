import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const FLOAT_DURATION = 1000;
const FLOAT_DISTANCE = -60; // pixels upward

export type FloatingNumberType = "damage" | "gold";

/**
 * Component for rendering a single floating number.
 * Animates upward and fades out, then calls onComplete.
 */
export function FloatingNumber({
  value,
  horizontalOffset,
  onComplete,
  type = "damage",
}: {
  value: number;
  horizontalOffset: number;
  onComplete: () => void;
  type?: FloatingNumberType;
}) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(0, { duration: FLOAT_DURATION });
    translateY.value = withTiming(
      FLOAT_DISTANCE,
      { duration: FLOAT_DURATION },
      () => scheduleOnRN(onComplete)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: horizontalOffset },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={type === "gold" ? styles.goldText : styles.damageText}>
        {type === "gold" ? `+${value} Gold` : `-${value}`}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  damageText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ff4444",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  goldText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffd700",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
