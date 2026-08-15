export type ThemeColors = {
  bg: string;
  bgElevated: string;
  text: string;
  textMuted: string;
  border: string;
  cta: string;
  ctaPressed: string;
  homeFocus: string;
  ctaText: string;
  ctaSoft: string;
  verdeEsc: string;
  creme: string;
  ambar: string;
  pinBlue: string;
  pinGreen: string;
  pinRed: string;
  pinAmber: string;
  userCyan: string;
  statusCyan: string;
  statusCyanSoft: string;
  statusOrange: string;
  statusOrangeSoft: string;
  statusGreen: string;
  statusGreenSoft: string;
  danger: string;
  overlay: string;
};

/** Dia — papel, tinta e verde da direção criativa. */
export const lightColors: ThemeColors = {
  bg: "#F3F6F4",
  bgElevated: "#ffffff",
  text: "#0C1A13",
  textMuted: "#7E8F86",
  border: "rgba(18, 58, 38, 0.07)",
  cta: "#28935D",
  ctaPressed: "#1f7349",
  homeFocus: "#3FBF7C",
  ctaText: "#ffffff",
  ctaSoft: "rgba(40, 147, 93, 0.12)",
  verdeEsc: "#123A26",
  creme: "#E8EFEA",
  ambar: "#E08A18",
  pinBlue: "#2563eb",
  pinGreen: "#28935D",
  pinRed: "#e05a3c",
  pinAmber: "#d4a017",
  userCyan: "#38bdf8",
  statusCyan: "#00b8d4",
  statusCyanSoft: "rgba(0, 184, 212, 0.16)",
  statusOrange: "#f97316",
  statusOrangeSoft: "rgba(249, 115, 22, 0.16)",
  statusGreen: "#22c55e",
  statusGreenSoft: "rgba(34, 197, 94, 0.16)",
  danger: "#b91c1c",
  overlay: "rgba(15, 23, 42, 0.45)",
};

/** Noite — verde-preto, não cinza invertido. */
export const darkColors: ThemeColors = {
  bg: "#07130D",
  bgElevated: "rgba(255,255,255,0.06)",
  text: "#F4FBF6",
  textMuted: "#7FA391",
  border: "rgba(63, 191, 124, 0.16)",
  cta: "#28935D",
  ctaPressed: "#1f7349",
  homeFocus: "#3FBF7C",
  ctaText: "#ffffff",
  ctaSoft: "rgba(63, 191, 124, 0.16)",
  verdeEsc: "#FFFFFF",
  creme: "#0B1A12",
  ambar: "#F0A93E",
  pinBlue: "#2563eb",
  pinGreen: "#3FBF7C",
  pinRed: "#e05a3c",
  pinAmber: "#F0A93E",
  userCyan: "#38bdf8",
  statusCyan: "#00b8d4",
  statusCyanSoft: "rgba(0, 184, 212, 0.16)",
  statusOrange: "#f97316",
  statusOrangeSoft: "rgba(249, 115, 22, 0.16)",
  statusGreen: "#22c55e",
  statusGreenSoft: "rgba(34, 197, 94, 0.16)",
  danger: "#f87171",
  overlay: "rgba(4, 16, 10, 0.72)",
};

/** Alias claro — telas ainda não migradas para o hook. */
export const colors = lightColors;
