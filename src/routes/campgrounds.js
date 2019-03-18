const express= require('express'),
router= express.Router(),
Campground = require('../models/campground'),
Comment = require('../models/comment'),
middleware = require('../middleware');

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


    //routes for     /campgrounds

//get all campgrounds or campgrounds from search
router.get('/', (req, res)=>{ //before /campgrounds now / becuase /campgrounds was specified in the the app.js file
    if(req.query.search){
        let getCampParams=req.query.search;
        getCampParams = new RegExp(getCampParams.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), 'gi');
        Campground.find({name: getCampParams}, (err, seachCamps)=>{
            if(err){
                console.log(err);
            }else{
                res.render('campgrounds/index', {campSites: seachCamps});
            }
        })
    }else{
        Campground.find({}, (err, camps)=>{
            if(err){
                console.log(err);
            }else{
                res.render('campgrounds/index', {campSites: camps});
            }
        })
    }
});

//create add campground to db
router.post('/', middleware.IsLoggedIn, upload.single('image'), (req,res)=>{
    
    cloudinary.v2.uploader.upload(req.file.path, (err, result)=>{
        if(err){
            req.flash('error', err.message);
            res.redirect('back');
        }
        req.body.campground.image = result.secure_url;
        req.body.campground.imageId = result.public_id;
        req.body.campground.author = {
            id: req.user._id,
            username: req.user.username
        };
        Campground.create(req.body.campground, (err, newCampground)=>{
            if(err){
                req.flash('error',err.message);
                res.redirect('back');
            }else{
                res.redirect('/campgrounds/'+newCampground.id);
            }
        })
    })
    
    // cloudinary.uploader.upload(req.file.path, (result)=>{
    //     req.body.campground.image= result.secure_url;
    //     req.body.campground.author = {
    //         id: req.user._id,
    //         username: req.user.username
    //     }
    //     Campground.create(req.body.campground, (err, newCampground)=>{
    //         if(err){
    //             req.flash('error', err.message);
    //             res.redirect('back');
    //         }else{
    //             res.redirect('/campgrounds/'+newCampground.id);
    //         }
    //     })
    // });   
    // Campground.create({
    //     name: req.body.cname,
    //     price: req.body.cprice,
    //     image: req.body.cimage,
    //     description: req.body.cdesc,
    //     author: {
    //         id: req.user._id,
    //         username: req.user.username
    //     }

    //     }, (err, camp)=>{
    //         if(err){
    //             console.log('Erorr: ' +err);
    //             res.redirect('back');
    //         }else{
    //             //console.log(camp);
    //             res.redirect('/campgrounds/'+camp.id);     // go to /campgrounds page by redirecting not rendering!!!!!!!!
    //         }
    // });
});

//new campground
router.get('/new', middleware.IsLoggedIn, (req,res)=>{
    res.render('campgrounds/new.ejs');
});

//get campground
router.get('/:id', middleware.CampgroundNotNull, (req,res)=>{
    Campground.findById(req.params.id)
              .populate('comments')
              .exec((err, foundCamp)=>{
        if(err || !foundCamp){
            console.log(err);
            req.flash('error', 'Campground not found...');
            res.redirect('/campgrounds');
        }else{
            res.render('campgrounds/show', {campground: foundCamp});
        }
    })
})

//edit campground route
router.get('/:id/edit', middleware.CheckCampgroundOwnership, (req,res)=>{
    Campground.findById(req.params.id, (err,foundCamp)=>{
        res.render('campgrounds/edit',{campground: foundCamp});
    })
})

//update campground route
router.put('/:id', middleware.CheckCampgroundOwnership, upload.single('image'),  (req, res)=>{
    Campground.findById(req.params.id, async (err, foundCampground)=>{
        if(err){
            req.flash(err.message);
            res.redirect('back');
        }else{
            if(req.file){
                try{
                    await cloudinary.v2.uploader.destroy(foundCampground.imageId);  
                    let result = await cloudinary.v2.uploader.upload(req.file.path);
                    foundCampground.imageId= result.public_id;
                    foundCampground.image=result.secure_url;
                }catch(err){
                    console.log(err)
                    req.flash('error',err.message);
                    return res.redirect('/campgrounds');
                }
            }
            foundCampground.name = req.body.campground.name;
            foundCampground.price = req.body.campground.price;
            foundCampground.description = req.body.campground.description;
            foundCampground.save();
            req.flash('success', 'Campground Updated!');
            res.redirect('/campgrounds/'+foundCampground.id);
        }
    })
    // Campground.findByIdAndUpdate(req.params.id, req.body.campground, (err,updatedCamp)=>{
    //     res.redirect('/campgrounds/'+req.params.id)
    // })
});

//delete route
router.delete('/:id', middleware.CheckCampgroundOwnership, (req,res)=>{
    Campground.findById(req.params.id, async (err, foundCamp)=>{
        if(err){
            req.flash('error', err.message);
            res.redirect('back');
        }else{
            try{
                await cloudinary.v2.uploader.destroy(foundCamp.imageId);
                Comment.deleteMany({_id: {$in: foundCamp.comments}});
                foundCamp.remove();
                req.flash('success', 'Campground Deleted...');
                res.redirect('/campgrounds');
            }catch(err){
                req.flash('error', err.message);
                res.redirect('back');
            }
        }
    });
    // Campground.findByIdAndDelete(req.params.id, (err,deletedCamp)=>{
    //     if(err){
    //         console.log(err);
    //     }else{
    //         Comment.deleteMany({_id: {$in: deletedCamp.comments}}, (err, foundComment)=>{
    //             if(err){
    //                 console.log(err);
    //             }
    //             res.redirect('/campgrounds');
    //         })
    //     }
    // })
});

module.exports= router;