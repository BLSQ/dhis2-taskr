import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";

import TextField from "@material-ui/core/TextField";

import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import XlsxPopulate from "./support/XlsxPopulateOpenAsBlob";
import PapaParse from "papaparse";
import InputLabel from "@material-ui/core/InputLabel";
import Typography from "@material-ui/core/Typography";
import FormHelperText from "@material-ui/core/FormHelperText";
import FormControl from "@material-ui/core/FormControl";

import Autocomplete from "@material-ui/lab/Autocomplete";
import LocationOnIcon from "@material-ui/icons/LocationOn";
import Grid from "@material-ui/core/Grid";
import parse from "autosuggest-highlight/parse";
import throttle from "lodash/throttle";

const Dhis2Search = props => {
  const {
    dhis2,
    resourceName,
    style,
    name,
    label,
    onChange,
    filter,
    defaultValue
  } = props;
  const [inputValue, setInputValue] = React.useState(defaultValue);

  const [options, setOptions] = React.useState([]);
  const [selectedOption, setSelectedOption] = React.useState([]);
  const handleChange = event => {
    setInputValue(event.target.value);
  };

  const fetchMemo = React.useMemo(
    () =>
      throttle((input, callback) => {
        dhis2
          .api()
          .then(api => {
            const filters = ["name:ilike:" + input.input];
            if (filter) {
              filters.push(filter);
            }
            return api.get(resourceName, {
              filter: filters,
              fields: "id,name"
            });
          })
          .then(f => {
            setOptions(f[resourceName]);
            return f[resourceName];
          });
      }, 200),
    []
  );
  React.useEffect(() => {
    console.log("defaultValue", defaultValue, inputValue);
    setInputValue(defaultValue);
  }, [setInputValue]);
  React.useEffect(() => {
    let active = true;
    if (inputValue === "") {
      setOptions([]);
      return undefined;
    }

    fetchMemo({ input: inputValue }, results => {
      if (active) {
        setOptions(results || []);
      }
    });

    return () => {
      active = false;
    };
  }, [inputValue, fetchMemo]);

  const onSearchChange = (evt, value) => {
    onChange(name, value, resourceName);
    setSelectedOption(value);
  };

  return (
    <Autocomplete
      style={style}
      getOptionLabel={option =>
        typeof option === "string" ? option : option.name
      }
      filterOptions={x => x}
      options={options}
      onChange={onSearchChange}
      autoComplete
      includeInputInList
      freeSolo
      searchText={defaultValue}
      defaultValue={defaultValue}
      renderInput={params => (
        <TextField
          {...params}
          name={name}
          label={
            label + " " + inputValue ||
            "Search for " + resourceName + " " + inputValue
          }
          fullWidth
          onChange={handleChange}
          value={inputValue}
        />
      )}
      renderOption={option => {
        return <span name={name}>{option.name}</span>;
      }}
    />
  );
};

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

  function parserJson(inputElement) {
    const elementName = inputElement.target.name;
    const files = inputElement.target.files || [];
    var reader = new FileReader();
    if (!files.length) return;
    const file = files[0];
    reader.onload = function(event) {
      var jsonObj = JSON.parse(event.target.result);

      const newParameters = {
        ...parameters,
        [elementName]: jsonObj
      };
      setParameters(newParameters);
      props.onParametersChange(newParameters);
    };

    reader.readAsText(file);
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

  const onSearchChange = (elementName, data) => {
    const newParameters = {
      ...parameters,
      [elementName]: data
    };
    setParameters(newParameters);
    props.onParametersChange(newParameters);
  };

  const style = { marginBottom: "10px", width: 400 };
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
            {v.type == "json" && (
              <>
                <InputLabel style={{ marginLeft: "10px" }}>{label}</InputLabel>
                <input
                  type="file"
                  name={k}
                  onChange={parserJson}
                  accept=".json"
                  style={style}
                ></input>
                <Typography>{v.helperText}</Typography>
              </>
            )}
            {v.type == "dhis2" && (
              <Dhis2Search
                style={style}
                dhis2={props.dhis2}
                resourceName={v.resourceName}
                filter={v.filter}
                defaultValue={v.default}
                name={k}
                label={label}
                onChange={onSearchChange}
              />
            )}

            <br></br>
          </div>
        );
      })}
    </>
  );
};

export default Params;
