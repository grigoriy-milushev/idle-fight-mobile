import React from "react";
import { StyleSheet, View } from "react-native";
import { FloatingDamageNumber } from "./FloatingDamageNumber";

export interface FloatingDamage {
  id: string;
  value: number;
  horizontalOffset: number;
}

/**
 * Container component that renders multiple floating damage numbers.
 * Positioned absolutely to overlay on top of monster/user.
 */
export function FloatingDamageContainer({
  damages,
  onDamageComplete,
}: {
  damages: FloatingDamage[];
  onDamageComplete: (id: string) => void;
}) {
  return (
    <View style={styles.container} pointerEvents="none">
      {damages.map((damage) => (
        <FloatingDamageNumber
          key={damage.id}
          value={damage.value}
          horizontalOffset={damage.horizontalOffset}
          onComplete={() => onDamageComplete(damage.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
