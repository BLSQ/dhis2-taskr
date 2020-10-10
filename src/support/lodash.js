import _ from "lodash";

function flattenObject(
  o,
  except = [],
  prefix = "",
  result = {},
  keepNull = true
) {
  if (
    _.isString(o) ||
    _.isNumber(o) ||
    _.isBoolean(o) ||
    (keepNull && _.isNull(o))
  ) {
    result[prefix] = o;
    return result;
  }
  if (except.includes(prefix)) {
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
      flattenObject(o[i], except, pref, result, keepNull);
    }
    return result;
  }
  return result;
}

_.flattenObject = flattenObject;

_.flattenObjects = (objects, except) => {
  return objects.map(o => _.flattenObject(o, except));
};

_.copyToClipBoard = (text) => {
  if (navigator.clipboard != undefined) {
    //Chrome
    navigator.clipboard.writeText(text).then(
      () => {},
      (err) => {
        console.error("Async: Could not copy text: ", err);
      }
    );
  } else if (window.clipboardData) {
    // Internet Explorer
    window.clipboardData.setData("Text", text);
  }
};

_.renameColumns = (data, columnMapping) => {
  return data.map(obj =>
    _.mapKeys(obj, (value, key) => columnMapping[key] || key)
  );
};

_.reorderColumns = (data, columns) => {
  return data.map(obj => {
    const clone = {};
    columns.forEach(col => (clone[col] = obj[col]));
    return clone;
  });
};

export default _;
