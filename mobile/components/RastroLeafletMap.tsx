import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

export type RastroMapMarkerKind = "ecoponto" | "pendente" | "resolvido";

export type RastroMapMarker = {
  id: string;
  lat: number;
  lng: number;
  kind: RastroMapMarkerKind;
  title?: string;
};

export type RastroLeafletMapProps = {
  centerLat: number;
  centerLng: number;
  bufferM: number;
  markers: RastroMapMarker[];
  user: { lat: number; lng: number } | null;
};

export type RastroLeafletMapHandle = {
  focusUser: () => void;
};

const LEAFLET_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #0f172a; }
    .leaflet-container { background: #0f172a; font-family: system-ui, -apple-system, sans-serif; }
    .rastro-user-divicon { background: transparent !important; border: none !important; }
    .rastro-user-pin {
      position: relative; width: 44px; height: 44px;
      margin-left: -22px; margin-top: -22px; pointer-events: none;
    }
    .rastro-user-pulse {
      position: absolute; left: 50%; top: 50%; width: 22px; height: 22px;
      margin-left: -11px; margin-top: -11px; border-radius: 50%;
      background: rgba(56, 189, 248, 0.45);
      animation: rastroPulse 2s ease-out infinite;
    }
    .rastro-user-core {
      position: absolute; left: 50%; top: 50%; width: 16px; height: 16px;
      margin-left: -8px; margin-top: -8px; border-radius: 50%;
      background: #38bdf8; border: 3px solid #0284c7;
      box-shadow: 0 1px 4px rgba(2, 132, 199, 0.45);
    }
    @keyframes rastroPulse {
      0% { transform: scale(0.75); opacity: 0.85; }
      70% { transform: scale(2.4); opacity: 0; }
      100% { transform: scale(0.75); opacity: 0; }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script>
(function () {
  var map = null;
  var group = null;
  var userLayer = null;
  var userMarker = null;
  var lastCfg = null;
  var didInitialFit = false;

  var userIcon = L.divIcon({
    className: "rastro-user-divicon",
    html: "<div class=\\"rastro-user-pin\\"><div class=\\"rastro-user-pulse\\"></div><div class=\\"rastro-user-core\\"></div></div>",
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });

  function kindStyle(kind) {
    if (kind === "ecoponto") return { color: "#1d4ed8", fill: "#2563eb" };
    if (kind === "resolvido") return { color: "#15803d", fill: "#16a34a" };
    return { color: "#991b1b", fill: "#dc2626" };
  }

  function fitUserBuffer(cfg) {
    if (!map || !cfg) return;
    var lat = cfg.user && cfg.user.lat != null ? cfg.user.lat : cfg.centerLat;
    var lng = cfg.user && cfg.user.lng != null ? cfg.user.lng : cfg.centerLng;
    var c = L.latLng(lat, lng);
    try {
      var circle = L.circle(c, { radius: cfg.bufferM || 100 });
      map.fitBounds(circle.getBounds(), { padding: [36, 36], maxZoom: 18 });
    } catch (e) {
      map.setView([lat, lng], 17);
    }
  }

  function focusUser() {
    if (!map || !lastCfg) return;
    fitUserBuffer(lastCfg);
  }

  function setUser(u) {
    if (!map) {
      if (u && u.lat != null) window.__RASTRO_USER_PENDING = u;
      return;
    }
    window.__RASTRO_USER_PENDING = null;
    if (!userLayer) userLayer = L.layerGroup().addTo(map);
    if (!u || u.lat == null || u.lng == null) {
      if (userMarker) { userLayer.removeLayer(userMarker); userMarker = null; }
      if (lastCfg) lastCfg.user = null;
      return;
    }
    if (!lastCfg) lastCfg = {};
    lastCfg.user = { lat: u.lat, lng: u.lng };
    var ll = [u.lat, u.lng];
    if (!userMarker) {
      userMarker = L.marker(ll, { icon: userIcon, zIndexOffset: 1000 }).addTo(userLayer);
    } else {
      userMarker.setLatLng(ll);
    }
  }

  function draw(cfg) {
    if (!cfg) return;
    lastCfg = lastCfg || {};
    lastCfg.centerLat = cfg.centerLat;
    lastCfg.centerLng = cfg.centerLng;
    lastCfg.bufferM = cfg.bufferM;
    lastCfg.markers = cfg.markers;
    if (cfg.user) lastCfg.user = cfg.user;

    var c = [cfg.centerLat, cfg.centerLng];
    if (!map) {
      map = L.map("map", { zoomControl: true }).setView(c, 17);
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles © Esri",
        maxZoom: 19
      }).addTo(map);
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
        attribution: "© Esri",
        maxZoom: 19
      }).addTo(map);
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}", {
        attribution: "© Esri",
        maxZoom: 19
      }).addTo(map);
      group = L.layerGroup().addTo(map);
      userLayer = L.layerGroup().addTo(map);
    }
    group.clearLayers();

    if (cfg.bufferM > 0) {
      L.circle(c, {
        radius: cfg.bufferM,
        color: "#0f766e",
        weight: 2,
        fillColor: "#14b8a6",
        fillOpacity: 0.12
      }).addTo(group);
    }

    var pts = cfg.markers || [];
    for (var j = 0; j < pts.length; j++) {
      var m = pts[j];
      if (m.lat == null || m.lng == null) continue;
      var st = kindStyle(m.kind);
      var marker = L.circleMarker([m.lat, m.lng], {
        radius: m.kind === "ecoponto" ? 9 : 8,
        color: st.color,
        weight: 2,
        fillColor: st.fill,
        fillOpacity: 0.92
      }).addTo(group);
      if (m.title) marker.bindPopup(m.title);
    }

    if (cfg.user && cfg.user.lat != null) setUser(cfg.user);

    if (!didInitialFit) {
      fitUserBuffer(cfg);
      didInitialFit = true;
    }

    if (window.__RASTRO_USER_PENDING && window.__RASTRO_USER_PENDING.lat != null) {
      var pend = window.__RASTRO_USER_PENDING;
      window.__RASTRO_USER_PENDING = null;
      setUser(pend);
    }
  }

  window.__RASTRO_UPDATE = draw;
  window.__RASTRO_SET_USER = setUser;
  window.__RASTRO_FOCUS_USER = focusUser;
})();
  </script>
</body>
</html>`;

function buildPayload(p: RastroLeafletMapProps) {
  return {
    centerLat: p.centerLat,
    centerLng: p.centerLng,
    bufferM: p.bufferM,
    markers: p.markers.map((m) => ({
      id: m.id,
      lat: m.lat,
      lng: m.lng,
      kind: m.kind,
      title: m.title ?? "",
    })),
    user: p.user ? { lat: p.user.lat, lng: p.user.lng } : null,
  };
}

export const RastroLeafletMap = forwardRef<RastroLeafletMapHandle, RastroLeafletMapProps>(
  function RastroLeafletMap({ centerLat, centerLng, bufferM, markers, user }, ref) {
    const webRef = useRef<WebView>(null);

    const injectFull = useCallback((p: RastroLeafletMapProps) => {
      const json = JSON.stringify(buildPayload(p));
      const js = `(function(){try{if(window.__RASTRO_UPDATE){window.__RASTRO_UPDATE(${json});}}catch(e){}})();true;`;
      webRef.current?.injectJavaScript(js);
    }, []);

    const injectUserOnly = useCallback((u: { lat: number; lng: number } | null) => {
      const json = u ? JSON.stringify({ lat: u.lat, lng: u.lng }) : "null";
      const js = `(function(){try{if(window.__RASTRO_SET_USER){window.__RASTRO_SET_USER(${json});}}catch(e){}})();true;`;
      webRef.current?.injectJavaScript(js);
    }, []);

    const basePayload = useMemo(
      () => ({
        centerLat,
        centerLng,
        bufferM,
        markers,
        user: null as { lat: number; lng: number } | null,
      }),
      [centerLat, centerLng, bufferM, markers],
    );

    useEffect(() => {
      injectFull(basePayload);
    }, [basePayload, injectFull]);

    useEffect(() => {
      injectUserOnly(user);
    }, [user, injectUserOnly]);

    const onLoadEnd = useCallback(() => {
      injectFull(basePayload);
      injectUserOnly(user);
    }, [injectFull, injectUserOnly, basePayload, user]);

    useImperativeHandle(
      ref,
      () => ({
        focusUser: () => {
          webRef.current?.injectJavaScript(
            `(function(){try{window.__RASTRO_FOCUS_USER&&window.__RASTRO_FOCUS_USER();}catch(e){}})();true;`,
          );
        },
      }),
      [],
    );

    return (
      <View style={styles.wrap}>
        <WebView
          ref={webRef}
          style={styles.web}
          originWhitelist={["*"]}
          source={{ html: LEAFLET_HTML }}
          onLoadEnd={onLoadEnd}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          setSupportMultipleWindows={false}
          allowsInlineMediaPlayback
          {...(Platform.OS === "android" ? { androidLayerType: "hardware" as const } : {})}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0f172a" },
  web: { flex: 1, backgroundColor: "#0f172a" },
});
