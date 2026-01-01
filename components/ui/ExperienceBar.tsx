import { StyleSheet, View } from "react-native";
import { ProgressBar, Text } from "react-native-paper";

export function ExperienceBar({
  exp,
  maxExp,
}: {
  exp: number;
  maxExp: number;
}) {
  return (
    <View style={styles.expBarContainer}>
      <ProgressBar
        progress={exp / maxExp}
        color="#ffd700"
        style={styles.expBar}
      />
      <Text variant="bodySmall" style={styles.expText}>
        EXP: {exp}/{maxExp}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  expBarContainer: {
    width: "100%",
    paddingHorizontal: 16,
    marginTop: 8,
    position: "relative",
    justifyContent: "center",
  },
  expBar: {
    height: 10,
    borderRadius: 4,
  },
  expText: {
    position: "absolute",
    alignSelf: "center",
    color: "#3c3c3b",
    fontSize: 10,
    textAlign: "center",
    opacity: 0.8,
  },
});
