"use client";

import { createLayerComponent } from "@react-leaflet/core";
import type { ReactNode } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { clusterDivIcon } from "./ocorrencia-markers";

type ClusterProps = L.MarkerClusterGroupOptions & {
  children?: ReactNode;
};

export const MarkerClusterGroup = createLayerComponent<
  L.MarkerClusterGroup,
  ClusterProps
>(
  function createMarkerClusterGroup(props, ctx) {
    const { children: _children, ...options } = props;
    const instance = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 56,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 18,
      iconCreateFunction: (cluster) => clusterDivIcon(cluster.getChildCount()),
      ...options,
    });
    return {
      instance,
      context: { ...ctx, layerContainer: instance },
    };
  },
  function updateMarkerClusterGroup() {
    // opções estáticas — remount via key se necessário
  },
);
