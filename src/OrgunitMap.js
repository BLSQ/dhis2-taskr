import * as turf from "@turf/turf";
import React, { useState, useRef, useEffect } from "react";
import { AsPrimitive } from "./AsPrimitive";
import {
  Map,
  CircleMarker,
  Popup,
  TileLayer,
  GeoJSON,
  FeatureGroup
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

const maps = [
  {
    name: "Thunderforest - Landscapes",
    attribution: "Thunderforest and OpenStreetMap contributors.",
    url:
      "https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}{r}.png?apikey=7c352c8ff1244dd8b732e349e0b0fe8d"
  },
  {
    name: "Thunderforest - Outdoors",
    attribution: "Thunderforest and OpenStreetMap contributors.",
    url:
      "https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}{r}.png?apikey=7c352c8ff1244dd8b732e349e0b0fe8d"
  },
  {
    name: "Google maps - Satelite",
    url: "http://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    attribution: "Google"
  }
];

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
  showLayers
}) {
  const [clicked, setClicked] = useState("");
  const [selectedLayer, setSelectedLayer] = useState(maps[0]);
  const mapRef = useRef(null);
  const handleClick = () => {
    if (mapRef && mapRef.current) {
      const map = mapRef.current.leafletElement;
      const bounds = Object.values(map._targets)
        .filter((l, index) => (l.getBounds || l.getLatLng) && index > 0)
        .map(l => (l.getBounds ? l.getBounds() : l.getLatLng().toBounds(10)));
      const bound = bounds[0];
      bounds.forEach(b => bound.extend(b));
      if (bound) {
        map.fitBounds(bound);
      }
    }
  };
  useEffect(() => {
    setTimeout(() => {
      handleClick();
    }, 1000);
  }, [mapRef]);
  if (lines == undefined || lines == null) {
    return <></>;
  }

  if (!showableMap) {
    return <p>Map will show if the lines contains a 'coordinates' field</p>;
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
      pointerEvents: currentTarget.style.pointerEvents
    };
    currentTarget.style.pointerEvents = "none";

    // attempt to grab the next layer below
    let nextTarget = document.elementFromPoint(
      event.originalEvent.clientX,
      event.originalEvent.clientY
    );

    // we keep drilling down until we get stopped,
    // or we reach the map container itself
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

  const geojsons = lines
    .filter(
      l =>
        (l.coordinates &&
          isString(l.coordinates) &&
          l.coordinates.startsWith("[[")) ||
        (l.geometry &&
          l.geometry.type &&
          ["LineString", "Polygon", "MultiPolygon"].includes(l.geometry.type))
    )
    .map((line, index) => {
      let geometry = line.geometry;
      try {
        geometry = turf.polygon(JSON.parse(line.coordinates));
      } catch (ignored) {
        try {
          geometry = turf.multiPolygon(JSON.parse(line.coordinates));
        } catch (ignored) {}
      }
      if (geometry) {
        if (geometry.properties) {
          geometry.properties.line = line;
        }
      }
      const opacity = geometry.type == "LineString" ? 1 : 0.3;
      line.fillColor = line.fillColor || getRandomColor();
      const style = {
        fillColor: line.fillColor,
        color: line.color || getRandomColor(),
        weight: line.opacity || opacity,
        opacity: line.opacity || opacity,
        fillOpacity: line.opacity || opacity
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
          onClick={event => {
            onFeature(line, event);
          }}
        />
      );
    });

  const points = lines
    .filter(l => {
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
    })
    .map((line, index) => {
      const latlong =
        line.coordinate && line.coordinate.latitude && line.coordinate.longitude
          ? [line.coordinate.latitude, line.coordinate.longitude]
          : line.coordinates
          ? JSON.parse(line.coordinates).reverse()
          : line.geometry && line.geometry.coordinates.slice(0).reverse();
      return (
        <CircleMarker
          key={index}
          radius={2}
          center={latlong}
          color={line.color || "red"}
          title={index}
        >
          <Popup>
            {Object.keys(line).map(k => {
              return (
                <div>
                  <b>{k}</b> <AsPrimitive value={line[k]} />
                </div>
              );
            })}
          </Popup>
        </CircleMarker>
      );
    });
  const mapSelected = (event, val) => {
    setSelectedLayer(val.props.value);
  };

  return (
    <div className="avoid-page-break">
      {showLayers && (
        <div
          style={{
            display: "flex"
          }}
        >
          <FormControl>
            <InputLabel>Layer</InputLabel>
            <Select onChange={mapSelected} value={selectedLayer}>
              {maps.map(m => (
                <MenuItem value={m}>{m.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button onClick={handleClick}>Fit</Button>
        </div>
      )}
      <div>
        {lines.length} records. {points.length} points displayed.{" "}
        {geojsons.length} zones displayed.{" "}
        {clicked &&
          Object.keys(clicked)
            .filter(k => !["geometry", "coordinates"].includes(k))
            .map(k => {
              return (
                <div>
                  <b>{k}</b> <AsPrimitive value={clicked[k]} />
                </div>
              );
            })}
      </div>

      <Map
        doubleClickZoom={false}
        center={position}
        zoom={3}
        ref={mapRef}
        style={{
          width: width || "80%",
          height: height || "900px",
          padding: "0px"
        }}
      >
        <TileLayer {...selectedLayer}></TileLayer>
        <CoordinatesControl position="top" coordinates="decimal" />

        {geojsons}
        {points}
      </Map>
    </div>
  );
}

export default OrgunitMap;
