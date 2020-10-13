const express = require('express');
const app = express();
const axios = require('axios');
const bodyParser = require('body-parser');

const xsenv = require('@sap/xsenv');
xsenv.loadEnv();
const services = xsenv.getServices({
    uaa: { tag: 'xsuaa' },
    alm: { label: 'auditlog-management' }
});

const xssec = require('@sap/xssec');
const passport = require('passport');
passport.use('JWT', new xssec.JWTStrategy(services.uaa));
app.use(passport.initialize());
app.use(passport.authenticate('JWT', {
    session: false
}));

app.use(bodyParser.json());

async function getAuditLog() {
    try {
        let options1 = {
            method: 'POST',
            url: services.alm.uaa.url + '/oauth/token?grant_type=client_credentials',
            headers: {
                Authorization: 'Basic ' + Buffer.from(services.alm.uaa.clientid + ':' + services.alm.uaa.clientsecret).toString('base64')
            }
        };
        let res1 = await axios(options1);
        let timeFrom = new Date(Date.now() - (1000 * 60 * 5)); // 5 minutes ago
        try {
            options2 = {
                method: 'GET',
                url: services.alm.url + '/auditlog/v2/auditlogrecords?time_from=' + timeFrom.toISOString().substring(0, 16),
                headers: {
                    Authorization: 'Bearer ' + res1.data.access_token
                }
            };
            let res2 = await axios(options2);
            return res2.data;
        } catch (err) {
            console.log(err.stack);
            return err.message;
        }
    } catch (err) {
        console.log(err.stack);
        return err.message;
    }
};

app.get('/srv/user', function (req, res) {
    res.status(200).json(req.authInfo.userInfo);
});

app.get('/srv/audit', function (req, res) {
    getAuditLog().then(
        function (result) {
            res.status(200).json(result);
        },
        function (err) {
            console.log(err.stack);
            res.status(500).send(err.message);
        });
});

const port = process.env.PORT || 5001;
app.listen(port, function () {
    console.info('Listening on http://localhost:' + port);
});
