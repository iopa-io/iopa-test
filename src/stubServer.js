/*
 * Copyright (c) 2015 Internet of Protocols Alliance (IOPA)
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

const iopa = require('iopa'),
     iopaStream = require('iopa-common-stream');
   
const  constants = iopa.constants,
  IOPA = constants.IOPA,
  SERVER = constants.SERVER

var EventEmitter = require('events').EventEmitter;
var util = require('util');

/* *********************************************************
 * IOPA STUB SERVER / CLIENT WITH MIDDLEWARE PIPELINES
 * ********************************************************* */
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * StubServer includes IOPA Client
 * 
 * @class StubServer
 * @param {object} options  
 * @param {appFunc} appFunc  Server callback in IOPA AppFunc format
 * @constructor
 */
function StubServer(options, appFunc) {
  
    _classCallCheck(this, StubServer);
    
  if (typeof options === 'function') {
     appFunc = options;
     
    if (appFunc.hasOwnProperty("properties"))
      options = appFunc.properties
    else 
      options = {};
  }
    
  EventEmitter.call(this);
  this._factory = new iopa.Factory(options);
  this._appFunc = appFunc;
 }

util.inherits(StubServer, EventEmitter);

/**
 * server.Listen()  Begin accepting connections using the specified arguments. 
 * 
 * @method listen
 * @returns promise completes when listening
 * @public 
 */
StubServer.prototype.listen = function StubServer_listen() {
   return this._listen.apply(this, arguments);
};


module.exports.createServer = function(options, appFunc){return new StubServer(options, appFunc);}

/**
 * server.connect() Create IOPA Session to given Host and Port
 *
 * @method connect
 * @this IOPAServer IopaServer instance
 * @parm {string} urlStr url representation of Request scheme://127.0.0.1/hello
 * @returns {Promise(context)}
 * @public
 */
StubServer.prototype.connect = function StubServer_connect(urlStr) {
 
};

StubServer.prototype.receive = function(buf){
	var context = this._factory.createContext();
	context[IOPA.Method] = "GET";
	
	context[SERVER.TLS] = false;
	context[SERVER.RemoteAddress] = "remote";
	context[SERVER.RemotePort] = 80;
	context[SERVER.LocalAddress] = "127.0.0.1";
	context[SERVER.LocalPort] = 80;
	context[SERVER.RawStream] = new iopaStream.IncomingMessageStream();
	context[SERVER.RawStream].append(buf);
	context[SERVER.IsLocalOrigin] = false;
	context[SERVER.IsRequest] = true;
	context[SERVER.SessionId] = context[SERVER.RemoteAddress] + ':' + context[SERVER.RemotePort];
	context[IOPA.Scheme] = "urn:";
   context[IOPA.MessageId] = context[IOPA.Seq];
  context[IOPA.Body] = context[SERVER.RawStream];
 
	var response = context.response;
	response[SERVER.TLS] = context["server.TLS"];
	response[SERVER.RemoteAddress] = context[SERVER.RemoteAddress];
	response[SERVER.RemotePort] = context[SERVER.RemotePort];
	response[SERVER.LocalAddress] = context[SERVER.LocalAddress];
	response[SERVER.LocalPort] = context[SERVER.LocalPort];
	response[SERVER.RawStream] = new iopaStream.OutgoingStream();
	response[SERVER.IsLocalOrigin] = true;
	response[SERVER.IsRequest] = false;
	response[IOPA.Scheme] = "urn:";
  response[IOPA.MessageId] = context[IOPA.MessageId];
  response[IOPA.Body] = response[SERVER.RawStream];
 	response[IOPA.Method] = "REPLY";
 	response[IOPA.StatusCode] = 200;
  response[IOPA.ReasonPhrase] = "OK";
	
	context.using(this._appFunc);
}

StubServer.prototype.respond = function(parentContext){ 
	  var parentResponse = parentContext.response;
  
        var context = this._factory.createContext();
        context[SERVER.TLS] = parentResponse[SERVER.TLS];
        context[SERVER.RemoteAddress] =parentResponse[SERVER.RemoteAddress];
        context[SERVER.RemotePort] = parentResponse[SERVER.RemotePort]
        context[SERVER.LocalAddress] =parentResponse[SERVER.LocalAddress]
        context[SERVER.LocalPort] = parentResponse[SERVER.LocalPort] 
        context[SERVER.RawStream] =  new iopaStream.IncomingMessageStream();
        context[SERVER.RawStream].append(parentContext[SERVER.RawTransport].toBuffer());
        context[SERVER.RawStream].append("-MIRROR");
 
        context[SERVER.IsLocalOrigin] = parentResponse[SERVER.IsLocalOrigin]
        context[SERVER.IsRequest] = parentResponse[SERVER.IsRequest] ;
        context[SERVER.SessionId] = parentResponse[SERVER.SessionId];
        context[IOPA.MessageId] = context[IOPA.Seq];
        context[IOPA.Body] = context[SERVER.RawStream];
        context[IOPA.Method] = "REPLY";
        context[IOPA.StatusCode] = 200;
        context[IOPA.ReasonPhrase] = "OK";
        
        var response = context.response;
        response[SERVER.TLS] = parentContext[SERVER.TLS];
        response[SERVER.RemoteAddress] = parentContext[SERVER.RemoteAddress];
        response[SERVER.RemotePort] = parentContext[SERVER.RemotePort];
        response[SERVER.LocalAddress] = parentContext[SERVER.LocalAddress];
        response[SERVER.LocalPort] = parentContext[SERVER.LocalPort];
        response[SERVER.RawStream] = new iopaStream.OutgoingStream;
         response[SERVER.RawTransport] = response[SERVER.RawStream];
        response[SERVER.IsLocalOrigin] =  parentContext[SERVER.IsLocalOrigin]
        response[SERVER.IsRequest] = parentContext[SERVER.IsRequest]
        response[IOPA.MessageId] = response[IOPA.Seq];
        response[IOPA.Body] = response[SERVER.RawStream];
       
        context[SERVER.ParentContext] = parentContext;
        context[SERVER.Fetch] = parentContext[SERVER.Fetch];
       
			   var channelContext=parentContext[SERVER.ParentContext];
	       channelContext[IOPA.Events].emit(IOPA.EVENTS.Response, context);
		context.dispose();
}

/**
 * server.connect() Create IOPA Session to given Host and Port
 *
 * @method connect
 * @this IOPAServer IopaServer instance
 * @parm {string} urlStr url representation of Request scheme://127.0.0.1/hello
 * @returns {Promise(context)}
 * @public
 */
/**
* Creates a new IOPA Request using a Tcp Url including host and port name
*
* @method connect

* @parm {object} options not used
* @parm {string} urlStr url representation of ://127.0.0.1:8200
* @public
* @constructor
*/
StubServer.prototype.connect = function TcpClient_connect(urlStr) {
  var channelContext = this._factory.createRequestResponse(urlStr, "CONNECT");
  var channelResponse = channelContext.response;
 
	channelContext[SERVER.Fetch] = StubServer_Fetch.bind(this, channelContext);
	channelContext[SERVER.RawStream] = new iopaStream.OutgoingStream();
	channelContext[SERVER.RawTransport] = channelContext[SERVER.RawStream];
	channelContext[SERVER.LocalAddress] = "127.0.0.1";
	channelContext[SERVER.LocalPort] = 80;
	
	channelResponse[SERVER.RawStream] = new iopaStream.IncomingMessageStream();
	channelResponse[SERVER.RawTransport] = channelContext[SERVER.RawTransport];
	channelResponse[SERVER.LocalAddress] = channelContext[SERVER.LocalAddress];
	channelResponse[SERVER.LocalPort] = channelContext[SERVER.LocalPort];
	
	channelContext[SERVER.SessionId] = channelContext[SERVER.LocalAddress] + ":" + channelContext[SERVER.LocalPort] + "-" + channelContext[SERVER.RemoteAddress] + ":" + channelContext[SERVER.RemotePort];
    
   if (this._clientAppFunc)
		   this._clientAppFunc(channelContext);

    return Promise.resolve(channelContext);
};

/**
 * Fetches a new IOPA Request using a Tcp Url including host and port name
 *
 * @method fetch

 * @param path string representation of ://127.0.0.1/hello
 * @param options object dictionary to override defaults
 * @param pipeline function(context):Promise  to call with context record
 * @returns Promise<null>
 * @public
 */
function StubServer_Fetch(channelContext, path, options, pipeline) {
 
  if (typeof options === 'function') {
    pipeline = options;
    options = {};
  }
  
  var channelResponse = channelContext.response;

  var urlStr = channelContext[SERVER.OriginalUrl] + path;
  var context = this._factory.createRequestResponse(urlStr, options);

  context[SERVER.LocalAddress] = channelContext[SERVER.LocalAddress];
  context[SERVER.LocalPort] = channelContext[SERVER.LocalPort];
  context[SERVER.RawStream] = channelContext[SERVER.RawStream];
  context[SERVER.RawTransport] = channelContext[SERVER.RawTransport];
  context[SERVER.SessionId] = channelContext[SERVER.SessionId];
  context[IOPA.MessageId] = context[IOPA.Seq];
  context[IOPA.Body] = context[SERVER.RawStream];
  context[IOPA.Method] = "REPLY";
 
  var response = context.response;
  response[SERVER.LocalAddress] = channelResponse[SERVER.LocalAddress];
  response[SERVER.LocalPort] = channelResponse[SERVER.LocalPort];
  response[SERVER.RawStream] = channelResponse[SERVER.RawStream];
     response[SERVER.RawTransport] = channelResponse[SERVER.RawTransport];

  response[SERVER.SessionId] = channelResponse[SERVER.SessionId];
  response[SERVER.ParentContext] = channelResponse;
  response[IOPA.MessageId] = context[IOPA.MessageId] ;
  response[IOPA.Body] = response[SERVER.RawStream];
  response[IOPA.Method] = "REPLY";
 
  var that = this;
   
   context[SERVER.ParentContext] = channelContext;
    
  return context.using(function(ctx){
             var value = pipeline(ctx);
             process.nextTick(function(){that.respond(ctx);});
               return value;
           });
};

StubServer.prototype.connectuse = function IOPAServer_connectuse(middleware) {
   this._clientAppFunc = middleware;
};

/**
 * server.close() Close IOPA Session 
 *
 * @method close
 * @this IOPAServer IopaServer instance
 * @returns {Promise()}
 * @public
 */
StubServer.prototype.close = function StubServer_close() {
   
};
