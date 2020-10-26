const JSONAPIDeserializer = require("jsonapi-serializer").Deserializer;

class JSONApi {
  static deserialize(payload, options = {}) {
    return new JSONAPIDeserializer({
      keyForAttribute: "camelCase",
      ...options,
    }).deserialize(payload);
  }
}

export default JSONApi