const mongoose = require('mongoose');
 //storing oonly the important attribute of a user in the comment schema instead off linking the whole object
const commentSchema= mongoose.Schema({
    text:String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    author: {   id: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User'
                    },
                username: String 
            }
});

module.exports= mongoose.model('Comment', commentSchema);