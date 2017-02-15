const inheritHeaders = require('./inherit-headers');

// Transforms API Blueprint example to an array of Expected
// HTTP Request and Response body and headers
const exampleToHttpPayloadPair = (example, inheritingHeaders = {}) => {
  const result = {
    warnings: [],
    errors: [],
    pair: {},
  };

  const request = {};
  const responses = {};

  if (example.requests.length > 1) {
    const text = "Multiple requests, using first.";
    result.warnings.push(text);
  }

  if (example.responses.length === 0) {
    const text = "No response available. Can't create HTTP transaction.";
    result.warnings.push(text);
  } else {
    let selectedRequest = example.requests[0];

    if (example.requests.length === 0) {
      selectedRequest = {
        body: "",
        headers: {},
      };
    }

    request.body = selectedRequest.body;
    request.headers = inheritHeaders(selectedRequest.headers, inheritingHeaders);

    for (let selectedResponse of example.responses) {
      const response = {};

      response.body = selectedResponse.body;
      response.headers = inheritHeaders(selectedResponse.headers, inheritingHeaders);
      response.status = selectedResponse.name;
      if (selectedResponse.schema !== "") {
        response.schema = selectedResponse.schema;
      }

      responses[response.status] = response;
    }

    result.pair.request = request;
    result.pair.responses = responses;
  }

  return result;
};

module.exports = exampleToHttpPayloadPair;
