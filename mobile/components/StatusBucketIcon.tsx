import { Image } from "expo-image";
import type { HomeStatusBucket } from "@/lib/denuncias";

const ICONS = {
  encaminhado: require("@/assets/images/icons/send.png"),
  em_execucao: require("@/assets/images/icons/garbage-truck.png"),
  resolvido: require("@/assets/images/onboarding/success.png"),
} as const;

type StatusBucketIconProps = {
  bucket: HomeStatusBucket;
  size?: number;
};

export function StatusBucketIcon({ bucket, size = 32 }: StatusBucketIconProps) {
  return (
    <Image
      source={ICONS[bucket]}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
