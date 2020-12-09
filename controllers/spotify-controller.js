var request = require('request');
const User = require('../models/user');

module.exports = (app) => {
  var client_id = '64a311df55f24059a326323c754eedfd';
  var client_Secret = '71ed2c4226d746488ca2afd497128671';
  var authClient = 'Basic ' + new Buffer(client_id + ':' + client_Secret).toString('base64');
  var constant_access_token =
    'BQCSTtFbENz0sLDQW2VJbtns02QPLIcnnG-perIleJGSa_r8M5AXOrS0O7PewyyG3K-Ad46RIpnvLCkJf_shsT89baXzqZK5BDnk0D-8pFf50M8YTXAtjH8-KzQCHaGiFDKtTS7f33nDuoxqR7-oQ5_CqeVRlcMycbrvyixXo67X0Nj9iwNxo_WXB7S2TmSnMJwHy_bc-PTiUQ7-sGBzmIGYo-oXE5JL7HTLU4HLj30cKcxLjNn_-6uk9jYVdfoSHUezOmAjGmIHozRFkjZGzSDd';

  var constant_refresh_token =
    'AQCKvYSAjSY4q9_86018kjOuzA46cy2i8_Tz6WAO-V72pXtxr2RJcupWNxPUodU8k-QifMC6LzxOdG_hMEAwj9FrGSLCvSeWY3MqyNt7vfT4RpwJV51yo7ZCX_3J_CRLsW4';

  // var serverUrl = 'http://localhost:8080/';
  // var clientUrl = 'http://localhost:3000/';
  var serverUrl = 'https://wbdv-f20-music-server.herokuapp.com/';
  var clientUrl = 'https://wbdv-f20-music.herokuapp.com/';

  var redirect_uri = `${serverUrl}post_authentication`;

  app.get('/api/spotifylogin/:userName', (req, res) => {
    USERNAME = req.params.userName;
    console.log('username is ' + USERNAME);
    var scope =
      'ugc-image-upload%20user-read-recently-played%20' +
      'user-read-playback-position%20user-top-read%20' +
      'playlist-modify-private%20playlist-read-collaborative%20' +
      'playlist-read-private%20playlist-modify-public%20' +
      'user-read-email%20user-read-private%20streaming%20app-remote-control%20user-follow-read%20' +
      'user-follow-modify%20user-library-modify%20user-library-read%20user-read-currently-playing%20' +
      'user-read-playback-state%20 + user-modify-playback-state';
    res.redirect(
      'https://accounts.spotify.com/authorize?client_id=' +
        client_id +
        '&response_type=code&redirect_uri=' +
        redirect_uri +
        '&scope=' +
        scope +
        '&show_dialog=true'
    );
    app.get('/post_authentication', (req, res) => {
      code = req.query.code;
      console.log(code);

      var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
          code: code,
          redirect_uri: redirect_uri,
          grant_type: 'authorization_code',
        },
        headers: {
          Authorization: authClient,
        },
        json: true,
      };

      request.post(authOptions, (error, response, bodyA) => {
        if (error) {
          console.log('there has been an error with authentication');
        } else {
          var authOptions = {
            url: 'https://api.spotify.com/v1/me/',
            headers: { Authorization: 'Bearer ' + bodyA.access_token },
          };
          request.get(authOptions, (error, response, body) => {
            if (error) {
              console.log('line 67 ' + error);
            } else {
              console.log(USERNAME);
              User.updateOne(
                { userName: USERNAME },
                {
                  $set: {
                    accessToken: bodyA.access_token,
                    refreshToken: bodyA.refresh_token,
                    spotifyId: JSON.parse(response.body).id,
                  },
                },
                (err, updatedUser) => {
                  if (err || !updatedUser) {
                    console.log('line 80 ' + err);
                  } else {
                    console.log(updatedUser);
                  }
                }
              );
            }
          });

          res.redirect(clientUrl + 'Login');
        }
      });
    });
  });

  function refresh_access_spotify(refresh_tok) {
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        refresh_token: refresh_tok,
        grant_type: 'refresh_token',
      },
      headers: {
        Authorization: authClient,
      },
      json: true,
    };

    request.post(authOptions, (error, response, body) => {
      console.log(body);
      if (refresh_tok === constant_refresh_token) {
        if (body.refresh_token !== undefined) {
          constant_refresh_token = body.refresh_token;
        }
        constant_access_token = body.access_token;
      } else {
        return body.access_token;
      }
    });
  }

  refresh_access_spotify(constant_refresh_token);

  setInterval(() => {
    refresh_access_spotify(constant_refresh_token);
  }, 360000);

  // -----------------------------------------------------------------

  //find playlist for user
  app.get('/api/:id/playlists', async (req, res) => {
    await User.findOne({ _id: req.params.id }).exec((err, one) => {
      if (err) {
        res.send({ message: err });
      } else {
        var authOptions = {
          url: 'https://api.spotify.com/v1/users/' + one.spotifyId + '/playlists',
          headers: { Authorization: 'Bearer ' + constant_access_token },
        };
        request.get(authOptions, async (error, response, body) => {
          if (error) {
            console.log(error);
          } else {
            //    console.log(JSON.parse(response.body));
            const items = JSON.parse(response.body).items;

            res.send(items);
          }
        });
      }
    });
  });

  //find user's spotify profile
  app.get('/api/profile/:id', (req, res) => {
    User.findOne({ _id: req.params.id }).exec((err, one) => {
      console.log(req.params.id);
      console.log(one);
      if (err) {
        res.send({ message: err });
      } else {
        var authOptions = {
          url: 'https://api.spotify.com/v1/users/' + one.spotifyId,
          headers: { Authorization: 'Bearer ' + constant_access_token },
        };
        request.get(authOptions, (error, response, body) => {
          if (error) {
            console.log(error);
          } else {
            res.send(response.body);
          }
        });
      }
    });
  });

  //search for playlist
  app.get('/api/playlists/:query', async (req, res) => {
    var query = req.params.query;
    query.replace(' ', '%20');
    var authOptions = {
      url: 'https://api.spotify.com/v1/search?q=' + query + '&type=playlist',
      headers: { Authorization: 'Bearer ' + constant_access_token },
    };
    request.get(authOptions, async (error, response, body) => {
      if (error) {
        console.log(error);
      } else {
        const items = JSON.parse(response.body).playlists.items;

        res.send(items);
      }
    });
  });

  //search for playlist details
  app.get('/api/playlist/:playlistId/details', (req, res) => {
    var query = req.params.playlistId;
    var authOptions = {
      url: 'https://api.spotify.com/v1/playlists/' + query,
      headers: { Authorization: 'Bearer ' + constant_access_token },
    };
    request.get(authOptions, (error, response, body) => {
      if (error) {
        console.log(error);
      } else {
        res.send(response.body);
      }
    });
  });
  //-------------
};
