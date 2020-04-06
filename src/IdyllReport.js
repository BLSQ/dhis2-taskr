import React, { useEffect } from "react";
import MUIDataTable from "mui-datatables";
import IdyllDocument from "idyll-document";
import { mapChildren } from "idyll-component-children";
import * as components from "idyll-components";
import IdyllVegaLite from "idyll-vega-lite";
import { AsPrimitive } from "./AsPrimitive";
import OrgunitBasicMap from "./OrgunitMap";
import ErrorBoundary from "./ErrorBoundary";
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";

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

const PageOrientation = (props) => (
  <React.Fragment>
    {props.orientation === "landscape" && <LandscapeOrientation />}
    {props.orientation === "portrait" && <PortraitOrientation />}
  </React.Fragment>
);

const PageBreak = (props) => <div className="pagebreak"> </div>;

const AsJSON = (props) => {
  const { idyll, hasError, updateProps, data, ...otherProps } = props;

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

const FlexBox = (props) => {
  const { idyll, hasError, updateProps, data, ...otherProps } = props;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-evenly",
        alignItems: "flex-end",
      }}
    >
      {props.children.map((item) => (
        <div style={{ padding: "10px" }}>{item}</div>
      ))}
    </div>
  );
};

const OrgunitMap = (props) => {
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
  results.forEach((r) => {
    if (r !== null && r !== undefined) {
      Object.keys(r).forEach((k) => keySet.add(k));
    }
  });
  const keys = Array.from(keySet);
  const filename = (label || "Result List").replace(/\s/g, "_") + ".csv";
  const getMuiTheme = () =>
    createMuiTheme({
      overrides: {
        MUIDataTable: {
          paper: {
            marginRight: "50px",
          },
        },
      },
    });
  return (
    <MuiThemeProvider theme={getMuiTheme()}>
      <MUIDataTable
        title={label || "Result List"}
        data={results}
        columns={keys.map((k) => {
          return {
            name: k,
            options: {
              filter: true,
              customBodyRender: (value) => <AsPrimitive value={value} />,
            },
          };
        })}
        options={{
          filterType: "dropdown",
          print: false,
          responsive: "scrollFullHeight",
          selectableRows: "none",
          downloadOptions: {
            filename: filename,
            separator: ",",
          },
          rowsPerPageOptions: [1, 10, 20, 50, 100, 1000],
          rowsPerPage: perPage || 20,
        }}
      />
    </MuiThemeProvider>
  );
};

class MyLoop extends React.Component {
  render() {
    const { children, value } = this.props;

    if (children && value) {
      return value.map((val) => {
        return mapChildren(children, (child) => {
          if (typeof child !== "object") {
            return child;
          }
          let newProps = Object.assign({}, child.props);
          newProps = Object.keys(child.props).reduce((props, elm) => {
            props["iitem"] = val;
            return props;
          }, newProps);
          return React.cloneElement(child, { ...newProps });
        });
      });
    }
    return null;
  }
}

const Dhis2Item = (props) => {
  const item = props.iitem;
  const propName =
    item && item.type
      ? item.type == "REPORT_TABLE"
        ? "reportTable"
        : item.type.toLowerCase()
      : "";

  const itemName = item && item[propName] ? item[propName].name : "";
  const [html, setHtml] = React.useState("");
  const [imgUrl, setImgUrl] = React.useState("");

  useEffect(() => {
    if (propName !== "") {
      const prefixUrl = props.prefixUrl || "../../";
      let resourceName = undefined;
      if (propName == "reportTable") {
        resourceName = "reportTables";
      } else {
        resourceName = propName.toLowerCase() + "s";
      }

      const url = prefixUrl + resourceName + "/" + item[propName].id + "/data";
      const fetchData = async () => {
        const result = await fetch(url + ".html+css").then((r) => r.text());
        setHtml(result);
      };
      if (propName !== "reportTable") {
        setHtml("");
        setImgUrl(url + ".png");
      } else {
        fetchData();
      }
    }
  }, [setHtml]);

  if (item == undefined) {
    return <p>hello</p>;
  }
  if (propName === "reportTable") {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  } else {
    return <img src={imgUrl} alt={itemName}></img>;
  }
};

const availableComponents = {
  ...components,
  IdyllVegaLite: IdyllVegaLite,
  AsJSON: AsJSON,
  OrgunitMap: OrgunitMap,
  FlexBox: FlexBox,
  DataTable: DataTable,
  PageOrientation: PageOrientation,
  PageBreak: PageBreak,
  MyLoop: MyLoop,
  Dhis2Item: Dhis2Item,
};

const IdyllReport = ({ markup, dataSets }) => {
  const initialState = {
    ...dataSets.asVars(),
  };

  return (
    <ErrorBoundary>
      <IdyllDocument
        key={dataSets.registeredCount}
        theme="github"
        markup={markup}
        components={availableComponents}
        initialState={initialState}
      />
    </ErrorBoundary>
  );
};

export default IdyllReport;
