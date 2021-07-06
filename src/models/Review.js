const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const ReviewSchema = new Schema({        
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: { type: String, required: false, trim: true},
    rating: { type: Number, required: true, trim: true},  
    
    deleted: { type: Boolean, default: false, trim: true },
    createdOn: { type: Date, default: new Date(), trim: true }
});

module.exports = mongoose.model('Review', ReviewSchema);