import { Results } from "./Results";
import React, { useState } from "react";
import "./App.css";

import _ from "./support/lodash";
import XlsxPopulate from "./support/XlsxPopulateOpenAsBlob";
import * as turf from "@turf/turf";
import Fuse from "fuse.js";
import PapaParse from "papaparse";
import FetchInterceptor from "./support/FetchInterceptor";

import { asyncForEach } from "./support/asyncForEach";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import AceEditor from "react-ace";
import "brace/ext/language_tools";
import "brace/mode/javascript";
import "brace/theme/monokai";
import "brace/ext/searchbox";
import "brace/snippets/javascript";

import Help from "./Help";
import DatePeriods from "./support/DatePeriods";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import prettier from "prettier/standalone";
import parser from "prettier/parser-babylon";

import Params from "./Params";
import { TextareaAutosize } from "@material-ui/core";
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
  }
});

function Editor({ recipe, dhis2, onSave, editable }) {
  const [showEditor, setShowEditor] = useState(recipe.editable);
  const [showParamsEditor, setShowParamsEditor] = useState(false);
  if (showEditor && editable == false) {
    setShowEditor(false);
    setShowParamsEditor(false);
  }
  const [name, setName] = useState(recipe.name);
  const [code, setCode] = useState(recipe.code);
  const [results, setResults] = useState(undefined);
  const [requests, setRequests] = useState([]);
  const [parameters, setParameters] = useState({});
  const [parameterDefinitionsJson, setParameterDefinitionsJson] = useState(
    recipe.params ? JSON.stringify(recipe.params, null, 4) : ""
  );
  const [parameterDefinitions, setParameterDefinitions] = useState(
    recipe.params
  );

  setOutRequest = setRequests;
  const [error, setError] = useState("");
  const parametersDefinitionsChange = e => {
    setParameterDefinitionsJson(e.target.value);
    try {
      setParameterDefinitions(JSON.parse(e.target.value));
    } catch (error) {
      setError(error.message + " " + e.target.value);
    }
  };
  async function onRun(code) {
    setError(undefined);
    setResults(undefined);
    try {
      const prettyCode = prettier.format(code, {
        parser: "babel",
        plugins: [parser]
      });
      setCode(prettyCode);
      const body = prettyCode.includes("return ")
        ? prettyCode
        : "return " + prettyCode;
      const results = await new AsyncFunction(
        "dhis2",
        "asyncForEach",
        "_",
        "turf",
        "Fuse",
        "PapaParse",
        "XlsxPopulate",
        "DatePeriods",
        "parameters",
        body
      )(
        dhis2,
        asyncForEach,
        _,
        turf,
        Fuse,
        PapaParse,
        XlsxPopulate,
        DatePeriods,
        parameters
      );

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

  async function save() {
    const modifiedRecipe = {
      id: recipe.id,
      name: name,
      code: code,
      editable: true,
      params: parameterDefinitions
    };
    onSave(modifiedRecipe);
  }
  const dirty = recipe.code !== code || name !== recipe.name;
  const style = {
    marginLeft: "20px"
  };
  return (
    <div>
      {editable && <Help></Help>}
      {editable && (
        <TextField
          id="standard-name"
          label="Name"
          value={name}
          style={{ width: "400px" }}
          onChange={event => {
            setName(event.target.value);
          }}
          margin="normal"
        />
      )}
      {editable == false && <h2>{recipe.name}</h2>}
      <div style={{ color: "red" }}>{error}</div>
      <br />
      {editable && recipe && showEditor && (
        <AceEditor
          readOnly={recipe && recipe.editable === false}
          name="script"
          fontSize={18}
          width={"80%"}
          height={400}
          mode="javascript"
          theme="monokai"
          value={code}
          debounceChangePeriod={3}
          enableBasicAutocompletion={true}
          enableSnippets={true}
          onChange={val => {
            setCode(val);
          }}
          commands={[
            {
              name: "Run",
              bindKey: { win: "Ctrl-r", mac: "Command-r" },
              exec: editor => {
                onRun(editor.getValue());
              }
            }
          ]}
        />
      )}
      {editable && recipe && showParamsEditor && showEditor && (
        <>
          <h2>Parameter Definitions</h2>
          <TextareaAutosize
            cols={150}
            value={parameterDefinitionsJson}
            onChange={parametersDefinitionsChange}
          ></TextareaAutosize>
          <br></br>
        </>
      )}
      {parameterDefinitions !== undefined && parameterDefinitions !== {} && (
        <>
          <Params
            params={parameterDefinitions}
            onParametersChange={setParameters}
          ></Params>
          <br></br>
        </>
      )}
      <Button
        onClick={click => {
          onRun(code);
        }}
        title="ctrl-r to run from the editor"
        style={style}
      >
        <PlayArrowIcon />
        Run
      </Button>

      {editable && (
        <>
          <Button
            style={style}
            onClick={click => {
              setResults("");
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
          />{" "}
          <FormControlLabel
            control={<Switch value={showParamsEditor} />}
            label="Hide params editor"
            onChange={() => setShowParamsEditor(!showParamsEditor)}
          />{" "}
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

      <br />
      <br />
      <Results results={results} label={name || ""} position={position} />
    </div>
  );
}
export default Editor;
