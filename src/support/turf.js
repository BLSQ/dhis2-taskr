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

turf.inBBox = (point, bbox) => {
  const pt = point.geometry.coordinates;
  return (
    bbox[0] <= pt[0] && bbox[1] <= pt[1] && bbox[2] >= pt[0] && bbox[3] >= pt[1]
  );
};

const oldPointsWithinPolygon = turf.pointsWithinPolygon;

turf.pointsWithinPolygon = (points, polygon) => {
  const bbox = turf.bbox(polygon);
  const pointsInBbox = points.features.filter((pt) => turf.inBBox(pt, bbox));
  return oldPointsWithinPolygon(turf.featureCollection(pointsInBbox), polygon);
};

export default turf;
