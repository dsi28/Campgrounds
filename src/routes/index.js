const express= require('express'),
router= express.Router(),
passport = require('passport'),
User = require('../models/user');


//image file upload config
const multer = require('multer');
var storage = multer.diskStorage({
filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
}
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})
var cloudinary = require('cloudinary');
cloudinary.config({ 
cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
api_key: process.env.CLOUDINARY_API_KEY, 
api_secret: process.env.CLOUDINARY_API_SECRET
});



//root route
router.get('/',(req, res)=>{
    res.render('landing');
});

//show register form route
router.get('/register',(req,res)=>{
    res.render('auth/register');
})

//handle register request
    // create middleware to ask you to log out if logged in
router.post('/register', upload.single('avatar'), (req,res)=>{
    cloudinary.v2.uploader.upload(req.file.path, (err, result)=>{
        if(err){
            req.flash('error', err.message);
            res.redirect('back');
        } else{
            if(req.body.admin != 'true'){
                req.body.admin=false;
            }
            User.register(new User({
                username: req.body.username,
                isAdmin:  req.body.admin,
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                avatar: result.secure_url,
                imageId: result.public_id,
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