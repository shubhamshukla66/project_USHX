const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const CheckinLogSchema = new Schema({    
    checkIn: { type: Number, required: false, trim: true},
    checkOut: { type: Number, required: false, trim: true},
    from: { type: String, default: 'user', trim: true},
    worker: { type: Object, default: {}, trim: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    project:{type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
    job:{type: mongoose.Schema.Types.ObjectId, ref: 'Job'},
    isCheckedIn: { type: Boolean, default: false, trim: true },
    deleted: { type: Boolean, default: false, trim: true }
},{timestamps:true})

module.exports = mongoose.model('CheckinLog', CheckinLogSchema);