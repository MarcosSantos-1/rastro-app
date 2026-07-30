import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["react-leaflet", "leaflet", "leaflet.markercluster"],
};

export default nextConfig;
