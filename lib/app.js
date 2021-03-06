const express = require('express');
const morgan = require('morgan');
const app = express();
const errorHandler = require('./util/error-handler');
require('./models/register-plugins');

app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('./public'));

const users = require('./routes/users');
const events = require('./routes/events');
const auth = require('./routes/auth');
const profiles = require('./routes/profiles');
const groups = require('./routes/groups');

app.use('/api/auth', auth);
app.use('/api/users', users);
app.use('/api/profiles', profiles);
app.use('/api/events', events);
app.use('/api/groups', groups);

app.use((req, res) => {
    res.sendFile('index.html', { root: './public' });
});

app.use(errorHandler());

module.exports = app;