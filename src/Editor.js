import { Results } from "./Results";
import MarkdownPreview from "./MarkdownPreview";
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
    recipe.params ? JSON.stringify(recipe.params, null, 4) : []
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
          <h3>Parameter Definitions</h3>
          <TextareaAutosize
            cols={150}
            value={parameterDefinitionsJson}
            onChange={parametersDefinitionsChange}
          ></TextareaAutosize>
          <br></br>
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
      <MarkdownPreview
        text={`

\${toc}

# Hello


## Apex graph

this is an apex graph

\`\`\`apex
{
    "chart": {
      "type": "area",
      "width": "500",
      "height": "400"
    },
    "series": [{
      "name": "sales",
      "data": [30,40,45,50,49,60,70,91,125]
    }],
    "xaxis": {
      "type": "datetime",
      "categories": ["01/01/1991","01/01/1992","01/01/1993","01/01/1994","01/01/1995","01/01/1996","01/01/1997", "01/01/1998","01/01/1999"]
    }
}
\`\`\`

\`\`\`apex
{
  "series": [{ "name": "Series 1", "data": [80, 50, 30, 40, 100, 20] }],
  "chart": { "height": "350", "type": "radar" },
  "title": { "text": "Basic Radar Chart" },
  "xaxis": {
    "categories": ["January", "February", "March", "April", "May", "June"]
  }
}
\`\`\`
## mermaid 

this is an mermaid graph


\`\`\`graph TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[Car]
\`\`\`

## footnotes

Here is a footnote reference,[^1] and another.[^longnote]

[^1]: Here is the footnote.

[^longnote]: Here's one with multiple blocks.

    Subsequent paragraphs are indented to show that they
belong to the previous footnote.

`}
      ></MarkdownPreview>
    </div>
  );
}
export default Editor;
