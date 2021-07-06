const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const PhaseSchema = new Schema({    
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', trim:true },
    name: { type: String, default: '', trim: true},

    status: {type:String, default:"active", trim:true},
    isCompelete: { type: Boolean, default: false, trim: true },
    deleted: { type: Boolean, default: false, trim: true }
},{timestamps:true})

module.exports = mongoose.model('Phase', PhaseSchema);