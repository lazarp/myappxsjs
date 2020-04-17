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

app.get('/srv/db', function(req, res) {
    req.db.exec('SELECT SYSTEM_ID, DATABASE_NAME, HOST, VERSION, USAGE FROM M_DATABASE', function(err, results) {
        if (err) {
            res.type('text/plain').status(500).send('ERROR: ' + err);
            return;
        }
        res.status(200).json(results);
    });
});

app.get('/srv/session', function(req, res) {
    req.db.exec('SELECT SESSION_USER, CURRENT_SCHEMA FROM DUMMY', function(err, results) {
        if (err) {
            res.type('text/plain').status(500).send('ERROR: ' + err.toString());
            return;
        }
        res.status(200).json(results);
    });
});

app.get('/srv/sales', function (req, res) {
    req.db.exec('SELECT * FROM "myapphana.db::sales"', function (err, results) {
        if (err) {
            res.type('text/plain').status(500).send('ERROR: ' + err.toString());
            return;
        }
        res.status(200).json(results);
    });
});

const port = process.env.PORT || 5001;
app.listen(port, function () {
    console.info('Listening on http://localhost:' + port);
});
