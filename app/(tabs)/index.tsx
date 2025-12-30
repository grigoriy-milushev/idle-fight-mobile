import { useAttackAnimations } from "@/hooks/useAttackAnimations";
import { Demage, Monster, User } from "@/types/game";
import React, { useCallback, useEffect, useReducer, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, ProgressBar, Text } from "react-native-paper";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// ============================================================================
// GAME CONSTANTS & INITIAL STATE
// ============================================================================

const TICK_RATE = 100; // ms per tick (~10 ticks/sec)
const RESPAWN_DELAY = 2000; // ms

const calculateExpToNextLevel = (level: number): number =>
  Math.floor(100 * Math.pow(1.5, level - 1));

const createInitialUser = (): User => ({
  health: 100,
  maxHealth: 100,
  damage: { from: 1, to: 3 },
  attackSpeed: 1000,
  experience: 0,
  level: 1,
  experienceToNextLevel: calculateExpToNextLevel(1),
});

const createMonster = (userLevel: number = 1): Monster => ({
  id: `monster-${Date.now()}`,
  name: "Goblin",
  health: 50 + (userLevel - 1) * 10,
  maxHealth: 50 + (userLevel - 1) * 10,
  damage: { from: 1 + (userLevel - 1), to: 3 + (userLevel - 1) },
  attackSpeed: 3000,
});

// ============================================================================
// GAME STATE & REDUCER (Battle Engine)
// ============================================================================

interface GameState {
  user: User;
  monster: Monster;
  isFighting: boolean;
  userAttackTimer: number;
  monsterAttackTimer: number;
  respawnTimer: number;
}

type GameAction =
  | { type: "TICK"; deltaMs: number }
  | { type: "SET_FIGHTING"; value: boolean }
  | { type: "RESTART" };

const createInitialState = (): GameState => ({
  user: createInitialUser(),
  monster: createMonster(1),
  isFighting: true,
  userAttackTimer: 0,
  monsterAttackTimer: 0,
  respawnTimer: 0,
});

interface TickResult {
  state: GameState;
  userAttacked: boolean;
  monsterAttacked: boolean;
}

function processTick(state: GameState, deltaMs: number): TickResult {
  let { user, monster, userAttackTimer, monsterAttackTimer, respawnTimer } =
    state;
  let userAttacked = false;
  let monsterAttacked = false;

  // Handle respawn countdown
  if (respawnTimer > 0) {
    respawnTimer -= deltaMs;
    if (respawnTimer <= 0) {
      respawnTimer = 0;
      monster = createMonster(user.level);
    }
    return {
      state: { ...state, respawnTimer, monster },
      userAttacked: false,
      monsterAttacked: false,
    };
  }

  function healthAfterAttack(health: number, damage: Demage) {
    const damageDealt =
      Math.floor(Math.random() * (damage.to - damage.from + 1)) + damage.from;
    return Math.max(0, health - damageDealt);
  }

  if (user.health > 0 && monster.health > 0) {
    userAttackTimer += deltaMs;
    monsterAttackTimer += deltaMs;

    if (userAttackTimer >= user.attackSpeed) {
      userAttackTimer -= user.attackSpeed;
      const newMonsterHealth = healthAfterAttack(monster.health, user.damage);
      monster = { ...monster, health: newMonsterHealth };
      userAttacked = true;

      if (newMonsterHealth <= 0) {
        const expGain = 20;
        const newExp = user.experience + expGain;

        if (newExp >= user.experienceToNextLevel) {
          const newLevel = user.level + 1;
          user = {
            ...user,
            experience: newExp - user.experienceToNextLevel,
            level: newLevel,
            experienceToNextLevel: calculateExpToNextLevel(newLevel),
            maxHealth: user.maxHealth + 20,
            health: user.maxHealth + 20,
            damage: { from: user.damage.from + 2, to: user.damage.to + 2 },
            attackSpeed: Math.max(user.attackSpeed - 5, 300),
          };
        } else {
          user = { ...user, experience: newExp };
        }

        respawnTimer = RESPAWN_DELAY;
        monsterAttackTimer = 0;
      }
    }

    // Monster attacks user (only if monster still alive)
    if (monster.health > 0 && monsterAttackTimer >= monster.attackSpeed) {
      monsterAttackTimer -= monster.attackSpeed;
      const newUserHealth = healthAfterAttack(user.health, monster.damage);
      user = { ...user, health: newUserHealth };
      monsterAttacked = true;

      // User died?
      if (newUserHealth <= 0) {
        return {
          state: {
            ...state,
            user,
            monster,
            isFighting: false,
            userAttackTimer: 0,
            monsterAttackTimer: 0,
            respawnTimer: 0,
          },
          userAttacked,
          monsterAttacked,
        };
      }
    }
  }

  return {
    state: {
      ...state,
      user,
      monster,
      userAttackTimer,
      monsterAttackTimer,
      respawnTimer,
    },
    userAttacked,
    monsterAttacked,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "TICK": {
      if (!state.isFighting) return state;
      const { state: newState } = processTick(state, action.deltaMs);
      return newState;
    }

    case "SET_FIGHTING":
      return { ...state, isFighting: action.value };

    case "RESTART":
      return createInitialState();

    default:
      return state;
  }
}

export default function IdleFightScreen() {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);
  const { user, monster, isFighting, respawnTimer } = state;

  const { userAnimatedStyle, monsterAnimatedStyle, resetAnimations } =
    useAttackAnimations(user.health, monster.health);

  // Game loop refs
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  function stopGameLoop() {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }

  // Game loop
  useEffect(() => {
    if (!isFighting) {
      console.log("stopping game loop");
      stopGameLoop();
      return;
    }
    console.log("starting game loop");
    lastTickRef.current = Date.now();

    gameLoopRef.current = setInterval(() => {
      const now = Date.now();
      const deltaMs = now - lastTickRef.current;
      lastTickRef.current = now;
      dispatch({ type: "TICK", deltaMs });
    }, TICK_RATE);

    return () => stopGameLoop();
  }, [isFighting]);

  const handleRestart = useCallback(() => {
    resetAnimations();
    dispatch({ type: "RESTART" });
  }, [resetAnimations]);

  const isMonsterDead = monster.health <= 0;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.monsterSection}>
        <Card style={styles.monsterCard}>
          <Card.Content style={styles.monsterContent}>
            <Text variant="headlineMedium" style={styles.monsterLabel}>
              🐉 {monster.name}
            </Text>
            <Animated.View
              style={[
                styles.monsterPlaceholder,
                monsterAnimatedStyle,
                isMonsterDead && styles.deadPlaceholder,
              ]}
            >
              <Text variant="displayLarge">{isMonsterDead ? "💀" : "👹"}</Text>
            </Animated.View>
            <View style={styles.healthBarContainer}>
              <ProgressBar
                progress={Math.max(0, monster.health / monster.maxHealth)}
                color="#e94560"
                style={styles.healthBar}
              />
              <Text variant="bodyMedium" style={styles.healthText}>
                HP: {Math.max(0, Math.floor(monster.health))}/
                {monster.maxHealth}
                {respawnTimer > 0 &&
                  ` (respawn in ${Math.ceil(respawnTimer / 1000)}s)`}
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.statsText}>
              Attack: {monster.damage.from}-{monster.damage.to} | Speed:{" "}
              {monster.attackSpeed / 1000}s
            </Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.middleSection}>
        <Button
          mode="contained"
          onPress={handleRestart}
          style={styles.restartButton}
          buttonColor="#4a90e2"
        >
          Restart
        </Button>
        {user.health <= 0 ? (
          <View style={styles.gameOverContainer}>
            <Text variant="headlineSmall" style={styles.gameOverText}>
              Game Over!
            </Text>
          </View>
        ) : !isFighting ? (
          <Button
            mode="contained"
            onPress={() => dispatch({ type: "SET_FIGHTING", value: true })}
            style={styles.restartButton}
            buttonColor="#4a90e2"
          >
            Fight!
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={() => dispatch({ type: "SET_FIGHTING", value: false })}
            style={styles.restartButton}
            buttonColor="#4a90e2"
          >
            Stop
          </Button>
        )}
      </View>

      <View style={styles.userSection}>
        <Card style={styles.userCard}>
          <Card.Content style={styles.userContent}>
            <Animated.View style={[styles.userPlaceholder, userAnimatedStyle]}>
              <Text variant="displayLarge">⚔️</Text>
            </Animated.View>
            <Text variant="headlineSmall" style={styles.userLabel}>
              Hero Lv.{user.level}
            </Text>
            <View style={styles.healthBarContainer}>
              <ProgressBar
                progress={Math.max(0, user.health / user.maxHealth)}
                color="#4a90e2"
                style={styles.healthBar}
              />
              <Text variant="bodyMedium" style={styles.healthText}>
                HP: {Math.max(0, Math.floor(user.health))}/{user.maxHealth}
              </Text>
            </View>
            <View style={styles.expBarContainer}>
              <ProgressBar
                progress={user.experience / user.experienceToNextLevel}
                color="#ffd700"
                style={styles.expBar}
              />
              <Text variant="bodySmall" style={styles.expText}>
                EXP: {user.experience}/{user.experienceToNextLevel}
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.statsText}>
              Attack: {user.damage.from}-{user.damage.to} | Speed:{" "}
              {user.attackSpeed / 1000}s
            </Text>
          </Card.Content>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  monsterSection: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  monsterCard: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    elevation: 4,
  },
  monsterContent: {
    alignItems: "center",
    paddingVertical: 24,
  },
  monsterLabel: {
    color: "#fff",
    marginBottom: 16,
    fontWeight: "bold",
  },
  monsterPlaceholder: {
    width: 150,
    height: 150,
    backgroundColor: "#0f3460",
    borderRadius: 75,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 16,
    borderWidth: 3,
    borderColor: "#e94560",
  },
  deadPlaceholder: {
    opacity: 0.5,
    borderColor: "#666",
  },
  healthBarContainer: {
    width: "100%",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  healthBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  healthText: {
    color: "#fff",
    textAlign: "center",
  },
  statsText: {
    color: "#fff",
    opacity: 0.7,
    marginTop: 4,
  },
  middleSection: {
    flex: 0.3,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  gameOverContainer: {
    alignItems: "center",
    gap: 16,
  },
  gameOverText: {
    color: "#e94560",
    fontWeight: "bold",
  },
  restartButton: {
    marginTop: 8,
    paddingHorizontal: 24,
  },
  userSection: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  userCard: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    elevation: 4,
  },
  userContent: {
    alignItems: "center",
    paddingVertical: 24,
  },
  userPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: "#0f3460",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#4a90e2",
  },
  userLabel: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 8,
  },
  expBarContainer: {
    width: "100%",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  expBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  expText: {
    color: "#fff",
    textAlign: "center",
    opacity: 0.8,
  },
});
