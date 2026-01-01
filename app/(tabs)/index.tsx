import { FloatingDamageContainer } from "@/components/FloatingDamageContainer";
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
  userAttackedDamage?: number;
  monsterAttackedDamage?: number;
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
  userAttackedDamage: undefined,
  monsterAttackedDamage: undefined,
});

function processTick(state: GameState, deltaMs: number): GameState {
  let { user, monster, userAttackTimer, monsterAttackTimer, respawnTimer } =
    state;
  let userAttacked = undefined;
  let monsterAttacked = undefined;

  // Handle respawn countdown
  if (respawnTimer > 0) {
    respawnTimer -= deltaMs;
    if (respawnTimer <= 0) {
      respawnTimer = 0;
      monster = createMonster(user.level);
    }
    return {
      ...state,
      respawnTimer,
      monster,
      userAttackedDamage: userAttacked,
      monsterAttackedDamage: monsterAttacked,
    };
  }

  function calculateDamageDealt({ from, to }: Demage) {
    return Math.floor(Math.random() * (to - from + 1)) + from;
  }

  function healthAfterAttack(health: number, damage: number) {
    return Math.max(0, health - damage);
  }

  if (user.health > 0 && monster.health > 0) {
    userAttackTimer += deltaMs;
    monsterAttackTimer += deltaMs;

    if (userAttackTimer >= user.attackSpeed) {
      userAttackTimer -= user.attackSpeed;
      const damageDealt = calculateDamageDealt(user.damage);
      const monsterNewHealth = healthAfterAttack(monster.health, damageDealt);
      monster = { ...monster, health: monsterNewHealth };
      userAttacked = damageDealt;

      if (monsterNewHealth <= 0) {
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
      const damageDealt = calculateDamageDealt(monster.damage);
      const userNewHealth = healthAfterAttack(user.health, damageDealt);
      user = { ...user, health: userNewHealth };
      monsterAttacked = damageDealt;

      // User died?
      if (userNewHealth <= 0) {
        return {
          ...state,
          user,
          monster,
          isFighting: false,
          userAttackTimer: 0,
          monsterAttackTimer: 0,
          respawnTimer: 0,
          userAttackedDamage: userAttacked,
          monsterAttackedDamage: monsterAttacked,
        };
      }
    }
  }

  return {
    ...state,
    user,
    monster,
    userAttackTimer,
    monsterAttackTimer,
    respawnTimer,
    userAttackedDamage: userAttacked,
    monsterAttackedDamage: monsterAttacked,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "TICK": {
      if (!state.isFighting) return state;
      return processTick(state, action.deltaMs);
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
  const {
    user,
    monster,
    isFighting,
    respawnTimer,
    userAttackedDamage: userAttacked,
    monsterAttackedDamage: monsterAttacked,
  } = state;

  const {
    userAnimatedStyle,
    monsterAnimatedStyle,
    monsterDamages,
    userDamages,
    removeMonsterDamage,
    removeUserDamage,
    resetAnimations,
  } = useAttackAnimations(userAttacked, monsterAttacked);

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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.monsterSection}>
        <Card style={styles.monsterCard}>
          <Card.Content style={styles.monsterContent}>
            <Text variant="headlineMedium" style={styles.monsterLabel}>
              🐉 {monster.name}
            </Text>
            <View style={styles.monsterPlaceholderWrapper}>
              <Animated.View
                style={[
                  styles.monsterPlaceholder,
                  monsterAnimatedStyle,
                  isMonsterDead && styles.deadPlaceholder,
                ]}
              >
                <Text variant="displayLarge">
                  {isMonsterDead ? "💀" : "👹"}
                </Text>
              </Animated.View>
              <FloatingDamageContainer
                damages={monsterDamages}
                onDamageComplete={removeMonsterDamage}
              />
            </View>
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
            <View style={styles.userPlaceholderWrapper}>
              <Animated.View
                style={[styles.userPlaceholder, userAnimatedStyle]}
              >
                <Text variant="displayLarge">⚔️</Text>
              </Animated.View>
              <FloatingDamageContainer
                damages={userDamages}
                onDamageComplete={removeUserDamage}
              />
            </View>
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
  monsterPlaceholderWrapper: {
    position: "relative",
    marginVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  monsterPlaceholder: {
    width: 150,
    height: 150,
    backgroundColor: "#0f3460",
    borderRadius: 75,
    justifyContent: "center",
    alignItems: "center",
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
  userPlaceholderWrapper: {
    position: "relative",
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  userPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: "#0f3460",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
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
