const mongoose = require('mongoose');

//schema setup
const campgroundSchema = new mongoose.Schema({
    name:  String,
    price: String,
    image: String,
    imageId: String,
    description: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    comments:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'Comment'
        }
    ],
    author: {
                id: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User'
                    },
                username: String
            }
});
//schema object
module.exports =  mongoose.model('Campground', campgroundSchema);



//this is for adding camps to the db after clearing the db
// Campground.create({name: 'camp2',
//                     image:'https://farm8.staticflickr.com/7252/7626464792_3e68c2a6a5.jpg',
//                     desc: 'Camp desc 12jljl'}, 
//     (err, camp)=>{
//         if(err){
//             console.log(err);
//         }else{
//             console.log('Created: '+ camp);
//         }
// })