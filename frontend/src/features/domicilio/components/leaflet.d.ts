/**
 * Leaflet is published without its own TypeScript declarations in this project.
 * These declarations cover the React-Leaflet surface used by the application
 * until `@types/leaflet` is added as a package dependency.
 */
declare module "leaflet" {
  export type LatLngExpression = [number, number] | { lat: number; lng: number };
  export type LatLngBoundsExpression =
    | LatLngExpression
    | [LatLngExpression, LatLngExpression];

  export interface MapOptions {
    center?: LatLngExpression;
    zoom?: number;
    [key: string]: unknown;
  }

  export interface FitBoundsOptions { [key: string]: unknown }
  export interface LayerOptions { [key: string]: unknown }
  export interface InteractiveLayerOptions extends LayerOptions { [key: string]: unknown }
  export interface PathOptions extends InteractiveLayerOptions { [key: string]: unknown }
  export interface MarkerOptions extends InteractiveLayerOptions { [key: string]: unknown }
  export interface TileLayerOptions extends LayerOptions {
    attribution?: string;
    [key: string]: unknown;
  }
  export interface WMSOptions extends TileLayerOptions { [key: string]: unknown }
  export interface WMSParams { [key: string]: unknown }
  export interface VideoOverlayOptions extends LayerOptions { [key: string]: unknown }
  export interface ImageOverlayOptions extends LayerOptions { [key: string]: unknown }
  export interface GeoJSONOptions extends LayerOptions { [key: string]: unknown }
  export interface TooltipOptions extends LayerOptions { [key: string]: unknown }
  export interface PolylineOptions extends PathOptions { [key: string]: unknown }
  export interface CircleOptions extends PathOptions { [key: string]: unknown }
  export interface CircleMarkerOptions extends CircleOptions { [key: string]: unknown }
  export interface ControlOptions { [key: string]: unknown }
  export interface GridLayerOptions extends LayerOptions { [key: string]: unknown }
  export interface LeafletEventHandlerFnMap { [key: string]: unknown }

  export class Evented {}
  export class Layer extends Evented {}
  export class Path extends Layer {}
  export class Map extends Evented {
    setView(center: LatLngExpression, zoom?: number, options?: MapOptions): this;
  }
  export class Marker extends Layer {}
  export class TileLayer extends Layer {}
  export class VideoOverlay extends Layer {}
  export class GeoJSON extends Layer {}
  export class SVGOverlay extends Layer {}
  export class ImageOverlay extends Layer {}
  export class CircleMarker extends Path {}
  export class Circle extends CircleMarker {}
  export class Control extends Evented {}
  export class Tooltip extends Layer {}
  export class Polyline extends Path {}
  export class FeatureGroup extends Layer {}
  export class Popup extends Layer {}
  export class Polygon extends Polyline {}
  export class LayerGroup extends Layer {}
  export class Rectangle extends Polygon {}
  export class GridLayer extends Layer {}

  interface DefaultIcon {
    prototype: { _getIconUrl?: unknown };
    mergeOptions(options: Record<string, string>): void;
  }

  const leaflet: {
    Icon: { Default: DefaultIcon };
  };

  export default leaflet;
}
