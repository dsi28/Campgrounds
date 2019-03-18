const express= require('express'),
router= express.Router(),
passport = require('passport'),
User = require('../models/user');

//root route
router.get('/',(req, res)=>{
    res.render('landing');
});

//show register form route
router.get('/register',(req,res)=>{
    res.render('auth/register');
})

//handle register request
router.post('/register', (req,res)=>{
    if(req.body.admin != 'true'){
        req.body.admin=false;
    }
    User.register(new User({
        username: req.body.username,
        isAdmin:  req.body.admin,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        avatar: req.body.avatar,
        email: req.body.email
    }), req.body.password, 
    (err, newUser)=>{
        if(err){
            console.log(err);
            req.flash('error', err.message)
            return res.redirect('/register');
        }else{
            passport.authenticate('local')(req,res,()=>{
                req.flash('success', 'Welcome to YelpCamp '+ newUser.username)
                res.redirect('/campgrounds')
            })
        }
    })
})

//login form
router.get('/login',(req,res)=>{
    res.render('auth/login');
})
//log in validation
router.post('/login', 
passport.authenticate('local',
{
    successRedirect: '/campgrounds',
    failureRedirect: '/login',
    successFlash: "Welcome back to YelpCamp!",
    failureFlash: true
}), 
(req,res)=>{
});

//log out route
router.get('/logout',(req,res)=>{
    req.logout();
    req.flash('success', 'You have been logged out...')
    res.redirect('/campgrounds');
});

module.exports = router;