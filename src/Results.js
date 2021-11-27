import React, { useState, useMemo } from "react";
import MUIDataTable from "mui-datatables";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import OrgunitMap from "./OrgunitMap";
import { AsPrimitive } from "./AsPrimitive";
import ErrorBoundary from "./ErrorBoundary";
import Stats from "./Stats";

export function Results({ results, label, position }) {
  const [selectedTab, setSelectedTab] = useState(1);

  const memoizedKeys = useMemo(() => {
    if (!Array.isArray(results)) {
      return [];
    }
    const keySet = new Set();
    results.forEach(r => {
      if (r !== null && r !== undefined) {
        Object.keys(r).forEach(k => keySet.add(k));
      }
    });
    const keys = Array.from(keySet);
    return keys;
  }, [results]);

  const showableMap =
    memoizedKeys.includes("coordinates") ||
    memoizedKeys.includes("coordinate") ||
    memoizedKeys.includes("geometry");

  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const filename = (label || "Result List").replace(/\s/g, "_") + ".csv";

  if (!Array.isArray(results)) {
    return (
      <div>
        <ErrorBoundary>
          <pre>
            <AsPrimitive value={results}></AsPrimitive>
          </pre>
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div style={{ width: "80%", maxWidth: "80%" }}>
      <Tabs
        value={selectedTab}
        onChange={handleChange}
        aria-label="simple tabs example"
      >
        <Tab label="Table" value={1} />
        <Tab label="Map" value={2} />
        <Tab label="Stats" value={3} />
      </Tabs>
      {selectedTab == 3 && (
        <Stats columns={memoizedKeys} data={results} />
      )}
      {selectedTab == 2 && (
        <OrgunitMap
          lines={results}
          position={position}
          showableMap={showableMap}
          showLayers={true}
        />
      )}
      {selectedTab == 1 && (
        <MUIDataTable
          title={label || "Result List"}
          data={results}
          columns={memoizedKeys.map(k => {
            return {
              name: k,
              options: {
                filter: true,
                customBodyRender: value => <AsPrimitive value={value} />
              }
            };
          })}
          options={{
            filterType: "dropdown",
            print: false,
            responsive: "scrollFullHeight",
            selectableRows: "none",
            downloadOptions: {
              filename: filename,
              separator: ","
            },
            rowsPerPageOptions: [1, 20, 50, 100, 1000]
          }}
        />
      )}
    </div>
  );
}
