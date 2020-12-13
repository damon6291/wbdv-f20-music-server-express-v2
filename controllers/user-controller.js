const User = require('../models/user');
const session = require('express-session');

module.exports = (app) => {
  app.set('trust proxy', 1);
  app.use(
    session({
      secret: 'keyboard cat',
      resave: false,
      saveUninitialized: true,
      // cookie: {
      //   sameSite: 'none',
      //   secute: true,
      // },
    })
  );

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
      let username = req.body.userName;
      let password = req.body.password;
      // let displayName = req.body.displayName

      const u = await User.find({ userName: username }).exec();

      console.log(u, u.length);

      if (u.length > 0) {
        console.log('1');
        res.send({ message: 'Same userName exists' });
        return;
      }

      // password validation: minimum 5 characters
      if (password.length < 5) {
        console.log('2');
        res.send({
          message: 'Password should be atleast 5 characters including atleast one number.',
        });
        return;
      }

      // password validation: at least one number
      const re = /[0-9]/;
      if (!re.test(password)) {
        console.log('3');
        res.send({
          message: 'Password should be atleast 5 characters including atleast one number.',
        });
        return;
      }

      const newUser = new User(req.body);
      await newUser.save();
      res.send({ message: 'success' });
    } catch (err) {
      console.log('4');
      res.send({ message: 'Please try it again' });
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
          userName: req.body.userName,
          displayName: req.body.displayName,
          phone: req.body.phone,
          email: req.body.email,
          role: req.body.role,
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
    await User.findOne({ _id: req.params.toId }).exec((err, toUser) => {
      if (err) {
        res.send({ message: err });
      } else {
        console.log(toUser);
        toUser.followers.push(req.params.fromId);

        User.findOne({ _id: req.params.fromId }).exec((err, fromUser) => {
          if (err) {
            res.send({ message: err });
          } else {
            fromUser.followings.push(req.params.toId);

            toUser.save();
            fromUser.save();
            res.send({ message: 'success' });
          }
        });
      }
    });
  };

  const removeFollowers = async (req, res) => {
    await User.updateOne(
      { _id: req.params.toId },
      { $pull: { followers: { _id: req.params.fromId } } },
      (err, toUser) => {
        if (err || !toUser) {
          res.send({ message: err });
        } else {
          User.updateOne(
            { _id: req.params.fromId },
            { $pull: { followings: { _id: req.params.toId } } },
            (err, fromUser) => {
              if (err || !fromUser) {
                res.send({ message: err });
              } else {
                res.send({ message: 'success' });
              }
            }
          );
        }
      }
    );
  };

  const userLogin = async (req, res) => {
    await User.findOne({ userName: req.body.userName, password: req.body.password }).exec(
      (err, login) => {
        if (err || login === null) {
          res.send({ message: 'error' });
        } else {
          req.session.cur = login._id;
          res.send({ message: login._id });
        }
      }
    );
  };

  const findUsersByName = async (req, res) => {
    await User.find({ displayName: { $regex: new RegExp(req.params.query, 'i') } }).exec(
      (err, users) => {
        if (err) {
          res.send({ message: err });
        } else {
          res.json(users);
        }
      }
    );
  };

  const findCurrentUser = (req, res) => {
    const cur = req.session.cur;
    cur === undefined ? res.send({ message: 'error' }) : res.send({ message: cur });
  };

  const logout = (req, res) => {
    req.session.destroy();
    res.send(200);
  };

  const addSearch = async (req, res) => {
    try {
      const u = await User.findById(req.params.id).exec();

      if (u.search.length > 4) {
        await User.updateOne({ _id: req.params.id }, { $unset: { 'search.0': 1 } });
      }
      await User.updateOne({ _id: req.params.id }, { $push: { search: req.body } });
      await User.updateOne({ _id: req.params.id }, { $pull: { search: null } });

      res.send({ message: 'success' });
    } catch (err) {
      console.log(err);
      res.send({ message: 'error' });
    }
  };

  app.get('/api/users', findAllUsers);
  app.get('/api/find-user/:id', findUserById);
  app.post('/api/create-user', createUser);
  app.delete('/api/delete-user/:id', deleteUserById);
  app.post('/api/update-user/:id', updateUserById);
  app.post('/api/login', userLogin);
  app.post('/api/follow/:fromId/:toId', addFollowers);
  app.get('/api/find-users/:query', findUsersByName);
  app.post('/api/follow-remove/:fromId/:toId', removeFollowers);
  app.get('/api/find-currentuser', findCurrentUser);
  app.get('/api/logout', logout);
  app.post('/api/add-search/:id', addSearch);
  app.get('/api/all-users', findAllUsers);
};
