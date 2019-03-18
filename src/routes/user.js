const express= require('express'),
router= express.Router(),
passport = require('passport'),
User = require('../models/user'),
Campground = require('../models/campground'),
middleware = require('../middleware'),
async = require('async'),
nodemailer = require('nodemailer'),
crypto = require('crypto'); 

//user routes:  /user


// show user
router.get('/:id', middleware.UserNotNull, (req,res)=>{
    User.findById(req.params.id, (err, foundUser)=>{
        if(err || !foundUser){
            console.log(err);
            req.flash('error', 'User does not exsit');
            res.redirect('/campgrounds')
        }else{
            Campground.find()
                      .where('author.id')
                      .equals(foundUser._id)
                      .exec((err, foundCamps)=>{
                if(err){
                    console.log(err);
                    req.flash('error', 'An issue occured with the Camps');
                    res.redirect('/campgrounds');
                }else{
                    res.render('user/show', {user: foundUser, campgrounds: foundCamps});
                }
            }) 
        }
    })
});

// show edit route
router.get('/:id/edit', middleware.UserNotNull, (req,res)=>{
    User.findById(req.params.id ,(err, foundUser)=>{
        if(err){
            console.log(err);
            req.flash('error', 'Error finding user');
            res.redirect('back');
        }else{
            res.render('user/edit', {user: foundUser});
        }
    })
});

//update route
router.put('/:id', middleware.UserNotNull,(req,res)=>{
    User.findByIdAndUpdate(req.params.id,
                           req.body.user,
                           (err, updatedUser)=>{
        if(err){
            console.log(err);
            req.flash('error', 'Error updating user');
            res.redirect('back');
        }else{
            res.redirect('/user/'+updatedUser._id);
        }
    })
});


//get password reset
router.get('/:id/reset', 
           middleware.UserNotNull,
           middleware.UserEmailNotNull,
           (req, res)=>{
    User.findById(req.params.id, (err, foundUser)=>{
        if(err){
            console.log(err);
            req.flash('error', 'error getting password reset');
            res.redirect('back');
        }else{

            let token;
            async.waterfall([
                function(done) {
                  crypto.randomBytes(20, function(err, buf) {
                    token = buf.toString('hex');
                    done(err, token);
                  });
                },
                function(token, done) {
                    if (!foundUser) {
                      req.flash('error', 'No account with that email address exists.');
                      return res.redirect('/user/'+foundUser._id);
                    }
                    foundUser.resetPasswordToken = token;
                    foundUser.resetPasswordExpires = Date.now() + 1800000; // 30 mins
            
                    foundUser.save(function(err) {
                      done(err, token, foundUser);
                    });
                },
                function(token, user, done) {
                  let smtpTransport = nodemailer.createTransport({
                    service: 'Gmail', 
                    auth: {
                      user:process.env.GMAILUSER,
                      pass:process.env.GMAILPASS
                    }
                  });
                  let mailOptions = {
                    to: user.email,
                    from: process.env.GMAILUSER,
                    subject: 'Node.js Password Reset',
                    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                      'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                      'http://' + req.headers.host + '/user/reset/' + token + '\n\n' +
                      'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                  };
                  smtpTransport.sendMail(mailOptions, function(err) {
                    console.log('mail sent');
                    req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                    done(err, 'done');
                  });
                }
              ], function(err) {
                if (err){
                  return next(err);
                } 
                res.redirect('/forgot');
            });


            //res.render('user/reset', {user: foundUser});
            req.flash('success', 'An email has been sent to your account\'s email address');
            res.redirect('back');
        }
    })
});

//get password reset form with link from email
router.get('/reset/:token', (req, res)=>{
    User.findOne({ 
        resetPasswordToken: req.params.token, 
        resetPasswordExpires: { $gt: Date.now() } 
    }, (err, user)=> {
            if(err || !user){
                req.flash('error', 'Password reset or token is invalid or expired');
                return res.redirect('/campgrounds');
            }else{
                res.render('user/reset', {token: req.params.token});
            }
        })
});

router.post('/reset/:token', (req,res)=>{
    async.waterfall([
        function(done) {
          User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user)=> {
            if (err||!user) {
              req.flash('error', 'Password reset token is invalid or has expired.');
              return res.redirect('back');
            }
            if(req.body.password === req.body.confirm) {
              user.setPassword(req.body.password, function(err) {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
    
                user.save(function(err) {
                  req.logIn(user, function(err) {
                    done(err, user);
                  });
                });
              })
            } else {
                req.flash("error", "Passwords do not match.");
                return res.redirect('back');
            }
          });
        },
        function(user, done) {
          var smtpTransport = nodemailer.createTransport({
            service: 'Gmail', 
            auth: {
              user: process.env.GMAILUSER,
              pass: process.env.GMAILPASS
            }
          });
          var mailOptions = {
            to: user.email,
            from: process.env.GMAILUSER,
            subject: 'Your password has been changed',
            text: 'Hello,\n\n' +
              'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
          };
          smtpTransport.sendMail(mailOptions, function(err) {
            req.flash('success', 'Success! Your password has been changed.');
            done(err);
          });
        }
      ], function(err) {
        res.redirect('/campgrounds');
    });
});

module.exports = router;