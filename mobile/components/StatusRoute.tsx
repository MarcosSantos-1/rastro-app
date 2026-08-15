import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";
import { fonts } from "@/constants/typography";
import { useRastroTheme } from "@/contexts/ThemeContext";
import type { HomeStatusBucket } from "@/lib/denuncias";

const STEPS = ["Reg.", "Enc.", "Exec.", "Resolv."] as const;

function filledCount(bucket: HomeStatusBucket | null, discarded: boolean): number {
  if (discarded || !bucket) return 1;
  if (bucket === "encaminhado") return 2;
  if (bucket === "em_execucao") return 3;
  return 4;
}

export function StatusRoute({
  bucket,
  discarded = false,
}: {
  bucket: HomeStatusBucket | null;
  discarded?: boolean;
}) {
  const { colors } = useRastroTheme();
  const filled = filledCount(bucket, discarded);
  const on = discarded ? colors.danger : colors.cta;
  const off = colors.border;

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        {STEPS.map((_, i) => {
          const done = i < filled;
          const current = i === filled - 1 && filled < STEPS.length;
          return (
            <Fragment key={STEPS[i]}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: done ? on : "transparent",
                    borderColor: done ? on : off,
                  },
                  current && { backgroundColor: "transparent", borderColor: on },
                ]}
              />
              {i < STEPS.length - 1 ? (
                <View style={[styles.line, { backgroundColor: i < filled - 1 ? on : off }]} />
              ) : null}
            </Fragment>
          );
        })}
      </View>
      <View style={styles.labels}>
        {STEPS.map((label, i) => (
          <Text
            key={label}
            style={[styles.label, { color: i < filled ? on : colors.textMuted }]}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: 2,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  label: {
    fontFamily: fonts.data,
    fontSize: 8,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
