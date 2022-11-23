require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

const exerciseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  log: {
    type: [exerciseSchema],
    required: true,
  },
});

const userModel = mongoose.model('user', userSchema);

//Creat a New User
app.post('/api/users', function (req, res, next) {
  let newUser = new userModel({ username: req.body.username, log: [] });
  newUser.save(function (err, data) {
    if (err) {
      return console.error(err);
    } else {
      res.json({ username: data.username, _id: data._id });
    }
  });
});

//Return all users - get request to /api/users
app.get('/api/users', function (req, res, next) {
  userModel.find({}, { _id: 1, username: 1 }, function (err, data) {
    if (err) {
      return console.error(err);
    } else {
      res.json(data);
    }
  });
});

//Add exercises
app.post('/api/users/:_id/exercises', function (req, res, next) {
  if (req.body.date === '') {
    res.locals.date = new Date().toDateString();
  } else {
    res.locals.date = new Date(req.body.date).toDateString();
  }
  userModel.findByIdAndUpdate(
    { _id: req.params._id },
    {
      $push: {
        log: {
          description: req.body.description,
          duration: req.body.duration,
          date: res.locals.date,
        },
      },
    },
    function (err, data) {
      if (err) {
        return console.error(err);
      } else {
        res.json({
          _id: data._id,
          username: data.username,
          date: res.locals.date,
          duration: req.body.duration,
          description: req.body.description,
        });
      }
    }
  );
});

//Lookup log of users exercises
app.get(
  '/api/users/:_id/logs/',
  function (req, res, next) {
    userModel.findById({ _id: req.params._id }, function (err, data) {
      if (err) {
        return console.error(err);
      } else {
        res.locals.logData = data;
        next();
      }
    });
  },
  function (req, res, next) {
    res.locals.log = [];
    let count = 0;
    res.locals.logData.log.forEach(function (obj) {
      if (
        req.query.from != undefined &&
        new Date(obj.date) <= new Date(req.query.from)
      ) {
        return;
      } else if (
        req.query.to != undefined &&
        new Date(obj.date) >= new Date(req.query.to)
      ) {
        return;
      } else if (req.query.limit < count) {
        return;
      } else {
        count++;
        res.locals.log.push({
          description: obj.description,
          duration: obj.duration,
          date: obj.date,
        });
      }
    });
    res.json({
      _id: res.locals.logData._id,
      username: res.locals.logData.username,
      count: res.locals.log.length,
      log: res.locals.log,
    });
  }
);

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
