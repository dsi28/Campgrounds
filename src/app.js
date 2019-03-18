require('dotenv').config();

const express = require('express'),
      app = express(),
      bodyparser= require('body-parser'),
      mongoose = require('mongoose'),
      Campground= require('./models/campground'),
      Comment=require('./models/comment'),
      seedDB = require('./seeds');
      passport = require('passport'),
      LocalStrategy = require('passport-local'),
      User = require('./models/user'),
      methodOverride = require('method-override'),
      flash = require('connect-flash');

//route files
const campgroundRoutes = require('./routes/campgrounds'),
      commentRoutes = require('./routes/comments'),
      indexRoutes = require('./routes/index'),
      userRoutes = require('./routes/user');



//seedDB(); //seed db
app.use(methodOverride('_method'));
app.set('view engine','ejs');
app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static(__dirname+'/public'));
app.use(flash());
mongoose.connect('mongodb://localhost:27017/yelp_camp', { useNewUrlParser: true });

//moment config
app.locals.moment = require('moment');

//passport config
app.use(require('express-session')({
    secret: 'Secret Code',
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.currentUser=req.user; //adds req.user to all routes
    res.locals.error=req.flash('error');
    res.locals.success=req.flash('success');
    next();
})

app.use(indexRoutes);
app.use('/campgrounds',campgroundRoutes); //by adding /campgrounds that the begining then in the routing file the /campgrounds has to be removed
app.use('/campgrounds/:id/comments/', commentRoutes);
app.use('/user', userRoutes);

app.listen(3000, ()=>{console.log('Yelp Camp started...')})