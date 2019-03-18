const express= require('express'),
router= express.Router({mergeParams: true}), ////since the route no longer includes :id in the requier statement for router you must specify  {mergeParms: true}
Campground= require('../models/campground'),
Comment = require('../models/comment'),
middleware = require('../middleware'); //no need to specfiy file name since filename is index

            //routes comments /campgrounds/:id/comments/
//comments new
router.get('/new', middleware.IsLoggedIn, middleware.CampgroundNotNull,(req,res)=>{ //before /campgrounds/:id/comments/new now /new since /campgrounds/:id/comments/ was specifed in the app.js file
    //since the route no longer includes :id in the requier statement for router you must specify  {mergeParms: true}
    Campground.findById(req.params.id,(err, foundCamp)=>{
        if(err){
            console.log(err);
        }else {
            res.render('comments/new', {campground:foundCamp});
        }
    })
})

//comments create
router.post('/', middleware.IsLoggedIn, middleware.CampgroundNotNull, (req,res)=>{
    //find campground
    //create comment
    //add comment id to campground comment array
    //rerdirect to /campground/:id
    Campground.findById(req.params.id,(err,foundCamp)=>{
        if(err){
            req.flash('error', 'Somthing went wrong...')
            console.log(err);
        }else{
            Comment.create(req.body.comment,(err,createdComment)=>{
                //add username and id to comment
                createdComment.author.id = req.user._id;
                createdComment.author.username = req.user.username;
                //save comment
                createdComment.save();
                foundCamp.comments.push(createdComment);
                foundCamp.save();
                req.flash('success', 'Added Comment!!!')
                res.redirect('/campgrounds/'+req.params.id)
            })
        }
    })
});

//comment edit route
router.get('/:commentid/edit', middleware.CheckCommentOwnership, (req,res)=>{
    Comment.findById(req.params.commentid, (err, foundComment)=>{
        res.render('comments/edit', {comment: foundComment, campgroundid: req.params.id });
    })
});

//comment update route
router.put('/:commentid', middleware.CheckCommentOwnership, (req,res)=>{
    Comment.findByIdAndUpdate(req.params.commentid, req.body.comment, (err, updateComment)=>{
        res.redirect('/campgrounds/'+req.params.id);
    })
});

//comment.destroy route
router.delete('/:commentid', middleware.CheckCommentOwnership, (req,res)=>{
    Comment.findByIdAndRemove(req.params.commentid, (err)=>{
        req.flash('success', 'Comment Deleted')
        res.redirect('/campgrounds/'+req.params.id);
    })
})

module.exports= router;