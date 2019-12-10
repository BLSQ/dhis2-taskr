import React, { useState, useEffect } from "react";

import TextField from "@material-ui/core/TextField";

import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import XlsxPopulate from "./support/XlsxPopulateOpenAsBlob";
import PapaParse from "papaparse";
import InputLabel from "@material-ui/core/InputLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import FormControl from "@material-ui/core/FormControl";

const Params = props => {
  const defaultValues = {};
  props.params.forEach(
    param => (defaultValues[param["id"]] = param["default"])
  );
  useEffect(() => {
    props.onParametersChange(defaultValues);
  }, []);

  const [parameters, setParameters] = useState(defaultValues);
  const onChange = e => {
    const { name, value } = e.target;
    const newParameters = { ...parameters, [name]: value };
    setParameters(newParameters);
    props.onParametersChange(newParameters);
  };

  function parseExcelFile(inputElement) {
    const elementName = inputElement.target.name;
    const files = inputElement.target.files || [];
    if (!files.length) return;
    const file = files[0];
    XlsxPopulate.fromDataAsync(file).then(function(workbook) {
      const newParameters = {
        ...parameters,
        [elementName]: workbook
      };
      setParameters(newParameters);
      props.onParametersChange(newParameters);
    });
  }

  function parserCsv(evt) {
    const files = evt.target.files || [];
    if (!files.length) return;
    var file = evt.target.files[0];
    const elementName = evt.target.name;
    PapaParse.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: function(data) {
        const newParameters = {
          ...parameters,
          [elementName]: data
        };
        setParameters(newParameters);
        props.onParametersChange(newParameters);
      }
    });
  }
  const style = { margin: "10px" };
  return (
    <>
      <h2>Parameters</h2>
      {props.params.map(param => {
        const k = param.id;
        const v = param;
        return (
          <div>
            {v.type == "select" && (
              <FormControl>
                <InputLabel style={{ marginLeft: "10px" }}>{k}</InputLabel>
                <Select
                  name={k}
                  value={parameters[k]}
                  onChange={onChange}
                  style={style}
                >
                  {v.choices.map(([val, label]) => (
                    <MenuItem key={val} value={val}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {v.type == "text" && (
              <TextField
                width={200}
                name={k}
                label={v.label || k}
                value={parameters[k]}
                onChange={onChange}
                style={style}
              />
            )}
            {v.type == "xlsx" && (
              <input
                type="file"
                name={k}
                onChange={parseExcelFile}
                accept=".xlsx"
                style={style}
              ></input>
            )}
            {v.type == "csv" && (
              <input
                type="file"
                name={k}
                onChange={parserCsv}
                accept=".csv"
                style={style}
              ></input>
            )}
            <br></br>
          </div>
        );
      })}
    </>
  );
};

export default Params;
