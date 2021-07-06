const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const ProjectSchema = new Schema({    
    name: { type: String, required: true, trim: true},
    description: { type: String, default:"Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quos vero laborum at reprehenderit deleniti commodi dicta. Rerum porro officia beatae eveniet? Excepturi, quis iure doloribus voluptate porro consectetur assumenda itaque", trim: true},
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    affiliate: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    constructionManager: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    loanOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    realtor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    accountExec: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    phases: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Phase' }],
    jobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
    
    messages: [{type: mongoose.Schema.Types.ObjectId, ref: 'Message'}], 
    members: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    status: {type:String, default:"active", trim:true},
    deleted: { type: Boolean, default: false, trim: true }        
},{timestamps:true});

module.exports = mongoose.model('Project', ProjectSchema);