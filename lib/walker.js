const inheritHeaders = require('./inherit-headers');
const inheritParameters = require('./inherit-parameters');
const expandUriTemplateWithParameters = require('./expand-uri-template-with-parameters');
const exampleToHttpPayloadPair = require('./example-to-http-payload-pair');

const ut = require('uri-template');
const winston = require('winston');

const walker = (app, resourceGroups) => {
  const sendResponse = (responses) => {
    return (req, res) => {
      // default response
      let response = responses[Object.keys(responses)[0]];

      // try to find matching response based on PREFER header
      if ('prefer' in req.headers) {
        if (req.headers.prefer in responses) {
          response = responses[req.headers.prefer];
        } else {
          winston.warn(`[${req.url}] Preferrered response ${req.headers.prefer} not found. Falling back to ${response.status}`);
        }
      }

      for (let header of response.headers) {
        res.setHeader(header.name, header.value);
      }
      res.setHeader('Content-Length', Buffer.byteLength(response.body));
      res.status(response.status).send(response.body);
    };
  };

  const responses = [];

  for (let group of resourceGroups) {
    for (let resource of group.resources) {
      for (let action  of resource.actions) {
        // headers and parameters can be specified higher up in the ast and inherited
        action.headers = inheritHeaders(action.headers, resource.headers);
        action.parameters = inheritParameters(action.parameters, resource.parameters);

        if (resource.uriTemplate) {
          // removes query parameters, and converts uri template params into what express expects
          // e.g. /templates/{templateId}/?status=good would become /templates/:templateId/
          // TODO: replate with uri template processing
          const path = resource.uriTemplate.split('{?')[0].replace(new RegExp("}", "g"), "").replace(new RegExp("{", "g"), ":");

          // the routes are generated
          for (let example of action.examples) {
            const payload = exampleToHttpPayloadPair(example, action.headers);

            for (let warning of payload.warnings) {
              winston.warn(`[${path}] ${warning}`);
            }

            for (let error of payload.errors) {
              winston.error(`[${path}] ${error}`);
            }

            responses.push({
              method: action.method,
              path: path,
              responses: payload.pair.responses,
            });
          }
        }
      }
    }
  }

  // sort routes
  responses.sort((a, b) => {
    if (a.path > b.path) {
      return -1;
    }
    if (a.path < b.path) {
      return 1;
    }
    return 0;
  });

  for (let response of responses) {
    switch (response.method) {
      case 'GET':
        app.get(response.path, sendResponse(response.responses));
        break;
      case 'POST':
        app.post(response.path, sendResponse(response.responses));
        break;
      case 'PUT':
        app.put(response.path, sendResponse(response.responses));
        break;
      case 'DELETE':
        app.delete(response.path, sendResponse(response.responses));
        break;
      case 'PATCH':
        app.patch(response.path, sendResponse(response.responses));
        break;
    }
  }
};

module.exports = walker;
