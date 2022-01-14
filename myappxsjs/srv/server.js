"use strict";
var https = require("https");

var xsenv = require("@sap/xsenv");
var port = process.env.PORT || 5001;
var server = require("http").createServer();

https.globalAgent.options.ca = xsenv.loadCertificates();

global.__base = __dirname + "/";
var init = require(global.__base + "utils/initialize");

//Initialize Express App
var app = init.initExpress();

//Setup Routes
//var router = require("./router")(app, server);

//Initialize the XSJS Compatibility Layer
init.initXSJS(app);

//Start the Server
server.on("request", app);

server.listen(port, function () {
    console.info("HTTP Server: " + server.address().port);
});