const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
var exphbs = require('express-handlebars');

var app = express();

app.use(logger('dev'));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: false }));

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine','handlebars');

app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/accounts', require('./routes/accounts'));
app.use('/admin',require('./routes/admin'));

module.exports = app;