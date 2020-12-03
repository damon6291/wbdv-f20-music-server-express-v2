const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const bodyParser = require('body-parser');

require('dotenv').config();

const User = require('./models/user');

app.use(cors());
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

app.listen(8080, () => {
  console.log('listening to 8080');
});
