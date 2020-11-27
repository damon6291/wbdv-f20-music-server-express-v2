const User = require('../models/user');
const Post = require('../models/post');

module.exports = (app) => {
  const findAllPosts = async (req, res) => {
    await Post.find({}).exec((err, posts) => {
      if (err) {
        res.send({ message: err });
      } else {
        res.send(posts);
      }
    });
  };

  const createPost = async (req, res) => {
    try {
      console.log(req.body);
      const newPost = new Post(req.body);
      await newPost.save();
      res.send({ message: 'success' });
    } catch (err) {
      res.send({ message: 'error' });
    }
  };

  const removePost = async (req, res) => {
    await Post.findByIdAndDelete(
      {
        _id: req.params.id,
      },
      (err, deletedPost) => {
        if (err) {
          res.send({ message: err });
        } else {
          res.send(deletedPost);
        }
      }
    );
  };

  app.get('/api/posts', findAllPosts);
  app.post('/api/create-post', createPost);
  app.delete('/api/remove-post/:id', removePost);
};