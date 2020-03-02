import React from "react";
import MUIDataTable from "mui-datatables";
import IdyllDocument from "idyll-document";
import * as components from "idyll-components";
import IdyllVegaLite from "idyll-vega-lite";
import { AsPrimitive } from "./AsPrimitive";
import OrgunitBasicMap from "./OrgunitMap";

const LandscapeOrientation = () => (
  <React.Fragment>
    <style type="text/css">
      {
        "@media print{@page {size: A4 landscape}; .reportPage {width: 100%; margin: 0; };"
      }
    </style>
    <style type="text/css">
      {
        "@media screen {  .reportPage {    width: 29.7cm;    margin: auto  } } ;"
      }
    </style>
  </React.Fragment>
);

const PortraitOrientation = () => (
  <React.Fragment>
    <style type="text/css">
      {
        "@media print{@page {size: A4 portrait}; .reportPage {width: 100%; margin: 0; }"
      }
    </style>
    <style type="text/css">
      {"@media screen {  .reportPage {    width: 21cm;    margin: auto  } } "}
    </style>
  </React.Fragment>
);

const PageOrientation = props => (
  <React.Fragment>
    {props.orientation === "landscape" && <LandscapeOrientation />}
    {props.orientation === "portrait" && <PortraitOrientation />}
  </React.Fragment>
);

const PageBreak = props => <div className="pagebreak"> </div>;

const AsJSON = props => {
  const { idyll, hasError, updateProps, data, ...otherProps } = props;

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

const FlexBox = props => {
  const { idyll, hasError, updateProps, data, ...otherProps } = props;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-evenly",
        alignItems: "flex-end"
      }}
    >
      {props.children.map(item => (
        <div style={{ padding: "10px" }}>{item}</div>
      ))}
    </div>
  );
};

const OrgunitMap = props => {
  return (
    <OrgunitBasicMap
      showableMap={true}
      position={[-12.9487, 9.0131]}
      width="500px"
      height="500px"
      {...props}
    />
  );
};

const DataTable = ({ data, label, perPage }) => {
  const results = data || [];
  const keySet = new Set();
  results.forEach(r => {
    if (r !== null && r !== undefined) {
      Object.keys(r).forEach(k => keySet.add(k));
    }
  });
  const keys = Array.from(keySet);
  const filename = (label || "Result List").replace(/\s/g, "_") + ".csv";
  return (
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
        rowsPerPageOptions: [1, 10, 20, 50, 100, 1000],
        rowsPerPage: perPage || 20
      }}
    />
  );
};
const availableComponents = {
  ...components,
  IdyllVegaLite: IdyllVegaLite,
  AsJSON: AsJSON,
  OrgunitMap: OrgunitMap,
  FlexBox: FlexBox,
  DataTable: DataTable,
  PageOrientation: PageOrientation,
  PageBreak: PageBreak
};

const IdyllReport = ({ markup, dataSets }) => {
  const initialState = {
    ...dataSets.asVars()
  };

  return (
    <IdyllDocument
      key={dataSets.registeredCount}
      theme="github"
      markup={markup}
      components={availableComponents}
      initialState={initialState}
    />
  );
};

export default IdyllReport;
