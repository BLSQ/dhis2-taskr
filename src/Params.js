import React, { useState, useEffect } from "react";

import TextField from "@material-ui/core/TextField";

import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import XlsxPopulate from "./support/XlsxPopulateOpenAsBlob";
import PapaParse from "papaparse";

const Params = props => {
  const defaultValues = {};
  Object.entries(props.params).forEach(
    ([k, v]) => (defaultValues[k] = v["default"])
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

  return (
    <>
      <h2>Parameters</h2>
      {Object.entries(props.params).map(([k, v]) => {
        return (
          <div>
            {v.type == "select" && (
              <Select name={k} value={parameters[k]} onChange={onChange}>
                {v.choices.map(([val, label]) => (
                  <MenuItem key={val} value={val}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            )}
            {v.type == "text" && (
              <TextField
                width={200}
                name={k}
                label={v.label || k}
                value={parameters[k]}
                onChange={onChange}
              />
            )}
            {v.type == "xlsx" && (
              <input
                type="file"
                name={k}
                onChange={parseExcelFile}
                accept=".xlsx"
              ></input>
            )}
            {v.type == "csv" && (
              <input
                type="file"
                name={k}
                onChange={parserCsv}
                accept=".csv"
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
