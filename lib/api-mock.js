const fs = require('fs');

const protagonist = require('protagonist');
const express = require('express');
const walker = require('./walker');
const SslSupport = require('./ssl-support');
const CorsSupport = require('./cors-support');

class ApiMock {
  constructor(config) {
    this.blueprintPath = config['blueprintPath'] || undefined;

    if (this.blueprintPath === undefined) {
      throw(new Error("No blueprint path provided."));
    }

    this.configuration = config;
    this.app = express();


    const sslSupport = this.configuration.options['ssl-enable'] ? new SslSupport(this.app, {
      port: this.configuration.options['ssl-port'],
      host: this.configuration.options['ssl-host'],
      cert: this.configuration.options['ssl-cert'],
      key: this.configuration.options['ssl-key'],
    }) : undefined;

    const corsSupport = !this.configuration.options['cors-disable'] ? new CorsSupport(this.app) : undefined;
  }

  run() {
    const app = this.app;

    let data;
    try {
      data = fs.readFileSync(this.blueprintPath, 'utf8');
    } catch (e) {
      throw(e);
    }

    // Get JSON representation of the blueprint file
    let ast_json = "";
    protagonist.parse(data, {type: "ast"}, (error, result) => {
      if (error) {
        throw(error);
      }
      ast_json = result.ast;

      // Walk AST, add routes to app
      try {
        walker(app, ast_json.resourceGroups);
      } catch (error) {
        throw(error);
      }

      // start server
      try {
        let port = 3000;
        if (this.configuration !== undefined && this.configuration.options !== undefined && this.configuration.port !== undefined) {
          port = this.configuration.options.port;
        }
        app.listen(port);
      } catch (error) {

      }
    });
  }
}

module.exports = ApiMock;
