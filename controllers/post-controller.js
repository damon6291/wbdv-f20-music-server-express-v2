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

  app.get('/api/posts', findAllPosts);
  app.post('/api/create-post', createPost);
};
