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

export default _;
