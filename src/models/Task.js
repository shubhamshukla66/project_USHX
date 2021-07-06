const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const TaskSchema = new Schema({
    title:{ type: String, required: false, trim: true},
    isComplete:{ type: Boolean, default: false, trim: true},
    completedOn:{ type: Date, required:false, trim: true},
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    taskDescription:{ type: String, required: false, trim: true, default: '{{empty}}' },
    contractorComplete: { type: Boolean, default: false, trim: true },
    managerComplete: { type: Boolean, default: false, trim: true },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

},{timestamps:true});

module.exports = mongoose.model('Task', TaskSchema);