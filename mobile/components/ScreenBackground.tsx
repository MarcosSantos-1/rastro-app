import { Image, StyleSheet, View } from "react-native";
import { useRastroTheme } from "@/contexts/ThemeContext";

/** Fundo fixo: uma imagem só (lavagem + malha), sem tile. */
export function ScreenBackground() {
  const { isDark, colors } = useRastroTheme();
  return (
    <View pointerEvents="none" style={[styles.root, { backgroundColor: colors.bg }]}>
      <Image
        source={
          isDark
            ? require("@/assets/images/papel-bg-dark.png")
            : require("@/assets/images/papel-bg.png")
        }
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
});
