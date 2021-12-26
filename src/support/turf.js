import * as turf from "@turf/turf";

turf.geometrify = (line) => {
  let geometry = line.geometry;
  try {
    const latlong =
      line.coordinate && line.coordinate.latitude && line.coordinate.longitude
        ? [line.coordinate.latitude, line.coordinate.longitude]
        : line.coordinates
        ? JSON.parse(line.coordinates)
        : line.geometry && line.geometry.coordinates;
    geometry = turf.point(latlong);
  } catch (ignored) {
    try {
      geometry = turf.polygon(JSON.parse(line.coordinates));
    } catch (ignored) {
      try {
        geometry = turf.multiPolygon(JSON.parse(line.coordinates));
      } catch (ignored) {}
    }
  }
  if (geometry) {
    if (geometry.properties) {
      geometry.properties.line = line;
    }
  }
  line.geometry = geometry;
  return geometry;
};

export default turf;
