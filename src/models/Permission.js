const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const PermissionSchema = new Schema({    
    name: { type: String, required: true, trim: true},
    deleted: { type: Boolean, default: false, trim: true }
},{timestamps:true})

module.exports = mongoose.model('Permission', PermissionSchema);