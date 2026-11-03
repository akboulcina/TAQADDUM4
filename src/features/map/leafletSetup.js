/*
 * leaflet.markercluster is a classic plugin that expects a global `L`. Under an ES-module
 * bundler that global is not guaranteed, so it is set here, and every file that needs the
 * plugin imports this module FIRST.
 *
 * Marker images: the map never uses Leaflet's default PNG marker. Project markers are
 * `L.divIcon`s with inline SVG (see markerIcons.js) and clusters are CSS-only, so there is no
 * `marker-icon.png` path to repair under Vite.
 */
import L from 'leaflet';

if (typeof window !== 'undefined' && !window.L) window.L = L;

export default L;
