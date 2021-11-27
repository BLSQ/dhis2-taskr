import React from "react";

import {
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
} from "@material-ui/core";
import MUIDataTable from "mui-datatables";
import _ from "./support/lodash";
import { AsPrimitive } from "./AsPrimitive";

const dateFormat = /^(\d{4})-(\d{2})-(\d{2}).*$/;

const isObject = (o) => typeof o === "object" && o !== null;

const toKeyAndValue = (record, column) => {
    
        let value = record[column];
        if (
          column == "coordinates" ||
          column == "geometry" ||
          Array.isArray(value)
        ) {
          return "not supported for stats";
        }
        if (isObject(value) && value.id) {
          return [value.id, value];
        }
        if (typeof value === "string" && dateFormat.test(value)) {
          return value.slice(0, 10);
        }
        return value;
      
}

const toColumnStats = (column, data) =>  {
  let counts = {}
  for(let record of data) {
     const keyAndValue = toKeyAndValue(record, column)
     let key, value 
     if (Array.isArray(keyAndValue)) {
        key = keyAndValue[0];
        value= keyAndValue[1]
     } else {
         key = keyAndValue
         value = keyAndValue
     }
     if (counts[key] == undefined) {
        counts[key] = {value: value, count: 0}   
     }
     counts[key].count = counts[key].count + 1
  }
  let total = data.length;
  let stats = Object.values(counts).map((r) => {
    return {
      value: r.value,
      count: r.count,
      percentage: total != 0 ? parseFloat((r.count / total * 100).toFixed(2)) : undefined,
    };
  });

  stats = _.orderBy(stats, ["count"], ["desc"]);
  return stats;
};

const Stats = ({ columns, data }) => {
  const [selectedColumns, setSelectedColumns] = React.useState([columns[0]]);

  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedColumns(
      // On autofill we get a the stringified value.
      typeof value === "string" ? value.split(",") : value
    );
  };

  return (
    <div>
      <InputLabel id="demo-multiple-name-label">Columns</InputLabel>
      <Select
        multiple
        value={selectedColumns}
        onChange={handleChange}
        input={<OutlinedInput label="Column" />}
      >
        {columns.map((column) => (
          <MenuItem key={column} value={column}>
            {column}
          </MenuItem>
        ))}
      </Select>
      <br />

      <div
        style={{
          display: "flex",
          alignItems: "strech",
          flexWrap: "wrap",
          justifyContent: "flex-start",
        }}
      >
        {selectedColumns.map((selectedColumn) => (
          <div style={{ margin: "3px" }} key={selectedColumn}>
            <MUIDataTable
              data={toColumnStats(selectedColumn, data)}
              columns={[
                {
                  name: "value",
                  options: {
                    filter: true,
                    customBodyRender: (value) => <AsPrimitive value={value} />,
                  },
                },
                {
                  name: "count",
                  options: {
                    filter: true,
                    customBodyRender: (value) => <AsPrimitive value={value} />,
                  },
                },
                {
                    name: "percentage"
                }
              ]}
              title={`Stats for ${selectedColumn}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
export default Stats;
