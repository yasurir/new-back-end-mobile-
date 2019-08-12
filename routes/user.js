const express = require('express');
const router = express.Router();
const User = require('../models/user');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config/database');
const log = require('../log');

// get a list of ninjas from the db
router.get('/locationAdd/:id', function(req, res, next){
  console.log(req.params.id);
  User.findByIdAndUpdate(req.params.id, {geometry:{"coordinates":[parseFloat(req.query.lng),parseFloat(req.query.lat)]}}, {rank: '10000'}, function (err, user) {
      if (err) return res.status(500).send("There was a problem updating the user.");
      res.status(200).send(user);
  });
});

// get a list of ninjas from the db
router.get('/location', function(req, res, next){
  /* Ninja.find({}).then(function(ninjas){
      res.send(ninjas);
  }); */
  User.geoNear(
      {type: 'Point', coordinates: [parseFloat(req.query.lng), parseFloat(req.query.lat)]},
      {maxDistance: 1000000, spherical: true}
  ).then(function(users){
      res.status(200).send(users);
  }).catch(next);
});

// register
router.post('/register', (req, res, next) => {
  let response = {success: false};
  if (!(req.body.password == req.body.confirmPass)) {
    let err = 'The passwords don\'t match';
    return next(err);
  }
  else {
    let newUser = new User({
      username: req.body.username,
      password: req.body.password,
      role: 'User',
      email: req.body.email
    });

    User.addUser(newUser, (err, user) => {
      if (err) {
        response.msg = err.msg || "Failed to register user";
        res.json(response);
      } else {
        response.success = true;
        response.msg = "User registered successfuly";
        response.user = {
          id: user._id,
          username: user.username
        }
        console.log("[%s] registered successfuly", user.username);
        res.json(response);
      }
    });
  }
});

router.post("/authenticate", (req, res, next) => {
  let body = req.body;
  let response = {success: false};

  User.authenticate(body.username.trim(), body.password.trim(), (err, user) => {
    if (err) {
      response.msg = err.msg;
      res.json(response);
    } else { // create the unique token for the user
        let signData = {
          id: user._id,
          username: user.username
        };
        let token = jwt.sign(signData, config.secret, {
          expiresIn: 604800
        });

        response.token = "JWT " + token;
        response.user = signData;
        response.success = true;
        response.msg = "User authenticated successfuly";
        response.email = user.email;

        console.log("[%s] authenticated successfuly", user.username);
        res.json(response);
    }
  });
});

// profile
router.get('/profile', passport.authenticate("jwt", {session: false}), (req, res, next) => {
  let response = {success: true};
  response.msg = "Profile retrieved successfuly";
  response.user = req.user;
  res.json(response);
});

router.post('/meet',function(req, res){
  console.log("apu data 1 - - - "+JSON.stringify(req.body))

  var newdata = {
  }

  if(req.body.timeF){
    newdata['timeF'] =  req.body.timeF;
  }
  if(req.body.timeF){
    newdata['timeT'] =  req.body.timeT;
  }
  if(req.body.timeF){
    newdata['pickupLng'] =  req.body.pickupLng;
  }
  if(req.body.timeF){
    newdata['pickupLat'] =  req.body.pickupLat;
  }

  User.updateOne({email:req.body.email}, {geometry:{"coordinates":[parseFloat(req.body.pickupLng),parseFloat(req.body.pickupLat)]}}, {rank: '10000'}, function (err, user) {
    if (err) return res.status(500).send("There was a problem updating the user.");
});

  User.updateOne({email:req.body.email},newdata,{upsert: true}).then(doc=>{
    console.log("succss - "+JSON.stringify(doc))
    return res.status(201).json(doc);
  })     
})

router.post('/registerdetails',function(req, res){
  console.log("apu data 0 - - - "+JSON.stringify(req.body))

  var newdata = {
          fullname: req.body.fullname,
          gender: req.body.gender,
          date_of_birth:req.body.dob,
          message: req.body.self_description,
          telephone:req.body.telephone,
          interest:req.body.interest,
          image:req.body.image,
          myProf:req.body.myProf,
          intProf:req.body.intProf,
          creation_dt: Date.now()
  }

  User.updateOne({email:req.body.email},newdata,{upsert: true}).then(doc=>{
    console.log("succss - "+JSON.stringify(doc))
    return res.status(201).json(doc);
  })     
})

// router.get('/all',  (req, res, next) => {
//   User.getUsers()
//     .then(users => {
//       let response = {
//         success: true,
//         users: users
//       };
//       return res.json(response);
//     })
//     .catch(err => {
//       log.err('mongo', 'failed to get users', err.message || err);
//       return next(new Error('Failed to get users'));
//     });
// });

router.get('/all',  passport.authenticate("jwt", {session: false}), (req, res, next) => {
  let usr = [];
  User.find({_id: req.user.id})
    .then(user => {
      console.log(user[0].pickupLat);
      console.log(user[0].pickupLng);
      User.geoNear(
          {type: 'Point', coordinates: [parseFloat(user[0].pickupLng), parseFloat(user[0].pickupLat)]},
          {maxDistance: 1000, spherical: true}
      // User.aggregate([
      //   {
      //     $geoNear: {
      //       near: {
      //         type: 'Point', coordinates: [parseFloat(users[0].pickupLng), parseFloat(users[0].pickupLat)]
      //       },
      //       maxDistance: 1000,
      //       spherical: true
      //     }
      //   }
      // ],
      // { cursor:{} }
      ).then(function(users){
        for(var u of users){
          usr.push(u.obj._id);
        }
        console.log(usr);
        console.log(new Date(user[0].timeF));
        console.log(new Date(user[0].timeT));
        // res.status(200).send(users);
        User.find(
          {$and : [{ _id: { "$in" : usr}, interest: { "$in" : user[0].interest}, myProf: user[0].intProf }, 
          {$or: [ 
            { timeF : { $lte: new Date(user[0].timeF) }, timeT : { $gte: new Date(user[0].timeF) } },
            { timeF : { $lte: new Date(user[0].timeT) }, timeT : { $gte: new Date(user[0].timeT) } },
            { timeF : { $gte: new Date(user[0].timeF) }, timeT : { $lte: new Date(user[0].timeT) } }
          ]}]
        }
        ).then(users => {
          //console.log(users)
          let response = {
            success: true,
            users: users
          };
          res.status(200).send(response);
        })
      }).catch(next);
    })
    .catch(err => {
      log.err('mongo', 'failed to get users', err.message || err);
      return next(new Error('Failed to get users'));
    });

});

router.get('/accept/:id/:username',  passport.authenticate('jwt', { session: false }), (req, res, next) => {
  User.update({_id: req.user.id}, { $pull: { "requests": {
      username: req.params.username
  } } }).then(users => {
    let response = {
      success: true,
      users: users
    };
    console.log(response);
  })
  User.update({_id: req.params.id}, { $push: { "friends": {
      _id: req.user.id,
      username: req.user.username
  } } })
    .then(users => {
      let response = {
        success: true,
        users: users
      };
      return res.json(response);
    })
    .catch(err => {
      log.err('mongo', 'failed to get users', err.message || err);
      return next(new Error('Failed to get users'));
    });
  User.update({_id: req.user.id}, { $push: { "friends": {
      _id: req.params.id,
      username: req.params.username
  } } })
    .then(users => {
      let response = {
        success: true,
        users: users
      };
      return res.json(response);
    })
    .catch(err => {
      log.err('mongo', 'failed to get users', err.message || err);
      return next(new Error('Failed to get users'));
    });
});

router.get('/request/:id/:username',  passport.authenticate('jwt', { session: false }), (req, res, next) => {
  User.update({_id: req.params.id}, { $pull: { "requests": {
      _id: req.user.id,
      username: req.user.username
  } } }).then(users => {
    let response = {
      success: true,
      users: users
    };
    console.log(response);
  })
  .catch(err => {
    log.err('mongo', 'failed to get users', err.message || err);
    return next(new Error('Failed to get users'));
  });
  User.update({_id: req.params.id}, { $push: { "requests": {
    _id: req.user.id,
    username: req.user.username
  } } })
    .then(users => {
      let response = {
        success: true,
        users: users
      };
      return res.json(response);
    })
    .catch(err => {
      log.err('mongo', 'failed to get users', err.message || err);
      return next(new Error('Failed to get users'));
    });
});

// user list
router.get('/',  passport.authenticate('jwt', { session: false }), (req, res, next) => {
  User.find({_id: req.user.id})
    .then(users => {
      //console.log('a00');
      let response = {
        success: true,
        users: users
      };
      return res.json(response);
    })
    .catch(err => {
      log.err('mongo', 'failed to get users', err.message || err);
      return next(new Error('Failed to get users'));
    });
});

module.exports = router;
