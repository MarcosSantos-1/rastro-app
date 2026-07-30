import { Redirect } from "expo-router";

/** Etapa de teste: sempre abre pelo onboarding. */
export default function IndexGate() {
  return <Redirect href="/onboarding" />;
}
