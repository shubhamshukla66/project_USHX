const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const RehabPackageSchema = new Schema({            
    name: { type: String, required: false, trim: true},
    pdfFile: { type: String, required: true, trim: true},  
    
    deleted: { type: Boolean, default: false, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
},{timestamps:true});

module.exports = mongoose.model('RehabPackage', RehabPackageSchema);