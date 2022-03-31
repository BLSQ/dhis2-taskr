import { Results } from "./Results";
import React, { useState, useEffect, Suspense } from "react";
import "./App.css";
import JSONApi from "./support/JSONApi";

import XlsxPopulate from "./support/XlsxPopulateOpenAsBlob";

import FetchInterceptor from "./support/FetchInterceptor";

import { asyncForEach } from "./support/asyncForEach";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/ext-searchbox";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/snippets/javascript";
import { Ace } from "ace-builds";

import Help from "./Help";
import DatePeriods from "./support/DatePeriods";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import prettier from "prettier/standalone";
import parser from "prettier/parser-babylon";

import Params from "./Params";

import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";

import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";

import DeleteButton from "./DeleteButton";

const IdyllReport = React.lazy(() => import("./IdyllReport"));

const position = [-12.9487, 9.0131];
const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;

let setOutRequest = undefined;
const interceptor = FetchInterceptor.register({
  onBeforeRequest(request, controller) {
    if (setOutRequest) {
      setOutRequest([request.url, request.method, "running"]);
    }
  },
  onRequestSuccess(response, request, controller) {
    if (setOutRequest) {
      setOutRequest([request.url, request.method, "success", response.status]);
    }
  },
  onRequestFailure(response, request, controller) {
    if (setOutRequest) {
      setOutRequest([request.url, request.method, "failed", response.status]);
    }
  },
});

const markup = ``;

class DataSets {
  constructor() {
    this.registeredCount = 0;
    this.datasets = {};
  }
  register(datasetName, data) {
    this.datasets[datasetName] = data;
    this.registeredCount += 1;
    return this;
  }
  reset(mode) {
    for (var member in this.datasets) {
      delete this.datasets[member];
    }
    this.registeredCount = 0;
    if (mode == "run" && this.reRun) {
      this.reRun();
    }
    if (mode == "clear" && this.clearResults) {
      this.clearResults();
    }
  }

  asVars() {
    return this.datasets;
  }
}

function Editor({ recipe, dhis2, onSave, editable, autorun }) {
  const [showEditor, setShowEditor] = useState(recipe.editable);
  const [dataSets, setDataSets] = useState(new DataSets());
  if (showEditor && editable == false) {
    setShowEditor(false);
  }
  const [height, setHeight] = useState(400);
  const [width, setWidth] = useState("80%");
  const [autorunStarted, setAutorunStarted] = useState(false);
  const [propertyEdited, setPropertyEdited] = useState("code");
  const [name, setName] = useState(recipe.name);
  const [code, setCode] = useState(recipe.code);
  const [report, setReport] = useState(recipe.report || markup);
  const [results, setResults] = useState(undefined);
  const [requests, setRequests] = useState([]);
  const [parameters, setParameters] = useState({});
  const [parameterDefinitionsJson, setParameterDefinitionsJson] = useState(
    recipe.params ? JSON.stringify(recipe.params, null, 4) : "[]"
  );
  const [parameterDefinitions, setParameterDefinitions] = useState(
    recipe.params
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  setOutRequest = setRequests;
  const [error, setError] = useState("");
  const parametersDefinitionsChange = (value) => {
    setParameterDefinitionsJson(value);
    try {
      setParameterDefinitions(JSON.parse(value));
    } catch (error) {
      setError(error.message + " " + value);
    }
  };
  async function onRun(code) {
    setError(undefined);
    setResults(undefined);
    try {
      const prettyCode = prettier.format(code, {
        parser: "babel",
        plugins: [parser],
      });
      setCode(prettyCode);
      const body = prettyCode.includes("return ")
        ? prettyCode
        : "return " + prettyCode;
      const libs = [
        { identifier: "dhis2", entryPoint: async () => dhis2 },
        { identifier: "asyncForEach", entryPoint: async () => asyncForEach },
        {
          identifier: "_",
          entryPoint: async () => {
            const lodash = await import("./support/lodash");
            return lodash.default;
          },
        },
        {
          identifier: "turf",
          entryPoint: async () => {
            const turf = await import("./support/turf");
            return turf.default;
          },
        },
        {
          identifier: "Fuse",
          entryPoint: async () => {
            const Fuse = await import("fuse.js");
            return Fuse.default;
          },
        },
        {
          identifier: "PapaParse",
          entryPoint: async () => import("papaparse"),
        },
        { identifier: "XlsxPopulate", entryPoint: async () => XlsxPopulate },
        { identifier: "DatePeriods", entryPoint: async () => DatePeriods },
        { identifier: "parameters", entryPoint: async () => parameters },
        { identifier: "report", entryPoint: async () => dataSets },
        { identifier: "JSONApi", entryPoint: async () => JSONApi },
      ];
      const entryPoints = [];
      for (let entryPoint of libs.map((l) => l.entryPoint)) {
        entryPoints.push(await entryPoint());
      }

      const results = await new AsyncFunction(
        ...libs.map((l) => l.identifier),
        body
      )(...entryPoints);

      setResults(results);
    } catch (e) {
      setResults(undefined);
      setError(
        e.message +
          ": line" +
          (e.lineNumber - 3) +
          (e.columnNumber ? ":" + e.columnNumber : "")
      );
    }
  }

  const reRun = () => {
    onRun(code);
  };
  const clear = () => {
    setResults("");
    setDataSets(new DataSets());
  };

  useEffect(() => {
    dataSets.reRun = reRun;
    dataSets.clearResults = clear;
    if (autorun && autorunStarted === false) {
      onRun(code);
      setAutorunStarted(true);
    }
  }, [autorun, code, onRun, autorunStarted, setAutorunStarted, reRun]);

  async function save() {
    const modifiedRecipe = {
      id: recipe.id,
      name: name,
      code: code,
      editable: true,
      params: parameterDefinitions,
      report: report,
    };
    onSave(modifiedRecipe);
  }
  const dirty = recipe.code !== code || name !== recipe.name;
  const style = {
    marginLeft: "20px",
  };
  let editableContent = code;
  if (propertyEdited == "code") {
    editableContent = code;
  } else if (propertyEdited == "parameters") {
    editableContent = parameterDefinitionsJson || "";
  } else if (propertyEdited == "report") {
    editableContent = report;
  }
  const editablePropertySelected = (event, val) => {
    setPropertyEdited(val.props.value);
  };

  const deleteButtonStyle = {
    marginLeft: "40rem"
  }

  return (
    <div>
      <div className="no-print">
        {editable && <Help></Help>}
        {editable && (
          <TextField
            id="standard-name"
            label="Name"
            value={name}
            style={{ width: "400px" }}
            onChange={(event) => {
              setName(event.target.value);
            }}
            margin="normal"
          />
        )}
        {editable == false && <h2>{recipe.name}</h2>}
        <div style={{ color: "red" }}>{error}</div>
        <br />

        {editable && recipe && showEditor && (
          <>
            <FormControl>
              <InputLabel>Edit</InputLabel>
              <Select
                onChange={editablePropertySelected}
                value={propertyEdited}
              >
                {["code", "parameters", "report"].map((m) => (
                  <MenuItem value={m}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <AceEditor
              readOnly={recipe && recipe.editable === false}
              name="script"
              fontSize={18}
              width={width}
              height={height}
              mode="javascript"
              theme="monokai"
              value={editableContent}
              debounceChangePeriod={3}
              enableBasicAutocompletion={true}
              enableSnippets={true}
              onChange={(val) => {
                if (propertyEdited == "code") {
                  setCode(val);
                } else if (propertyEdited == "parameters") {
                  parametersDefinitionsChange(val);
                } else if (propertyEdited == "report") {
                  setReport(val);
                }
              }}
              commands={[
                {
                  name: "Run",
                  bindKey: { win: "Ctrl-r", mac: "Command-r" },
                  exec: (editor) => {
                    onRun(editor.getValue());
                  },
                },
                {
                  name: "Toggle Fullscreen",
                  bindKey: "F11",
                  exec: (editor) => {
                    const fullScreen = document.body.classList.contains(
                      "fullScreen"
                    );
                    document.body.classList.toggle("fullScreen");
                    editor.container.classList.toggle("fullScreen");
                    editor.setAutoScrollEditorIntoView(!fullScreen);
                    if (!fullScreen) {
                      setHeight("100vh");
                      setWidth("100%");
                    } else {
                      setHeight(400);
                      setWidth("80%");
                    }
                    editor.resize();
                  },
                },
              ]}
            />
          </>
        )}

        {parameterDefinitions !== undefined &&
          parameterDefinitions !== [] &&
          parameterDefinitions !== {} && (
            <>
              <Params
                params={parameterDefinitions}
                onParametersChange={setParameters}
                dhis2={dhis2}
              ></Params>
              <br></br>
            </>
          )}
        <Button
          onClick={(click) => {
            onRun(code);
          }}
          title="ctrl-r to run from the editor"
          style={style}
        >
          <PlayArrowIcon />
          Run
        </Button>

        <Button onClick={() => window.print()}>Print</Button>

        {editable && (
          <>
            <Button
              style={style}
              onClick={(click) => {
                clear();
              }}
            >
              Clear
            </Button>
            <Button
              style={style}
              variant="contained"
              onClick={save}
              disabled={!dirty}
            >
              Save
            </Button>{" "}
            <FormControlLabel
              control={<Switch value={showEditor} />}
              label="Hide editor"
              onChange={() => setShowEditor(!showEditor)}
            />
          </>
        )}

        <span>
          {requests && requests.length > 1 && (
            <>
              <a href={requests[0]} target="_blank" rel="noopener noreferrer">
                {decodeURIComponent(requests[0])}
              </a>
              {"     "}
              {requests.slice(1).join(" | ")}
            </>
          )}
        </span>

        <DeleteButton
          dhis2={dhis2}
          recipe={recipe}
          children="Delete"
          message="Are you sure that you want to delete this recipe? A JSON file will be automatically downloaded as a back-up."
          deleteButtonStyle={deleteButtonStyle}
        /> 
      </div>
      <br />
      <br />
      <Results
        key={name || ""}
        results={results}
        label={name || ""}
        position={position}
      />

      {report != undefined && report.trim() !== "" && (
        <Suspense fallback={<div>Loading...</div>}>
          <IdyllReport
            key={dataSets.registeredCount}
            markup={report}
            dataSets={dataSets}
          ></IdyllReport>
        </Suspense>
      )}
    </div>
  );
}
export default Editor;
