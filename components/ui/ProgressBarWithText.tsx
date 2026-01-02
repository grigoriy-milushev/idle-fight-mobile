import { StyleSheet, View } from "react-native";
import { ProgressBar, Text } from "react-native-paper";

export function ProgressBarWithText({
  current,
  maxNumber,
  label = "HP",
  color = "#e94560",
  size = "large",
}: {
  current: number;
  maxNumber: number;
  label?: string;
  color?: string;
  size?: "small" | "large";
}) {
  return (
    <View style={styles.barContainer}>
      <ProgressBar
        progress={Math.max(0, current / maxNumber)}
        color={color}
        style={styles[`${size}Bar`]}
      />
      <Text variant="bodyMedium" style={[styles[`${size}Text`], styles.text]}>
        {label}: {Math.max(0, Math.floor(current))}/{maxNumber}
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
  largeBar: {
    height: 15,
    borderRadius: 6,
  },
  smallBar: {
    height: 10,
    borderRadius: 4,
  },
  text: {
    color: "#3c3c3b",
    textAlign: "center",
    alignSelf: "center",
    width: "100%",
    position: "absolute",
  },
  largeText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  smallText: {
    fontSize: 10,
    opacity: 0.8,
  },
});
