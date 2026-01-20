const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/message-service', routes);

app.use(errorHandler);

module.exports = app;
