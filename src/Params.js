import React, { useState, useEffect } from "react";

import TextField from "@material-ui/core/TextField";

import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import XlsxPopulate from "./support/XlsxPopulateOpenAsBlob";
import PapaParse from "papaparse";
import InputLabel from "@material-ui/core/InputLabel";
import Typography from "@material-ui/core/Typography";
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
      <h3>Parameters</h3>
      {props.params.map(param => {
        const k = param.id;
        const v = param;
        const label = param.label || k;
        return (
          <div>
            {v.type == "select" && (
              <FormControl>
                <InputLabel style={{ marginLeft: "10px" }}>{label}</InputLabel>
                <Select
                  name={k}
                  value={parameters[k]}
                  onChange={onChange}
                  style={style}
                  helperText={v.helperText}
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
                label={label}
                value={parameters[k]}
                onChange={onChange}
                style={style}
                helperText={v.helperText}
              />
            )}
            {v.type == "xlsx" && (
              <>
                <InputLabel style={{ marginLeft: "10px" }}>{label}</InputLabel>
                <input
                  type="file"
                  name={k}
                  onChange={parseExcelFile}
                  accept=".xlsx"
                  style={style}
                  helperText={v.helperText}
                ></input>
                <p>{v.helperText}</p>
              </>
            )}
            {v.type == "csv" && (
              <>
                <InputLabel style={{ marginLeft: "10px" }}>{label}</InputLabel>
                <input
                  type="file"
                  name={k}
                  onChange={parserCsv}
                  accept=".csv"
                  style={style}
                ></input>
                <Typography>{v.helperText}</Typography>
              </>
            )}
            <br></br>
          </div>
        );
      })}
    </>
  );
};

export default Params;
