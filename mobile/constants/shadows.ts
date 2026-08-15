import { colors, type ThemeColors } from "@/constants/colors";

export function makeShadows(c: ThemeColors, isDark = false) {
  if (isDark) {
    return {
      card: {
        shadowColor: "#000",
        shadowOpacity: 0,
        shadowRadius: 0,
        shadowOffset: { width: 0, height: 0 },
        elevation: 0,
      },
      cardSoft: {
        shadowColor: "#000",
        shadowOpacity: 0,
        shadowRadius: 0,
        shadowOffset: { width: 0, height: 0 },
        elevation: 0,
      },
      fab: {
        shadowColor: c.cta,
        shadowOpacity: 0.45,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
      },
    };
  }

  return {
    card: {
      shadowColor: c.text,
      shadowOpacity: 0.14,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    cardSoft: {
      shadowColor: c.text,
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    fab: {
      shadowColor: c.cta,
      shadowOpacity: 0.45,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
  };
}

export const shadows = makeShadows(colors, false);
