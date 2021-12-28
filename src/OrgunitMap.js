import * as turf from "@turf/turf";
import PixiOverlay from "react-leaflet-pixi-overlay";
import { renderToString } from "react-dom/server";
import React, { useState, useRef, useEffect } from "react";
import { AsPrimitive } from "./AsPrimitive";
import {
  Map,
  TileLayer,
  GeoJSON
} from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import CoordinatesControl from "./leaflet/CoordinatesControl";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import Button from "@material-ui/core/Button";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

const shapesFeatureType = ["LineString", "Polygon", "MultiPolygon"];

const maps = [
  {
    name: "Thunderforest - Landscapes",
    attribution: "Thunderforest and OpenStreetMap contributors.",
    url:
      "https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}{r}.png?apikey=7c352c8ff1244dd8b732e349e0b0fe8d",
  },
  {
    name: "Thunderforest - Outdoors",
    attribution: "Thunderforest and OpenStreetMap contributors.",
    url:
      "https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}{r}.png?apikey=7c352c8ff1244dd8b732e349e0b0fe8d",
  },
  {
    name: "Stamen Design - Toner",
    attribution: `Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.`,
    url: "https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png",
  },
  {
    name: "Stamen Design - Water color",
    url: "https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png",
    attribution:
      'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  {
    name: "Google maps - Satelite",
    url: "http://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    attribution: "Google",
  },
];

const bboxForPoints = (points) => {
  const result = [Infinity, Infinity, -Infinity, -Infinity];
  for (let point of points) {
    let coord = point.position;
    if (result[0] > coord[0]) {
      result[0] = coord[0];
    }
    if (result[1] > coord[1]) {
      result[1] = coord[1];
    }
    if (result[2] < coord[0]) {
      result[2] = coord[0];
    }
    if (result[3] < coord[1]) {
      result[3] = coord[1];
    }
  }

  return result;
};

function isString(r) {
  return typeof r == "string";
}
function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function OrgunitMap({
  lines,
  position,
  showableMap,
  width,
  height,
  showLayers,
}) {
  const [status, setStatus] = useState("");
  const [clicked, setClicked] = useState("");
  const [selectedLayer, setSelectedLayer] = useState(maps[0]);
  const [rawPoints, setRawPoints] = React.useState(undefined);
  const [pointMarkers, setPointMarkers] = React.useState(undefined);
  const [rawGeojsons, setRawGeojsons] = React.useState(undefined);
  const mapRef = useRef(null);
  const handleClick = () => {
    if (mapRef && mapRef.current) {
      let bound = undefined;
      const map = mapRef.current.leafletElement;
      if (pointMarkers && pointMarkers.length > 0) {
        const bbox = bboxForPoints(pointMarkers);
        bound = bbox;
      }

      if (bound && bound[0] !== Infinity) {
        const southWest = L.latLng(bound[0], bound[1]);
        const northEast = L.latLng(bound[2], bound[3]);
        const bounds = L.latLngBounds(southWest, northEast);

        map.fitBounds(bounds);
      } else if (rawGeojsons && rawGeojsons.length > 0) {
        const functionPoly = turf.bbox;
        // only geojson
        var bboxPolygon = functionPoly({
          type: "FeatureCollection",
          features: rawGeojsons,
        });

        if (bboxPolygon) {
          const southWest = L.latLng(bboxPolygon[1], bboxPolygon[0]);
          const northEast = L.latLng(bboxPolygon[3], bboxPolygon[2]);
          const bounds = L.latLngBounds(southWest, northEast);
          map.fitBounds(bounds);
        }
      }
    }
  };
  useEffect(() => {
    setTimeout(() => {
      handleClick();
    }, 1000);
  }, [mapRef, pointMarkers]);

  useEffect(() => {
    if (mapRef && mapRef.current && mapRef.current.leafletElement) {
      const map = mapRef.current.leafletElement;
      map.on("click", function(event) {
        let nextTarget = document.getElementsByClassName(
          "leaflet-pixi-overlay"
        )[0];
        nextTarget.style.zIndex = -1;
      });
      map.on(
        "mousemove",
        L.Util.throttle(function(event) {
          if (event.originalEvent) {
            // get the target pane
            var currentTarget = event.originalEvent.target;
            var stopped;
            var removed;
            // attempt to grab the next layer below
            let nextTarget = document.getElementsByClassName(
              "leaflet-pixi-overlay"
            )[0];

            /*let nextTarget = document.elementFromPoint(
                event.originalEvent.clientX,
                event.originalEvent.clientY
              );*/

            // we keep drilling down until we get stopped,
            // or we reach the map container itself
            if (
              nextTarget &&
              nextTarget.nodeName.toLowerCase() !== "body" &&
              nextTarget.classList.value.indexOf("leaflet-container") === -1 &&
              currentTarget !== nextTarget
            ) {
              var ev = new MouseEvent(event.type, event.originalEvent);
              nextTarget.style.zIndex = 1000;

              stopped = !nextTarget.dispatchEvent(ev);
              if (stopped || ev._stopped) {
                L.DomEvent.stop(event);
              }
            }
          }
        }, 32)
      );
    }
  }, [mapRef]);
  useEffect(() => {
    if (lines == undefined) {
      return;
    }
    const newRawPoints = lines.filter((l) => {
      if (l == undefined) {
        return false;
      }
      if (
        l.coordinates === undefined &&
        l.coordinate === undefined &&
        l.geometry === undefined
      ) {
        return false;
      }
      const isEventCoordinates =
        l.coordinate && l.coordinate.latitude && l.coordinate.longitude;
      if (isEventCoordinates) {
        return true;
      }
      if (l.geometry && l.geometry.type == "Point") {
        return true;
      }
      if (l.coordinates === undefined) {
        return false;
      }
      return (
        isString(l.coordinates) &&
        !l.coordinates.startsWith("[[") &&
        l.coordinates != ""
      );
    });

    const newGeojsons = lines
      .filter(
        (l) =>
          (l.coordinates &&
            isString(l.coordinates) &&
            l.coordinates.startsWith("[[")) ||
          (l.geometry &&
            l.geometry.type &&
            shapesFeatureType.includes(l.geometry.type))
      )
      .map((line) => {
        let geometry = line.geometry;
        try {
          geometry = turf.polygon(JSON.parse(line.coordinates));
        } catch (ignored) {
          try {
            geometry = turf.multiPolygon(JSON.parse(line.coordinates));
          } catch (ignored) {}
        }
        if (geometry) {
          if (geometry.properties == undefined) {
            geometry.properties = {};
          }
          if (geometry.properties) {
            geometry.properties.line = line;
          }
        }
        return geometry;
      })
      .filter((g) => g);

    const markers = newRawPoints.map((line, index) => {
      const latlong =
        line.coordinate && line.coordinate.latitude && line.coordinate.longitude
          ? [line.coordinate.latitude, line.coordinate.longitude]
          : line.coordinates
          ? JSON.parse(line.coordinates).reverse()
          : line.geometry && line.geometry.coordinates.slice(0).reverse();
      const color = line.color || "red";
      return {
        id: "points" + index,
        iconColor: color,
        position: latlong,
        tooltip: () => {
          return renderToString(
            <div>
              {Object.keys(line).map((k) => {
                return (
                  <div>
                    <b>{k}</b> <AsPrimitive value={line[k]} />
                  </div>
                );
              })}
            </div>
          );
        },

        customIcon:
          '<svg xmlns="http://www.w3.org/2000/svg" fill="' +
          color +
          '" width="5" height="5" viewBox="0 0 5 5"><circle cx="0" cy="0" r="5" stroke="' +
          color +
          '" stroke-width="5" fill="' +
          color +
          '" /></svg>',
      };
    });
    setRawGeojsons(newGeojsons);
    setRawPoints(newRawPoints);
    setPointMarkers(markers);
    handleClick();
  }, [lines]);
  if (lines == undefined || lines == null) {
    return <></>;
  }

  if (!showableMap) {
    return (
      <p>
        Map will show if the lines contains a 'coordinates' or 'geometry' field
      </p>
    );
  }

  function onFeature(feature, event) {
    if (event.originalEvent._stopped) {
      return;
    }

    // get the target pane
    var currentTarget = event.originalEvent.target;
    var stopped;
    var removed;

    // hide the target node
    removed = {
      node: currentTarget,
      pointerEvents: currentTarget.style.pointerEvents,
    };
    currentTarget.style.pointerEvents = "none";

    // attempt to grab the next layer below
    let nextTarget = document.elementFromPoint(
      event.originalEvent.clientX,
      event.originalEvent.clientY
    );

    // we keep drilling down until we get stopped,
    // or we reach the map container itself
    //nextTarget = mapRef.current.container.children[0].children[2].children[1].children[0]
    if (
      nextTarget &&
      nextTarget.nodeName.toLowerCase() !== "body" &&
      nextTarget.classList.value.indexOf("leaflet-container") === -1
    ) {
      var ev = new MouseEvent(event.originalEvent.type, event.originalEvent);
      stopped = !nextTarget.dispatchEvent(ev);
      if (stopped || ev._stopped) {
        L.DomEvent.stop(event);
      }
    }

    // restore pointerEvents
    removed.node.style.pointerEvents = removed.pointerEvents;
    setClicked(feature);
  }

  const geojsons =
    rawGeojsons == undefined
      ? []
      : rawGeojsons.filter(geometry => geometry && geometry.properties && geometry.properties.line).map((geometry, index) => {
          const line = geometry.properties.line;
          const opacity = geometry.type == "LineString" ? 1 : 0.3;
          line.fillColor = line.fillColor || getRandomColor();
          const style = {
            fillColor: line.fillColor,
            color: line.color || getRandomColor(),
            weight: line.opacity || opacity,
            opacity: line.opacity || opacity,
            fillOpacity: line.opacity || opacity,
          };
          if (clicked == line) {
            style.weight = 3;
            style.opacity = 0.8;
            style.dashArray = "5,5";
          }
          return (
            <GeoJSON
              data={geometry}
              key={"parent-" + index + (clicked == line ? "clicked" : "none")}
              style={style}
              title={JSON.stringify(line, getCircularReplacer())}
              onClick={(event) => {
                onFeature(line, event);
              }}
            />
          );
        });

  const mapSelected = (event, val) => {
    setSelectedLayer(val.props.value);
  };

  return (
    <div className="avoid-page-break">
      <p>{status}</p>
      {showLayers && (
        <div
          style={{
            display: "flex",
          }}
        >
          <FormControl>
            <InputLabel>Layer</InputLabel>
            <Select onChange={mapSelected} value={selectedLayer}>
              {maps.map((m) => (
                <MenuItem value={m}>{m.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button onClick={handleClick}>Fit</Button>
        </div>
      )}
      <div>
        {lines.length} records. {rawPoints ? rawPoints.length : "?"} points
        displayed. {geojsons.length} zones displayed.{" "}
        {clicked &&
          Object.keys(clicked)
            .filter((k) => !["geometry", "coordinates"].includes(k))
            .map((k) => {
              return (
                <div>
                  <b>{k}</b> <AsPrimitive value={clicked[k]} />
                </div>
              );
            })}
      </div>

      <Map
        preferCanvas={true}
        doubleClickZoom={false}
        center={position}
        zoom={3}
        ref={mapRef}
        style={{
          width: width || "80%",
          height: height || "900px",
          padding: "0px",
        }}
      >
        <TileLayer {...selectedLayer}></TileLayer>
        <CoordinatesControl position="top" coordinates="decimal" />

        {pointMarkers && (
          <PixiOverlay markers={pointMarkers} interactive={true} />
        )}
        {geojsons}
      </Map>
    </div>
  );
}

export default OrgunitMap;
