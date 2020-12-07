const User = require('../models/user');
const session = require('express-session');

module.exports = (app) => {
  app.use(
    session({
      secret: 'keyboard cat',
      resave: false,
      saveUninitialized: true,
    })
  );

  // app.use(function (req, res, next) {
  //   if (!req.session.cur) {
  //     req.session.cur = 'error';
  //   }
  //   // count the views
  //   req.session.cur = (req.session.views[pathname] || 0) + 1;

  //   next();
  // });

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

      // let username = req.body.userName
      // let password = req.body.password
      // // let displayName = req.body.displayName

      // // check if username already exists
      // await User.find({ userName: username }).exec((err, users) => {
      //   if (!err) {
      //     // found another user with this name, don't allow registration
      //     res.send({message: 'error'})
      //     return;
      //   }
      // });

      // // password validation: minimum 5 characters
      // if (password.length < 5) {
      //   res.send({message: 'error'})
      //   return;
      // }

      // // password validation: at least one number
      // const re = /[0-9]/;
      // if(!re.test(password)) {
      //   res.send({message: 'error'})
      //   return;
      // }

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
          userName: req.body.userName,
          displayName: req.body.displayName,
          phone: req.body.phone,
          email: req.body.email,
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

  const findUserBySpotifyId = async (req, res) => {
    await User.findOne({ spotifyId: req.params.id }).exec((err, user) => {
      if (err || user === null) {
        res.send({ message: 'error' });
      } else {
        console.log(user);
        res.json(user);
      }
    });
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
      await User.updateOne({ _id: req.params.id }, { $push: { search: req.body } });
      await User.updateOne({ _id: req.params.id }, { $unset: { 'search.0': 1 } });
      await User.updateOne({ _id: req.params.id }, { $pull: { search: null } });
      res.send({ message: 'success' });
    } catch (err) {
      console.log(err);
      res.send({ message: 'error' });
    }

    // await User.findOne({ _id: req.params.Id }).exec((err, user) => {
    //   if (err) {
    //     res.send({ message: 'error' });
    //   } else {
    //     user.search.push(req.body.query);
    //     res.send({ message: 'success' });
    //   }
    // });
  };

  const editPhoneNumber = async (req, res) => {
    userId = req.params.user;
    phoneNumber = req.body.phoneNumber;

    try {
      await User.updateOne({ _id: userId }, { $set: { phone: phoneNumber } });
      res.send({ message: 'success' });
    } catch (err) {
      res.send({ message: 'error' });
    }
  };

  const editEmail = async (req, res) => {
    userId = req.params.id;
    email = req.body.email;
    try {
      await User.updateOne({ _id: userId }, { $set: { phone: phoneNumber } });
      res.send({ message: 'success' });
    } catch (err) {
      res.send({ message: 'error' });
    }
  };

  const getRole = async (req, res) => {
    await User.findOne({ _id: req.params.id }).exec((err, user) => {
      if (err) {
        res.send({ message: err });
      } else {
        res.json(user.role);
      }
    });
  };

  const changeRole = async (req, res) => {
    currentRole = req.body.role;
    if (currentRole === 'Admin') {
      await User.updateOne({ _id: req.params.id }, { $set: { role: 'User' } });
      res.send({ message: 'success' });
    } else {
      await User.updateOne({ _id: req.params.id }, { $set: { role: 'Admin' } });
      res.send({ message: 'success' });
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
  app.get('/api/find-user/spotifyId/:id', findUserBySpotifyId);
  app.post('/api/follow-remove/:fromId/:toId', removeFollowers);
  app.get('/api/find-currentuser', findCurrentUser);
  app.get('/api/logout', logout);
  app.post('/api/add-search/:id', addSearch);
  app.get('/api/all-users', findAllUsers);
  app.post('/api/editPhoneNumber/:id', editPhoneNumber);
  app.post('/api/editEmail/:id', editEmail);
  app.get('api/check-role/:id', getRole);
  app.post('api/change-role/:id', changeRole);
};
