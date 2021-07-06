const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const NotificationSchema = new Schema({        
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    for: { type: String, required: true, trim: true},
    title: { type: String, required: false, trim: true},
    message: { type: String, required: false, trim: true}, 
    
    action: { type: String, required: false, trim: true}, 
    actionId: { type: String, required: false, trim: true}, 
    
    deleted: { type: Boolean, default: false, trim: true },
    viewed: { type: Boolean, default: false, trim: true },
    
},{timestamps:true});

module.exports = mongoose.model('Notification', NotificationSchema);