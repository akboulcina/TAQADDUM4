import './leafletSetup.js'; // must run before the plugin
import 'leaflet.markercluster';
import L from 'leaflet';
import { createElementObject, createLayerComponent, extendContext } from '@react-leaflet/core';
import { clusterIcon } from './markerIcons.js';

/*
 * <MarkerClusterLayer> — react-leaflet wrapper around L.markerClusterGroup.
 *
 * It is a normal layer component whose children (<Marker>) are added to the cluster group
 * instead of the map, exactly like react-leaflet's own <LayerGroup>. The plugin is used
 * directly because the community wrappers are not maintained for the react-leaflet version in use.
 */
export const MarkerClusterLayer = createLayerComponent(
  function createClusterGroup({ children: _children, ...options }, context) {
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 48,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: clusterIcon,
      ...options
    });
    return createElementObject(group, extendContext(context, { layerContainer: group }));
  }
);

export default MarkerClusterLayer;
