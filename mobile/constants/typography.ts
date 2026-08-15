import { colors, type ThemeColors } from "@/constants/colors";

export const fonts = {
  display: "Archivo_900Black",
  body: "Archivo_400Regular",
  bodySemi: "Archivo_600SemiBold",
  data: "MartianMono_500Medium",
} as const;

export function makeTypography(c: ThemeColors) {
  return {
    display: {
      fontFamily: fonts.display,
      letterSpacing: -0.8,
      color: c.verdeEsc,
    },
    title: {
      fontFamily: fonts.display,
      letterSpacing: -0.4,
      color: c.verdeEsc,
    },
    body: {
      fontFamily: fonts.body,
      color: c.text,
    },
    bodySemi: {
      fontFamily: fonts.bodySemi,
      color: c.text,
    },
    data: {
      fontFamily: fonts.data,
      letterSpacing: -0.3,
      textTransform: "uppercase" as const,
      color: c.verdeEsc,
    },
    eyebrow: {
      fontFamily: fonts.data,
      fontSize: 10,
      letterSpacing: 1.6,
      textTransform: "uppercase" as const,
      color: c.textMuted,
    },
  };
}

export const typography = makeTypography(colors);
