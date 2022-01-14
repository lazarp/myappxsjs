"use strict";
module.exports = {
    initExpress: function () {
        var xsenv = require("@sap/xsenv");
        var passport = require("passport");
        var xssec = require("@sap/xssec");
        var express = require("express");

        //Initialize Express App 
        var app = express();

        //Add passport authentication and initialize
        passport.use("JWT", new xssec.JWTStrategy(xsenv.getServices({
            uaa: {
                tag: "xsuaa"
            }
        }).uaa));
        app.use(passport.initialize());
        app.use(
            passport.authenticate("JWT", {
                session: false
            })
        );

        return app;
    },

    initXSJS: function (app) {
        var xsjs = require("@sap/xsjs");
        var xsenv = require("@sap/xsenv");
        var options = {
            anonymous: false,
            auditLog: { logToConsole: true }, // Required. change to auditlog service for productive scenarios
            redirectUrl: "/srv/index.xsjs",
            xsApplicationUser: true, //Important
            context: {
                base: global.__base,
                env: process.env,
                answer: 42
            }
        };

        // configure UAA
        try {
            options = Object.assign(options, xsenv.getServices({
                uaa: {
                    tag: "xsuaa"
                }
            }));
        } catch (err) {
            console.log("[WARN]", err.message);
        }

        //configure HANA
        try {
            options = Object.assign(options, xsenv.getServices({
                hana: {
                    tag: "hana"
                }
            }));
        } catch (err) {
            console.log("[WARN]", err.message);
        }

        // start server
        var xsjsApp = xsjs(options);
        app.use(xsjsApp);
    }
};