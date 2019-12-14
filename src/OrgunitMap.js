import * as turf from "@turf/turf";
import React, { useState, useRef, useEffect } from "react";
import { AsPrimitive } from "./AsPrimitive";
import { Map, CircleMarker, Popup, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";

import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";

const maps = [
  {
    name: "Thunderforest - Outdoors",
    attribution: "Thunderforest and OpenStreetMap contributors.",
    url:
      "https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}{r}.png?apikey=7c352c8ff1244dd8b732e349e0b0fe8d"
  },
  {
    name: "Thunderforest - Landscapes",
    attribution: "Thunderforest and OpenStreetMap contributors.",
    url:
      "https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}{r}.png?apikey=7c352c8ff1244dd8b732e349e0b0fe8d"
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

function OrgunitMap({ lines, position, showableMap }) {
  const [clicked, setClicked] = useState("");
  const [selectedLayer, setSelectedLayer] = useState(maps[0]);

  if (lines == undefined) {
    return <></>;
  }

  if (!showableMap) {
    return <p>Map will show if the lines contains a 'coordinates' field</p>;
  }

  function onFeature(feature) {
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
      return (
        <GeoJSON
          data={geometry}
          key={"parent-" + index}
          style={{
            fillColor: line.fillColor || getRandomColor(),
            color: line.color || getRandomColor(),
            weight: line.opacity || opacity,
            opacity: line.opacity || opacity,
            fillOpacity: line.opacity || opacity
          }}
          title={JSON.stringify(line)}
          onClick={() => {
            onFeature(line);
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
    <>
      <div>
        {lines.length} records. {points.length} points displayed.{" "}
        {geojsons.length} zones displayed.{" "}
        {isString(clicked.name) ? clicked.name : ""}
      </div>
      <FormControl>
        <InputLabel>Layer</InputLabel>
        <Select onChange={mapSelected} value={selectedLayer}>
          {maps.map(m => (
            <MenuItem value={m}>{m.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Map
        doubleClickZoom={false}
        center={position}
        zoom={3}
        style={{
          width: "80%",
          height: "900px",
          padding: "0px"
        }}
      >
        <TileLayer {...selectedLayer}></TileLayer>
        {geojsons}
        {points}
      </Map>
    </>
  );
}

export default OrgunitMap;
