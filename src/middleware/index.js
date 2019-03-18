// all the middleare goes here
//by calling this file index.js it will be automatically included when require('/middleware'), by calling it index there is not need to specify the file in the requier statment



//create an empty object
const middlewareObj={},
      Campground = require('../models/campground'),
      Comment = require('../models/comment');

//add all the middleware functions to the empty object
middlewareObj.CheckCampgroundOwnership = (req,res,next)=>{
    //is the user logged in
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, (err,foundCamp)=>{
            if(err || !foundCamp){ //if there is an error or null campground
                console.log(err);
                req.flash('error', 'Campground not found...');
                res.redirect('/campgrounds');
            }else{
                //does the user own the campground
                if(foundCamp.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                }else{
                    req.flash('error', 'You do not have permission to do that...')
                    res.redirect('back');
                }  
            }
        })
    }else{
        req.flash('error', 'You must be logged in...')
        res.redirect('back');
    }
}

middlewareObj.CheckCommentOwnership = (req, res, next)=>{
    if(req.isAuthenticated()){
        Campground.findById(req.params.id , (err, foundCamp)=>{
            if(err || !foundCamp){
                console.log(err);
                req.flash('error', 'Campground not found...');
                res.redirect('back');
            }else{
                Comment.findById(req.params.commentid, (err, foundComment)=>{
                    if(err || !foundComment){
                        console.log(err);
                        req.flash('error', 'Comment not found...')
                        res.redirect('back');
                    }else{
                        if(foundComment.author.id.equals(req.user._id)  ||  req.user.isAdmin){
                            next();
                        }else{
                            req.flash('error', 'You do not have permission to do that...');
                            res.redirect('back');
                        }
                    }
                })
            }
        })
    }else{ 
        req.flash('error', 'You must be logged in...');
        res.redirect('back');
    }
};

middlewareObj.IsLoggedIn = (req,res,next)=>{
    if(req.isAuthenticated()){
        return next();
    }
    req.flash('error', 'You must be logged in...');
    res.redirect('/login');
};

//makes sure that campground is not null
middlewareObj.CampgroundNotNull = (req, res, next)=>{
    Campground.findById(req.params.id, (err, foundCamp)=>{
        if(err || !foundCamp){
            console.log(err);
            req.flash('error', 'Campground not found');
            res.redirect('/campgrounds');
        } else{
            return next();
        }
    })
};

middlewareObj.CommentNotNull = (req,res,next)=>{
    Comment.findById(req.params.commentid, (err, foundComment)=>{
        if(err || !foundComment){
            console.log(err);
            req.flash('error', 'Comment not found');
            res.redirect('/campgrounds/'+req.params.commentid);
        }else{
            return next();
        }
    })
};

middlewareObj.UserNotNull = (req, res, next)=>{
    User.findById(req.params.id, (err, foundUser)=>{
        if(err || !foundUser){
            console.log(err);
            req.flash('error', 'User not found');
            res.redirect('/campgrounds');
        }else{
            return next();
        }
    })
};

middlewareObj.UserEmailNotNull= (req,res,next)=>{
    User.findById(req.params.id, (err, foundUser)=>{
        if(!foundUser.email){
            res.render('user/edit', {
                'error': 'To reset password please add valid email to your account',
                user: foundUser
            });
        }else{
            return next();
        }
    })
};

//export middleware functions
module.exports= middlewareObj;