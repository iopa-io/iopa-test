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

// global.Promise = require('bluebird');

const index = require('../index.js'),
    stubServer = index.stubServer;

const should = require('should');

const iopa = require('iopa-rest');

describe('#iopa-test()', function () {
    var seq = 0;
    
    it('should have stubServer', function () {
        index.should.have.property("stubServer");
    });

    it('should simulate incoming messages', function (done) {

        var app = new iopa.App();
        app.use(stubServer);
        app.use(stubServer.continue);

         app.use(function (context, next) {
            context.response["iopa.Body"].end("HELLO WORLD " + seq++);
            return next();
        });

        var server = app.createServer("stub:")
   
         server.receive("GET", "/", "TEST");
         setTimeout(function(){
                seq.should.equal(1);
                done();
            }, 40);

    })
    
    it('should simulate outgoing messages', function (done) {

        var app = new iopa.App();
        app.use(stubServer);
        app.use(stubServer.continue);

         app.use(function (context, next) {
            context.response["iopa.Body"].end("HELLO WORLD " + seq++);
            return next();
        });
 
         var server = app.createServer("stub:");
   
         server.connect("urn://localhost").then(function (client) {
            var context = client.create("/projector", "GET");
            context["iopa.Body"].end("HELLO WORLD " + seq++);
            process.nextTick(function(){
                seq.should.equal(3);
                done();
            });
        }) 


    })
});
