import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useRastroTheme } from "@/contexts/ThemeContext";

function Bar({
  width,
  height = 12,
  radius = 6,
}: {
  width: `${number}%` | number;
  height?: number;
  radius?: number;
}) {
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(x, { toValue: 1, duration: 1500, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [x]);

  return (
    <View style={[styles.bar, { width, height, borderRadius: radius }]}>
      <Animated.View
        style={[
          styles.sweep,
          {
            transform: [
              {
                translateX: x.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-180, 180],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

function FeedSkeleton() {
  const { colors } = useRastroTheme();
  return (
    <View style={styles.root}>
      <Bar width="70%" />
      <Bar width="100%" height={34} />
      <Bar width="45%" />
      <View style={[styles.card, { backgroundColor: colors.ctaSoft }]}>
        <Bar width="100%" height={88} />
        <View style={{ height: 10 }} />
        <Bar width="40%" />
        <View style={{ height: 8 }} />
        <Bar width="80%" />
      </View>
    </View>
  );
}

function HomeSkeleton() {
  const { colors } = useRastroTheme();
  return (
    <View style={styles.root}>
      <Bar width="100%" height={168} radius={24} />
      <View style={{ height: 12 }} />
      <Bar width="42%" height={18} />
      <View style={[styles.card, { backgroundColor: colors.ctaSoft, flexDirection: "row", gap: 12 }]}>
        <View style={{ flex: 1, alignItems: "center", gap: 8 }}>
          <Bar width={36} height={36} radius={18} />
          <Bar width="50%" height={22} />
          <Bar width="70%" height={10} />
        </View>
        <View style={{ flex: 1, alignItems: "center", gap: 8 }}>
          <Bar width={36} height={36} radius={18} />
          <Bar width="50%" height={22} />
          <Bar width="70%" height={10} />
        </View>
        <View style={{ flex: 1, alignItems: "center", gap: 8 }}>
          <Bar width={36} height={36} radius={18} />
          <Bar width="50%" height={22} />
          <Bar width="70%" height={10} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={[styles.card, { flex: 1, backgroundColor: colors.ctaSoft, marginTop: 0 }]}>
          <Bar width="70%" />
          <View style={{ height: 12 }} />
          <Bar width="100%" height={28} />
          <View style={{ height: 8 }} />
          <Bar width="100%" height={28} />
        </View>
        <Bar width="42%" height={150} radius={18} />
      </View>
    </View>
  );
}

function RegistroSkeleton() {
  const { colors } = useRastroTheme();
  return (
    <View style={styles.root}>
      <View style={[styles.card, { backgroundColor: colors.ctaSoft, alignItems: "center" }]}>
        <Bar width={56} height={56} radius={28} />
        <View style={{ height: 12 }} />
        <Bar width="55%" />
        <View style={{ height: 8 }} />
        <Bar width="40%" height={10} />
      </View>
      <View style={[styles.card, { backgroundColor: colors.ctaSoft, flexDirection: "row", alignItems: "center", gap: 12 }]}>
        <Bar width={40} height={40} radius={20} />
        <View style={{ flex: 1, gap: 8 }}>
          <Bar width="60%" />
          <Bar width="90%" height={10} />
        </View>
      </View>
      <Bar width="38%" />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Bar width="30%" height={36} radius={999} />
        <Bar width="36%" height={36} radius={999} />
        <Bar width="28%" height={36} radius={999} />
        <Bar width="40%" height={36} radius={999} />
        <Bar width="32%" height={36} radius={999} />
      </View>
      <Bar width="100%" height={88} radius={16} />
    </View>
  );
}

export function MeshSkeleton({
  variant = "feed",
}: {
  variant?: "feed" | "home" | "registro";
}) {
  if (variant === "home") return <HomeSkeleton />;
  if (variant === "registro") return <RegistroSkeleton />;
  return <FeedSkeleton />;
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 10,
  },
  bar: {
    overflow: "hidden",
    backgroundColor: "rgba(63,191,124,0.12)",
  },
  sweep: {
    ...StyleSheet.absoluteFillObject,
    width: 80,
    backgroundColor: "rgba(63,191,124,0.45)",
  },
  card: {
    marginTop: 8,
    borderRadius: 16,
    padding: 12,
    overflow: "hidden",
  },
});
