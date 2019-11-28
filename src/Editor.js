import { Results } from "./Results";
import React, { useState } from "react";
import "./App.css";
import _ from "lodash";
import * as turf from "@turf/turf";
import Fuse from "fuse.js";
import PapaParse from "papaparse";
import XlsxPopulate from "xlsx-populate";
import { asyncForEach } from "./support/asyncForEach";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import AceEditor from "react-ace";
import "brace/mode/javascript";
import "brace/theme/monokai";
import "brace/ext/searchbox";

import DatePeriods from "./support/DatePeriods";

import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import prettier from "prettier/standalone";
import parser from "prettier/parser-babylon";

const position = [-12.9487, 9.0131];
const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;

XlsxPopulate.openAsBlob = (workbook, filename) => {
  workbook.outputAsync({ type: "blob" }).then(function(blob) {
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, filename || "out.xlsx");
    } else {
      var url = window.URL.createObjectURL(blob);
      var a = document.createElement("a");
      document.body.appendChild(a);
      a.href = url;
      a.download = filename || "out.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  });
};

function flattenObject(o, prefix = "", result = {}, keepNull = true) {
  if (
    _.isString(o) ||
    _.isNumber(o) ||
    _.isBoolean(o) ||
    (keepNull && _.isNull(o))
  ) {
    result[prefix] = o;
    return result;
  }

  if (_.isArray(o) || _.isPlainObject(o)) {
    for (let i in o) {
      let pref = prefix;
      if (_.isArray(o)) {
        pref = pref + `[${i}]`;
      } else {
        if (_.isEmpty(prefix)) {
          pref = i;
        } else {
          pref = prefix + "-" + i; // sadly . is not working need to investigate a bit further
        }
      }
      flattenObject(o[i], pref, result, keepNull);
    }
    return result;
  }
  return result;
}

_.flattenObject = flattenObject;

_.flattenObjects = objects => {
  return objects.map(o => _.flattenObject(o));
};

class FetchInterceptor {
  /**
   * Recognize global environment and attach fetch
   */
  constructor() {
    const ENVIRONMENT_IS_REACT_NATIVE =
      typeof navigator === "object" && navigator.product === "ReactNative";
    const ENVIRONMENT_IS_NODE =
      typeof process === "object" && typeof require === "function";
    const ENVIRONMENT_IS_WEB = typeof window === "object";
    const ENVIRONMENT_IS_WORKER = typeof importScripts === "function";

    if (ENVIRONMENT_IS_REACT_NATIVE) {
      this.env = global;
    } else if (ENVIRONMENT_IS_WORKER) {
      this.env = this;
    } else if (ENVIRONMENT_IS_WEB) {
      this.env = window;
    } else if (ENVIRONMENT_IS_NODE) {
      this.env = global;
    } else {
      throw new Error("Unsupported environment for fetch-intercept");
    }

    this.fetch = this.env.fetch;
  }

  /**
   * Whitelist hooks
   */
  static hooks = ["onBeforeRequest", "onRequestSuccess", "onRequestFailure"];

  /**
   * Register intercept hooks & return an interceptor instance
   * @param {object} hooks - The intercept hooks
   * @return {FetchInterceptor} An interceptor object
   */
  static register(hooks = {}) {
    if (this._instance) {
      return this._instance;
    }
    const interceptor = new this();
    for (let i = 0; i < this.hooks.length; i++) {
      const hook = this.hooks[i];
      if (typeof hooks[hook] === "function") {
        interceptor[hook] = hooks[hook];
      }
    }
    interceptor.hijack();
    this._instance = interceptor;

    return interceptor;
  }

  /**
   * Reset fetch and unregister intercept hooks
   */
  unregister() {
    this.env.fetch = this.fetch;
    delete this.constructor._instance;
  }

  /**
   * Hijack global fetch and insert registered hooks if present
   */
  hijack() {
    const controller = new AbortController();
    const signal = controller.signal;
    this.env.fetch = (...a) => {
      let request;
      if (a[0] instanceof Request) {
        let object = {};
        [
          "cache",
          "context",
          "credentials",
          "destination",
          "headers",
          "integrity",
          "method",
          "mode",
          "redirect",
          "referrer",
          "referrerPolicy",
          "url",
          "body",
          "bodyUsed"
        ].forEach(prop => {
          if (prop in a[0]) {
            object[prop] = a[0][prop];
          }
        });
        object.signal = signal;
        const { url, ...options } = object;
        request = new Request(url, options);
      } else {
        const url = a[0];
        const options = {
          ...a[1],
          signal
        };
        request = new Request(url, options);
      }
      if (typeof this.onBeforeRequest === "function") {
        this.onBeforeRequest(request, controller);
      }
      const promise = this.fetch.call(this.env, request);
      if (typeof this.onAfterRequest === "function") {
        this.onAfterRequest(request, controller);
      }
      return promise.then(response => {
        if (response.ok) {
          if (typeof this.onRequestSuccess === "function") {
            this.onRequestSuccess(response, request, controller);
          }
        } else {
          if (typeof this.onRequestFailure === "function") {
            this.onRequestFailure(response, request, controller);
          }
        }
        return response;
      });
    };
  }
}

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

function Editor({ recipe, dhis2, onSave }) {
  const [showEditor, setShowEditor] = useState(recipe.editable);
  const [name, setName] = useState(recipe.name);
  const [code, setCode] = useState(recipe.code);
  const [results, setResults] = useState(undefined);
  const [requests, setRequests] = useState([]);
  setOutRequest = setRequests;
  const [error, setError] = useState("");
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
        body
      )(
        dhis2,
        asyncForEach,
        _,
        turf,
        Fuse,
        PapaParse,
        XlsxPopulate,
        DatePeriods
      );

      setResults(results);
    } catch (e) {
      debugger;
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
      editable: true
    };
    onSave(modifiedRecipe);
  }
  const dirty = recipe.code !== code || name !== recipe.name;
  return (
    <div>
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
      <div style={{ color: "red" }}>{error}</div>
      <br />
      {recipe && showEditor && (
        <AceEditor
          readOnly={recipe && recipe.editable === false}
          name="script"
          fontSize={18}
          width={"80%"}
          height={400}
          mode="javascript"
          theme="monokai"
          value={code}
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
      <Button
        onClick={click => {
          onRun(code);
        }}
        title="ctrl-r to run from the editor"
      >
        Run
      </Button>
      <Button variant="contained" onClick={save} disabled={!dirty}>
        Save
      </Button>{" "}
      <FormControlLabel
        control={<Switch value={showEditor} />}
        label="Hide editor"
        onChange={() => setShowEditor(!showEditor)}
      />
      <span>
        {requests && requests.length > 1 && (
          <>
            <a href={requests[0]} target="_blank" rel="noopener noreferrer">
              {requests[0]}
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
