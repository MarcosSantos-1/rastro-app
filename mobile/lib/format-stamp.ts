/** Selo de prova sobre a foto — data, hora e coordenada. */
export function formatPhotoStamp(date: Date, lat?: number | null, lng?: number | null): string {
  const day = date
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .replace(".", "")
    .toUpperCase();
  const time = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const geo =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)
      ? `${lat.toFixed(4)} ${lng.toFixed(4)}`
      : "";
  return geo ? `${day} · ${time}\n${geo}` : `${day} · ${time}`;
}

/** Protocolo emitido a partir do id do Firestore. */
export function formatProtocol(id: string, date = new Date()): string {
  const y = date.getFullYear();
  const md = `${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const tail = id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase().padStart(4, "0");
  return `RS-${y}-${md}-${tail}`;
}
