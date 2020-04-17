const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const xsenv = require('@sap/xsenv');
xsenv.loadEnv();
const services = xsenv.getServices({
    uaa: { tag: 'xsuaa' }
});

const xssec = require('@sap/xssec');
const passport = require('passport');
passport.use('JWT', new xssec.JWTStrategy(services.uaa));
app.use(passport.initialize());
app.use(passport.authenticate('JWT', {
    session: false
}));

app.use(bodyParser.json());

app.get('/srv/user', function (req, res) {
    res.status(200).json(req.authInfo.userInfo);
});

const port = process.env.PORT || 5001;
app.listen(port, function () {
    console.info('Listening on http://localhost:' + port);
});
