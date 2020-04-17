const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.status(200).json(req.headers);
});

const port = process.env.PORT || 5001;
app.listen(port, function () {
    console.info('Listening on http://localhost:' + port);
});
