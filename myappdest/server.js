const express = require('express');
const app = express();
const axios = require('axios');

const xsenv = require('@sap/xsenv');

async function getDestination(dest) {
    try {
        xsenv.loadEnv();
        let services = xsenv.getServices({
            dest: { tag: 'destination' }
        });
        try {
            let options1 = {
                method: 'POST',
                url: services.dest.url + '/oauth/token?grant_type=client_credentials',
                headers: {
                    Authorization: 'Basic ' + Buffer.from(services.dest.clientid + ':' + services.dest.clientsecret).toString('base64')
                }
            };
            let res1 = await axios(options1);
            try {
                options2 = {
                    method: 'GET',
                    url: services.dest.uri + '/destination-configuration/v1/destinations/' + dest,
                    headers: {
                        Authorization: 'Bearer ' + res1.data.access_token
                    }
                };
                let res2 = await axios(options2);
                return res2.data.destinationConfiguration;
            } catch (err) {
                console.log(err.stack);
                return err.message;
            }
        } catch (err) {
            console.log(err.stack);
            return err.message;
        }
    } catch (err) {
        console.log(err.stack);
        return err.message;
    }
};

app.get('/', function (req, res) {
    getDestination('northwind').then(
        function (result) {
            // result contains the destination information for use in REST calls
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
