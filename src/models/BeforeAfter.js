const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const BeforeAfterSchema = new Schema({    
    before: { type: String, required: true, trim: true},
    after: { type: String, required: true, trim: true},

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },        
    deleted: { type: Boolean, default: false, trim: true }
},{timestamps:true})

module.exports = mongoose.model('BeforeAfter', BeforeAfterSchema);