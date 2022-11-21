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

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  log: {
    type: Array,
    required: true,
  },
});

const userModel = mongoose.model('user', userSchema);

app.post('/api/users', function (req, res, next) {
  let newUser = new userModel({ username: req.body.username, log: [] });
  newUser.save(function (err, data) {
    if (err) {
      return console.error(err);
    } else {
      console.log(data);
      res.json({ username: data.username, _id: data._id });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
