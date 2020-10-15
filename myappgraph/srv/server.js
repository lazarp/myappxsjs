const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const xsenv = require('@sap/xsenv');
xsenv.loadEnv();
const services = xsenv.getServices({
    hana: { tag: 'hana' },
    uaa: { tag: 'xsuaa' }
});

const hdbext = require('@sap/hdbext');
app.use(hdbext.middleware(services.hana));

const xssec = require('@sap/xssec');
const passport = require('passport');
passport.use('JWT', new xssec.JWTStrategy(services.uaa));
app.use(passport.initialize());
app.use(passport.authenticate('JWT', { session: false }));

app.use(bodyParser.json());

app.get('/srv/user', function (req, res) {
    res.status(200).json(req.authInfo.userInfo);
});

app.get('/srv/airports', function (req, res) {
    req.db.exec('SELECT * FROM "myappgraph.db::Airports"', function (err, results) {
        if (err) {
            res.type('text/plain').status(500).send('ERROR: ' + err);
            return;
        }
        res.status(200).json(results);
    });
});

app.get('/srv/routes', function (req, res) {
    req.db.exec('SELECT * FROM "myappgraph.db::Routes"', function (err, results) {
        if (err) {
            res.type('text/plain').status(500).send('ERROR: ' + err);
            return;
        }
        res.status(200).json(results);
    });
});

app.get('/srv/gw', function (req, res) {
    req.db.exec('SELECT * FROM GRAPH_WORKSPACES', function (err, results) {
        if (err) {
            res.type('text/plain').status(500).send('ERROR: ' + err.toString());
            return;
        }
        res.status(200).json(results);
    });
});

app.get('/srv/gwc', function (req, res) {
    req.db.exec('SELECT * FROM GRAPH_WORKSPACE_COLUMNS', function (err, results) {
        if (err) {
            res.type('text/plain').status(500).send('ERROR: ' + err.toString());
            return;
        }
        res.status(200).json(results);
    });
});

app.get('/srv/trippossible', function (req, res) {
    hdbext.loadProcedure(req.db, null, 'myappgraph.db::SP_TripPossible', (err, sp) => {
        if (err) {
            console.error(err);
            res.status(500).json(err);
            return;
        }
        sp({ AIRPORTCODEORIGIN: req.query.origin, AIRPORTCODEDESTINATION: req.query.dest }, (err, parameters) => {
            if (err) {
                console.error(err);
                res.status(500).json(err);
                return;
            }
            res.status(200).json(parameters);
        });
    });
});

app.get('/srv/triprouting', function (req, res) {
    hdbext.loadProcedure(req.db, null, 'myappgraph.db::SP_TripRouting', (err, sp) => {
        if (err) {
            console.error(err);
            res.status(500).json(err);
            return;
        }
        sp({ AIRPORTCODEORIGIN: req.query.origin, AIRPORTCODEDESTINATION: req.query.dest }, (err, parameters, routing) => {
            if (err) {
                console.error(err);
                res.status(500).json(err);
                return;
            }
            var results = { "parameters": parameters, "routing": routing };
            res.status(200).json(results);
        });
    });
});

app.get('/srv/weightedtriprouting', function (req, res) {
    hdbext.loadProcedure(req.db, null, 'myappgraph.db::SP_WeightedTripRouting', (err, sp) => {
        if (err) {
            console.error(err);
            res.status(500).json(err);
            return;
        }
        sp({ WEIGHT: req.query.weight, AIRPORTCODEORIGIN: req.query.origin, AIRPORTCODEDESTINATION: req.query.dest }, (err, parameters, routing) => {
            if (err) {
                console.error(err);
                res.status(500).json(err);
                return;
            }
            var results = { "parameters": parameters, "routing": routing };
            res.status(200).json(results);
        });
    });
});

app.get('/srv/findneighbors', function (req, res) {
    hdbext.loadProcedure(req.db, null, 'myappgraph.db::SP_FindNeighbors', (err, sp) => {
        if (err) {
            console.error(err);
            res.status(500).json(err);
            return;
        }
        sp({ AIRPORTCODE: req.query.airportCode, DIRECTION: req.query.direction, MINDEPTH: req.query.min, MAXDEPTH: req.query.max }, (err, parameters, neighbors) => {
            if (err) {
                console.error(err);
                res.status(500).json(err);
                return;
            }
            res.status(200).json(neighbors);
        });
    });
});

app.get('/srv/airportdestinations', function (req, res) {
    hdbext.loadProcedure(req.db, null, 'myappgraph.db::SP_AirportDestinations', (err, sp) => {
        if (err) {
            console.error(err);
            res.status(500).json(err);
            return;
        }
        sp({ AIRPORTCODE: req.query.airportCode }, (err, parameters) => {
            if (err) {
                console.error(err);
                res.status(500).json(err);
                return;
            }
            res.status(200).json(parameters);
        });
    });
});

app.get('/srv/opencypherquery', function (req, res) {
    const sql = `
        SELECT DISTINCT *
            FROM OPENCYPHER_TABLE (
                GRAPH WORKSPACE "myappgraph.db::GW_Flights"
                QUERY '
                    MATCH   (a)-[e]->(b)
                    WHERE   a.country = ''United States'' AND 
                            e.distance > 4000 AND 
                            b.altitude < 50 AND
                            e.airlineName ENDS WITH ''lines''
                    RETURN  a.airportCode AS airportCodeFrom, 
                            b.airportCode AS airportCodeTo,
                            e.airlineName AS airlineName
                '
            )
            ORDER BY "airportCodeFrom"
        `;
    req.db.exec(sql, function (err, results) {
        if (err) {
            console.error(err);
            res.status(500).json(err);
            return;
        }
        res.status(200).json(results);
    });
});

app.get('/srv/opencypheralliances', function (req, res) {
    const sql = `
        SELECT DISTINCT *
            FROM OPENCYPHER_TABLE (
                GRAPH WORKSPACE "myappgraph.db::GW_Flights"
                QUERY '
                    MATCH   (a)-[e1]->(b)
                    MATCH   (b)-[e2]->(c)
                    MATCH   (c)-[e3]->(d)
                    WHERE   a.airportCode = ''NTE'' AND
                            d.airportCode = ''PDX'' AND
                            (e1.allianceName = e2.allianceName AND e2.allianceName = e3.allianceName)
                    RETURN e1.allianceName AS allianceName,
                            e1.airlineName AS airlineName1,
                            b.airportCode AS transferAirportCode1,
                            e2.airlineName AS airlineName2,
                            c.airportCode AS transferAirportCode2,
                            e3.airlineName AS airlineName3
                '
            )
            ORDER BY "allianceName"
        `;
    req.db.exec(sql, function (err, results) {
        if (err) {
            console.error(err);
            res.status(500).json(err);
            return;
        }
        res.status(200).json(results);
    });
});

const port = process.env.PORT || 5001;
app.listen(port, function () {
    console.info('Listening on http://localhost:' + port);
});
