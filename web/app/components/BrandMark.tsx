"use client";

import { useTheme } from "@/lib/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function BrandMark({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  const { isDark } = useTheme();
  return (
    <Image
      src={
        isDark
          ? "/brand/rastro_letter_white_padded.png"
          : "/brand/rastro_letter_padded.png"
      }
      alt="Rastro"
      width={isDark ? 1142 : 1173}
      height={isDark ? 176 : 178}
      className={cn("h-[22px] w-auto object-contain sm:h-[25px]", className)}
      priority={priority}
    />
  );
}
