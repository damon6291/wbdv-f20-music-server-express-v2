const User = require('../models/user');

module.exports = (app) => {
  const findAllUsers = async (req, res) => {
    await User.find({}).exec((err, users) => {
      if (err) {
        res.send({ message: err });
      } else {
        res.json(users);
      }
    });
  };

  const findUserById = async (req, res) => {
    await User.findOne({ _id: req.params.id }).exec((err, user) => {
      if (err) {
        res.send({ message: err });
      } else {
        res.json(user);
      }
    });
  };

  const createUser = async (req, res) => {
    try {
      const newUser = new User(req.body);
      await newUser.save();
      res.send({ message: 'success' });
    } catch (err) {
      res.send({ message: 'error' });
    }
  };

  const deleteUserById = async (req, res) => {
    await User.findByIdAndDelete(
      {
        _id: req.params.id,
      },
      (err, deletedUser) => {
        if (err) {
          res.send({ message: err });
        } else {
          res.json(deletedUser);
        }
      }
    );
  };

  const updateUserById = async (req, res) => {
    await User.findByIdAndUpdate(
      {
        _id: req.params.id,
      },
      {
        $set: {
          displayName: req.body.displayName,
          userName: req.body.userName,
          password: req.body.password,
        },
      },
      {
        upsert: true,
      },
      (err, updatedUser) => {
        if (err || !updatedUser) {
          res.send({ message: err });
        } else {
          res.json(updatedUser);
        }
      }
    );
  };

  const addFollowers = async (req, res) => {
    await User.findOne({ _id: req.params.toId }).exec((err, user) => {
      if (err) {
        res.send({ message: err });
      } else {
        console.log(user);
        user.followers.push(req.params.fromId);
        user.save();
        res.send({ message: 'success' });
      }
    });
  };

  const userLogin = async (req, res) => {
    console.log(req.body.userName);
    console.log(req.body.password);
    await User.findOne({ userName: req.body.userName, password: req.body.password }).exec(
      (err, login) => {
        if (err || login === null) {
          res.send({ message: 'error' });
        } else {
          console.log(login);
          res.send({ message: login._id });
        }
      }
    );
  };

  const findUsersByName = async (req, res) => {
    await User.find({ displayName: req.params.query }).exec((err, users) => {
      if (err) {
        res.send({ message: err });
      } else {
        res.json(users);
      }
    });
  };

  app.get('/api/users', findAllUsers);
  app.get('/api/find-user/:id', findUserById);
  app.post('/api/create-user', createUser);
  app.delete('/api/delete-user/:id', deleteUserById);
  app.post('/api/update-user/:id', updateUserById);
  app.post('/api/login', userLogin);
  app.post('/api/follow/:fromId/:toId', addFollowers);
  app.get('/api/find-users/:query', findUsersByName);
};
