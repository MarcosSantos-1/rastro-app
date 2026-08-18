import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { HomeStatusBucket } from "@/lib/denuncias";
import { useRastroTheme } from "@/contexts/ThemeContext";

type StatusBucketIconProps = {
  bucket: HomeStatusBucket;
  size?: number;
};

export function StatusBucketIcon({ bucket, size = 32 }: StatusBucketIconProps) {
  const { colors } = useRastroTheme();

  if (bucket === "em_execucao") {
    return <MaterialCommunityIcons name="dump-truck" size={size} color={colors.cta} />;
  }

  const name = bucket === "encaminhado" ? "send" : "checkmark-circle";
  return <Ionicons name={name} size={size} color={colors.cta} />;
}
