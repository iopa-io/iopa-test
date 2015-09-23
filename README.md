# [![IOPA](http://iopa.io/iopa.png)](http://iopa.io)<br> iopa-test 

[![Build Status](https://api.shippable.com/projects/55f9e8d51895ca447415eb6a/badge?branchName=master)](https://app.shippable.com/projects/55f9e8d51895ca447415eb6a) 
[![IOPA](https://img.shields.io/badge/iopa-middleware-99cc33.svg?style=flat-square)](http://iopa.io)
[![limerun](https://img.shields.io/badge/limerun-certified-3399cc.svg?style=flat-square)](https://nodei.co/npm/limerun/)

[![NPM](https://nodei.co/npm/iopa-test.png?downloads=true)](https://nodei.co/npm/iopa-test/)

## About
`iopa-test` is a collection of test harnesses for testing IOPA middleware

## Status

Working release

Includes:

 
### Stub Server (transport server)

  * Creates and receives dummy IOPA Messages per standard IOPA server spec
  * Not for production use, only for testing other modules

    
## Installation

    npm install iopa-test --save-dev

## Usage
``` js

const stubServer = require('iopa-test').stubServer,
 iopa = require('iopa');

var app = new iopa.App();

app.use(function (context, next) {
      context.response["server.RawStream"].end("HELLO WORLD ");
      return next();
  });

var server = stubServer.createServer(app.build())

// SIMULATE INBOUND REQUEST 
server.receive("TEST");

// SIMULATE OUTBOUND REQUEST with MIRRORED RESPONSE 

server.connect("urn://localhost").then(function (client) {
      return client[SERVER.Fetch]("/topic", "GET", function (context) {
          context["server.RawStream"].end("HELLO WORLD ");
      });
  });
 
``` 
       
See [`iopa-logger`](https://nodei.co/npm/iopa-logger/) for a reference implementation of this repository
