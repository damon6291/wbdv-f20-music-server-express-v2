const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const bodyParser = require('body-parser');

require('dotenv').config();

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', 'https://wbdv-f20-music.herokuapp.com');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Origin');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

//Connecting to MongoDB
mongoose.connect(
  process.env.DB_URL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (req, res) => {
    console.log('connected to DB');
  }
);

//Default
app.get('/', (req, res) => {
  res.json({ message: 'connected to the port 8080' });
});

require('./controllers/spotify-controller')(app);
require('./controllers/user-controller')(app);
require('./controllers/post-controller')(app);

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log('listening to 8080');
});
