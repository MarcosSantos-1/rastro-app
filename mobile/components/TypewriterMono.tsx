import { useEffect, useState } from "react";
import { Text, type TextStyle } from "react-native";

export function TypewriterMono({ text, style }: { text: string; style?: TextStyle }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    setN(0);
    const id = setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          clearInterval(id);
          return v;
        }
        return v + 1;
      });
    }, 36);
    return () => clearInterval(id);
  }, [text]);

  return (
    <Text style={style}>
      {text.slice(0, n)}
      {n < text.length ? "▌" : ""}
    </Text>
  );
}
