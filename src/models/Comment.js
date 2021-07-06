const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    text:{ type: String, required: false, trim: true},
    type:{ type: String, required: false, trim: true},    
    image: {type: String,  required: false, trim: true},
    worker: { type: Object, default: {}, trim: true},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    from: {type: String,  default: 'user', trim: true},
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    timelog: {type: Number, required: true, default: new Date().getTime()},
},{timestamps:true});

module.exports = mongoose.model('Comment', CommentSchema);