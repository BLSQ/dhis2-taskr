import React, { useState } from "react";
import MUIDataTable from "mui-datatables";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import OrgunitMap from "./OrgunitMap";
import { AsPrimitive } from "./AsPrimitive";
import ErrorBoundary from "./ErrorBoundary";


export function Results({ results, label, position }) {
  const [selectedTab, setSelectedTab] = useState(1);
  if (Array.isArray(results)) {
    const keySet = new Set();
    results.forEach(r => {
      if (r !== null && r !== undefined) {
        Object.keys(r).forEach(k => keySet.add(k));
      }
    });
    const keys = Array.from(keySet);

    const showableMap =
      keys.includes("coordinates") ||
      keys.includes("coordinate") ||
      keys.includes("geometry");

    const handleChange = (event, newValue) => {
      setSelectedTab(newValue);
    };

    const filename = (label || "Result List").replace(/\s/g, "_") + ".csv";
    return (
      <div style={{ width: "95%" }}>
        <Tabs
          value={selectedTab}
          onChange={handleChange}
          aria-label="simple tabs example"
        >
          <Tab label="Table" value={1} />
          <Tab label="Map" value={2} />
        </Tabs>
        {selectedTab == 2 && (
          <OrgunitMap
            lines={results}
            position={position}
            showableMap={showableMap}
          />
        )}
        {selectedTab == 1 && (
          <MUIDataTable
            title={label || "Result List"}
            data={results}
            columns={keys.map(k => {
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
              rowsPerPageOptions: [1, 20 ,50, 100, 1000]
            }}
          />
        )}
      </div>
    );
  }

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
  return undefined;
}
