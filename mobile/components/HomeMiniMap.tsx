import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { useRastroTheme } from "@/contexts/ThemeContext";

const FALLBACK = { lat: -23.5505, lng: -46.6333 };

export type HomeMiniMapDot = {
  id: string;
  lat: number;
  lng: number;
  kind: "ocorrencia" | "ecoponto";
};

type Props = {
  center: { lat: number; lng: number } | null;
  user: { lat: number; lng: number } | null;
  dots: HomeMiniMapDot[];
};

function buildHtml(
  lat: number,
  lng: number,
  dots: HomeMiniMapDot[],
  user: { lat: number; lng: number } | null,
  theme: { cta: string; pinBlue: string; statusGreen: string; bg: string; isDark: boolean },
): string {
  const payload = JSON.stringify({
    lat,
    lng,
    dots,
    user,
    green: theme.statusGreen,
    blue: theme.pinBlue,
    cta: theme.cta,
    tiles: theme.isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: ${theme.bg}; overflow: hidden; }
    .leaflet-control-container { display: none !important; }
    .user-tri {
      width: 0; height: 0;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-bottom: 14px solid ${theme.cta};
      filter: drop-shadow(0 1px 1px rgba(0,0,0,.35));
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const D = ${payload};
    const map = L.map("map", {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
      touchZoom: false,
      bounceAtZoomLimits: false,
    }).setView([D.lat, D.lng], 15);
    L.tileLayer(D.tiles, {
      attribution: "",
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);
    for (const d of D.dots) {
      L.circleMarker([d.lat, d.lng], {
        radius: 6,
        color: "#fff",
        weight: 1.5,
        fillColor: d.kind === "ecoponto" ? D.blue : D.green,
        fillOpacity: 1,
      }).addTo(map);
    }
    if (D.user) {
      const icon = L.divIcon({
        className: "",
        html: '<div class="user-tri"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 10],
      });
      L.marker([D.user.lat, D.user.lng], { icon: icon, interactive: false }).addTo(map);
    }
    setTimeout(function () { map.invalidateSize(); }, 80);
  </script>
</body>
</html>`;
}

export function HomeMiniMap({ center, user, dots }: Props) {
  const { colors, isDark } = useRastroTheme();
  const lat = user?.lat ?? center?.lat ?? FALLBACK.lat;
  const lng = user?.lng ?? center?.lng ?? FALLBACK.lng;
  const html = useMemo(
    () =>
      buildHtml(lat, lng, dots, user, {
        cta: colors.cta,
        pinBlue: colors.pinBlue,
        statusGreen: colors.statusGreen,
        bg: colors.bg,
        isDark,
      }),
    [lat, lng, dots, user, colors, isDark],
  );

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg }]} pointerEvents="none">
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.map}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        javaScriptEnabled
        setSupportMultipleWindows={false}
        androidLayerType="hardware"
        mixedContentMode="always"
        allowsInlineMediaPlayback
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  map: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
