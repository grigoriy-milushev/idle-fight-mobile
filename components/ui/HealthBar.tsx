import { StyleSheet, View } from "react-native";
import { ProgressBar, Text } from "react-native-paper";

export function HealthBar({
  health,
  maxHealth,
}: {
  health: number;
  maxHealth: number;
}) {
  return (
    <View style={styles.barContainer}>
      <ProgressBar
        progress={Math.max(0, health / maxHealth)}
        color="#e94560"
        style={styles.bar}
      />
      <Text variant="bodyMedium" style={styles.text}>
        HP: {Math.max(0, Math.floor(health))}/{maxHealth}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    position: "relative",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  bar: {
    height: 15,
    borderRadius: 6,
  },
  text: {
    color: "#3c3c3b",
    textAlign: "center",
    alignSelf: "center",
    width: "100%",
    position: "absolute",
    fontWeight: "bold",
    fontSize: 13,
  },
});
