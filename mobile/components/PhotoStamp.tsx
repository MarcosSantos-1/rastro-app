import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { fonts } from "@/constants/typography";

type Props = {
  text: string;
  animate?: boolean;
};

export function PhotoStamp({ text, animate = false }: Props) {
  const opacity = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const scale = useRef(new Animated.Value(animate ? 1.45 : 1)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }),
    ]).start();
  }, [animate, opacity, scale]);

  return (
    <Animated.View style={[styles.wrap, { opacity, transform: [{ scale }] }]} pointerEvents="none">
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    backgroundColor: "rgba(6,16,11,0.72)",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  text: {
    fontFamily: fonts.data,
    fontSize: 8,
    letterSpacing: 0.3,
    color: "#fff",
    lineHeight: 12,
  },
});
