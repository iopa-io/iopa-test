/*
 * Copyright (c) 2016 Internet of Protocols Alliance (IOPA)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const iopa = require('iopa-rest'),
  constants = iopa.constants,
  IOPA = constants.IOPA,
  SERVER = constants.SERVER

const iopaStream = require('iopa-common-stream');

var EventEmitter = require('events').EventEmitter;
var util = require('util');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Representes Stub Server
 *
 * @class StubServer
 * @param app  IOPA AppBuilder App
 * @constructor
 * @public
 */
function StubServer(app) {
  _classCallCheck(this, StubServer);

  this._app = app;

  app.createServer = this.createServer_.bind(this, app.createServer || function () { throw new Error("no registered transport provider"); });
}

/**
 * @method listen
 * Create socket and bind to local port to listen for incoming requests
 *
 * @param {Object} Options dictionary that includes port num, address string
 * @returns {Promise} 
 * @public
 */
StubServer.prototype.createServer_ = function StubServer_createServer(next, scheme, options) {
  if (scheme != "stub:")
    return next(scheme, options)

  options = options || {};

  if (!this._app.properties[SERVER.IsBuilt])
    this._app.build();
  var server = {};

  server.listen = this.listen_.bind(this, server);
  server.connect = function (url) {
    return this._app.dispatch(
      this._app.createContext(url,
        {
          "response": true,
          [IOPA.Method]: IOPA.METHODS.connect,
          [SERVER.RawStream]: "NOT USED IN STUB SERVER"
        }
      ));
  }.bind(this);
  server.close = this.close_.bind(this, server);

  server.receive = function (method, url, body) {
    return server.connect("urn://localhost").then(function (client) {
      var context = client.create(url, method);
      return context["iopa.Body"].end(body)
    })
  };

  return server;
};

/**
 * @method listen_
 * Create socket and bind to local port to listen for incoming requests
 *
 * @param {Object} Options dictionary that includes port num, address string
 * @returns {Promise} 
 * @public
 */
StubServer.prototype.listen_ = function StubServer_listen(server, options) {
  options = options || {};

  var port = options.port || options[IOPA.LocalPort] || 0;
  var address = options.address || options[IOPA.LocalAddress] || '0.0.0.0';

  server.port = port;
  server.address = address;

  return new Promise(function (resolve, reject) {
    resolve(server);
  });
};

StubServer.prototype.receiveConnect = function StubServer_receive(connectContext) {
  var context = this._app.Factory.createContext();

  context[IOPA.Method] = connectContext[IOPA.Method]
  context[SERVER.RemoteAddress] = connectContext[SERVER.LocalAddress] || "stubremotehost";
  context[SERVER.RemotePort] = connectContext[SERVER.LocalPort] || connectContext[SERVER.RemotePort];
  context[SERVER.LocalAddress] = connectContext[SERVER.RemoteAddress];
  context[SERVER.LocalPort] = connectContext[SERVER.RemotePort];
  context[SERVER.RawStream] = "NOT USED IN STUBSERVER";
  context[SERVER.IsLocalOrigin] = !connectContext[SERVER.IsLocalOrigin];
  context[SERVER.IsRequest] = connectContext[SERVER.IsRequest];
  context[SERVER.SessionId] = context[SERVER.RemoteAddress] + ':' + context[SERVER.RemotePort];
  context[IOPA.Scheme] = "urn:";
  context[IOPA.MessageId] = context[IOPA.Seq];

  connectContext[SERVER.RawTransport] = { "stub": context };

  context.using(this._app.invoke.bind(this._app));
};

StubServer.prototype.receiveContext = function StubServer_receive(channelContext, remoteContext) {
  var self = this;
  var context = channelContext.create();
  var response = context.addResponse();

  context[SERVER.RemoteAddress] = channelContext[SERVER.RemoteAddress];
  context[SERVER.RemotePort] = channelContext[SERVER.RemotePort]
  context[SERVER.LocalAddress] = channelContext[SERVER.LocalAddress]
  context[SERVER.LocalPort] = channelContext[SERVER.LocalPort]
  context[SERVER.IsLocalOrigin] = !remoteContext[SERVER.IsLocalOrigin];
  context[SERVER.IsRequest] = remoteContext[SERVER.IsRequest];
  context[SERVER.SessionId] = context[SERVER.RemoteAddress] + ':' + context[SERVER.RemotePort];
  context[IOPA.Scheme] = remoteContext[IOPA.Scheme];
  context[IOPA.MessageId] = context[IOPA.Seq];
  context[IOPA.Body] = new iopaStream.IncomingMessageStream();
  var buf = remoteContext[IOPA.Body].toBuffer();
  context[IOPA.Body].append(buf);

  response[SERVER.RemoteAddress] = context[SERVER.RemoteAddress];
  response[SERVER.RemotePort] = context[SERVER.RemotePort];
  response[SERVER.LocalAddress] = context[SERVER.LocalAddress];
  response[SERVER.LocalPort] = context[SERVER.LocalPort];
  response[SERVER.IsLocalOrigin] = !context[SERVER.IsLocalOrigin];
  response[SERVER.IsRequest] = ![SERVER.IsRequest];
  response[IOPA.Scheme] = context[IOPA.Scheme];
  response[IOPA.MessageId] = context[IOPA.MessageId];
  response[IOPA.Body] = new iopaStream.OutgoingMessageStream();
  response[IOPA.Body].on("finish", function () {
    self.receiveContext(remoteContext[SERVER.RawTransport].stub, response);
    context.dispose();
  });
 	response[IOPA.StatusCode] = 200;
  response[IOPA.ReasonPhrase] = "OK";

  if (context[SERVER.IsRequest])
    channelContext[IOPA.Events].emit(IOPA.EVENTS.Request, context)
  else
    channelContext[IOPA.Events].emit(IOPA.EVENTS.Response, context)
};

/**
* Dispatches a Stub Request 
*
* @method dispatch

* @parm {object} options not used
* @parm {string} urlStr url representation of ://127.0.0.1:8200
* @public
* @constructor
*/
StubServer.prototype.dispatch = function StubServer_dispatch(channelContext, next) {

  channelContext.create = this.create.bind(this, channelContext, channelContext.create);
  channelContext[SERVER.LocalAddress] = "stubClient";
  channelContext[SERVER.LocalPort] = 10000;
  var self = this;
  setTimeout(this.receiveConnect.bind(this, channelContext), 0);
  return new Promise(function (resolve, reject) {
    setTimeout(resolve.bind(this, channelContext), 20);
  });

  //ignore next
};


/**
 * Creates a new IOPA Context that is a child request/response of a parent Context
 *
 * @method create
 *
 * @param parentContext IOPA Context for parent
 * @param url string representation of /hello to add to parent url
 * @param options object 
 * @returns context
 * @public
 */
StubServer.prototype.create = function PipelineMatch_create(parentContext, next, url, options) {
  var self = this;

  var context = next(url, options);
  context[SERVER.IsRequest] = true;
  context[IOPA.Method] = "GET";
  context[IOPA.Headers]['Server'] = "io.iopa.stub";
  context[IOPA.Body] = new iopaStream.OutgoingMessageStream();
  context[SERVER.RawTransport] = { "stub": parentContext };

  context[IOPA.Body].on("finish", function () {
    self.receiveContext(parentContext[SERVER.RawTransport].stub, context);
  });

  return context;
}

/**
 * @method close
 * Close the underlying socket and stop listening for data on it.
 * 
 * @returns {Promise()}
 * @public
 */
StubServer.prototype.close_ = function StubServer_close(server) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(null);
    }, 200)
  });
};

module.exports = StubServer;


StubServer.continue = function (channelContext, next) {
  channelContext["iopa.Events"].on("request", function (context) {
    next.invoke(context);
  });

  return new Promise(function (resolve, reject) { });
}