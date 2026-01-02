import { FloatingDamageContainer } from "@/components/FloatingDamageContainer";
import { ExperienceBar } from "@/components/ui/ExperienceBar";
import { HealthBar } from "@/components/ui/HealthBar";
import { monsters } from "@/constants/monsters";
import { useAttackAnimations } from "@/hooks/useAttackAnimations";
import { GameState, Monster, User } from "@/types/game";
import {
  calculateDamageDealt,
  calculateExpToNextLevel,
  healthAfterAttack,
} from "@/utils/calculations";
import React, { useCallback, useEffect, useReducer, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const TICK_RATE = 100; // ms per tick (~10 ticks/sec)
const RESPAWN_DELAY = 2000; // ms

const createInitialUser = (): User => ({
  health: 100,
  maxHealth: 100,
  damage: { from: 1, to: 3 },
  attackSpeed: 1000,
  experience: 0,
  level: 1,
  experienceToNextLevel: calculateExpToNextLevel(1),
});

const createMonster = (stage: number = 1): Monster => {
  // Calculate which cycle we're in (0 = first run, 1 = second run, etc.)
  const cycle = Math.floor((stage - 1) / monsters.length);
  // Get the monster index (0-9) using modulo
  const monsterIndex = (stage - 1) % monsters.length;
  // Get the base monster from the array
  const baseMonster = monsters[monsterIndex];
  // Apply buff multiplier based on cycle (1x for first cycle, 1.5x for second, 2x for third, etc.)
  const buffMultiplier = 1 + cycle * 0.5;

  return {
    ...baseMonster,
    id: `${baseMonster.id}-${Date.now()}`,
    health: Math.floor(baseMonster.health * buffMultiplier),
    maxHealth: Math.floor(baseMonster.maxHealth * buffMultiplier),
    damage: {
      from: Math.floor(baseMonster.damage.from * buffMultiplier),
      to: Math.floor(baseMonster.damage.to * buffMultiplier),
    },
    attackSpeed: Math.max(
      Math.floor(baseMonster.attackSpeed - cycle * 100),
      500
    ),
    expGain: Math.floor(baseMonster.expGain * buffMultiplier),
  };
};

// ============================================================================
// GAME STATE & REDUCER (Battle Engine)
// ============================================================================

type GameAction =
  | { type: "TICK"; deltaMs: number }
  | { type: "SET_FIGHTING"; value: boolean }
  | { type: "RESTART" };

const createInitialState = (user?: User): GameState => ({
  user: user || createInitialUser(),
  monster: createMonster(1),
  currentStage: 1,
  isFighting: true,
  userAttackTimer: 0,
  monsterAttackTimer: 0,
  respawnTimer: 0,
  userAttackedDamage: undefined,
  monsterAttackedDamage: undefined,
});

function processTick(state: GameState, deltaMs: number): GameState {
  let {
    user,
    monster,
    currentStage,
    userAttackTimer,
    monsterAttackTimer,
    respawnTimer,
  } = state;
  let userAttacked = undefined;
  let monsterAttacked = undefined;

  if (respawnTimer > 0) {
    respawnTimer -= deltaMs;
    if (respawnTimer <= 0) {
      respawnTimer = 0;
      monster = createMonster(currentStage);
    }
    return {
      ...state,
      respawnTimer,
      monster,
      userAttackedDamage: userAttacked,
      monsterAttackedDamage: monsterAttacked,
    };
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
        const expGain = monster.expGain;
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

        currentStage += 1;
        respawnTimer = RESPAWN_DELAY;
        monsterAttackTimer = 0;
      }
    }

    if (monster.health > 0 && monsterAttackTimer >= monster.attackSpeed) {
      monsterAttackTimer -= monster.attackSpeed;
      const damageDealt = calculateDamageDealt(monster.damage);
      const userNewHealth = healthAfterAttack(user.health, damageDealt);
      user = { ...user, health: userNewHealth };
      monsterAttacked = damageDealt;

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
    currentStage,
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
      return createInitialState({
        ...state.user,
        health: state.user.maxHealth,
      });

    default:
      return state;
  }
}

export default function IdleFightScreen() {
  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    createInitialState
  );
  const {
    user,
    monster,
    currentStage,
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
            <Text variant="headlineSmall" style={styles.monsterLabel}>
              Stage {currentStage}
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
                  {isMonsterDead ? "💀" : monster.img}
                </Text>
              </Animated.View>
              <FloatingDamageContainer
                damages={monsterDamages}
                onDamageComplete={removeMonsterDamage}
              />
            </View>
            <Text variant="headlineSmall" style={styles.userLabel}>
              {monster.name}
            </Text>
            <HealthBar health={monster.health} maxHealth={monster.maxHealth} />
            <Text variant="bodySmall" style={styles.statsText}>
              Attack: {monster.damage.from}-{monster.damage.to} | Speed:{" "}
              {monster.attackSpeed / 1000}s
              {respawnTimer > 0 &&
                ` (respawn in ${Math.ceil(respawnTimer / 1000)}s)`}
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
            <HealthBar health={user.health} maxHealth={user.maxHealth} />
            <ExperienceBar
              exp={user.experience}
              maxExp={user.experienceToNextLevel}
            />
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
});
