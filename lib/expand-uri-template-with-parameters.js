const ut = require('uri-template');

expandUriTemplateWithParameters = (uriTemplate, parameters) => {
  const result = {
    errors: [],
    warnings: [],
    uri: null,
  };

  let parsed;
  try {
    parsed = ut.parse(uriTemplate);
  } catch (e) {
    const text = 'Failed to parse URI template';
    result.errors.push(text);
    return result;
  }

  // get parameters from expression object
  const uriParameters = [];
  for (let expression of parsed.expressions) {
    for (let param of expression.params) {
      uriParameters.push(param.name);
    }
  }

  // check if all parameters have an expression in URI
  for (let parameter of Object.keys(parameters)) {
    if (uriParameters.indexOf(parameter) === -1) {
      const text = `URI template doesn\'t contain expression for parameter '${parameter}'`;
      result.warnings.push(text);
    }
  }

  if (parsed.expressions.length === 0) {
    result.uri = uriTemplate;
  } else {
    let ambigous = false;

    for (let uriParameter of uriParameters) {
      if (Object.keys(parameters).indexOf(uriParameter) === -1) {
        ambigous = true;
        const text = `Ambigous URI template. Parameter not defined:'${uriParameter}'`;
        result.warnings.push(text);
      }
    }

    if (ambigous === false) {
      const toExpand = {};
      for (let uriParameter of uriParameters) {
        const param = parameters[uriParameter];
        if (param.required === true) {
          if (param.example === undefined) {
            ambigous = true;
            const text = `Ambigous URI template. No example value for parameter:'${uriParameter}'`;
            result.warnings.push(text);
          } else {
            toExpand[uriParameter] = param.example;
          }
        } else {
          if (param.example !== undefined) {
            toExpand[uriParameter] = param.example;
          } else if (param.default !== undefined) {
            toExpand[uriParameter] = param.default;
          }
        }
      }
    }

    if (ambigous === false) {
      result.uri = parsed.expand(toExpand);
    }
  }

  return result;
};

module.exports = expandUriTemplateWithParameters;
