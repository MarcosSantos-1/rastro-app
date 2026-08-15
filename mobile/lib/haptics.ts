import * as Haptics from "expo-haptics";

/** Uma batida no obturador — a foto vira prova. */
export function hapticShutter() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Dupla seca quando o registro sai. */
export async function hapticSent() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  await new Promise((r) => setTimeout(r, 70));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
}

/** Leve quando o status vira resolvido. */
export function hapticResolved() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
