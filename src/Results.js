import React, { useState, useMemo, Suspense } from "react";
import MUIDataTable from "mui-datatables";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import { AsPrimitive } from "./AsPrimitive";
import ErrorBoundary from "./ErrorBoundary";
import Stats from "./Stats";

const OrgunitMap = React.lazy(() => import("./OrgunitMap"));

export function Results({ results, label, position }) {
  const [selectedTab, setSelectedTab] = useState(1);

  const memoizedKeys = useMemo(() => {
    if (!Array.isArray(results)) {
      return [];
    }
    let resultsSubSet = results;
    if (results.length > 30000) {
      resultsSubSet = results.slice(0, 10000);
    }
    const keySet = new Set();
    resultsSubSet.forEach((r) => {
      if (r !== null && r !== undefined) {
        Object.keys(r).forEach((k) => keySet.add(k));
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
      {selectedTab == 3 && <Stats columns={memoizedKeys} data={results} />}
      {selectedTab == 2 && (
        <Suspense fallback={<h1>Loading profile...</h1>}>
          <OrgunitMap
            lines={results}
            position={position}
            showableMap={showableMap}
            showLayers={true}
          />
        </Suspense>
      )}
      {selectedTab == 1 && (
        <MUIDataTable
          title={label || "Result List"}
          data={results}
          columns={memoizedKeys.map((k) => {
            return {
              name: k,
              options: {
                filter:
                  k == "geometry" || k == "coordinates"
                    ? false
                    : results.length < 30000,
                customBodyRender: (value) => <AsPrimitive value={value} />,
              },
            };
          })}
          options={{
            print: false,
            responsive: "scrollFullHeight",
            selectableRows: "none",
            downloadOptions: {
              filename: filename,
              separator: ",",
            },
            rowsPerPageOptions: [1, 20, 50, 100, 1000],
          }}
        />
      )}
    </div>
  );
}
