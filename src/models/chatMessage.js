
const mongoose = require('mongoose')
const Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

const MessageType = {
    TEXT: 0,
    PICTURE: 1,
    AUDIO: 2,
    VIDEO: 3,
};

const EventType = {
    MESSAGE: 0,
    JOIN: 1,
    SERVER: 2,
    TYPING: 3
};

const ReadStatus = {
    FAILED: 0,
    SENT: 1,
    READ: 2,
};

// create a schema
let messageSchema = new Schema({
    //generate autoincrement id
    index: {type: String, unique: true},
    //user who send message
    from: {type: ObjectId, ref: "User", default: null},
    //user who send message
    admin: {type: ObjectId, ref: "Admin", default: null},
    //in which room message sent
    project: {type: ObjectId, ref: "Project", default: null},
    //the content of the message
    content: {type: String, trim: true, default: '(empty)'},
    //type of the message it can be image , text
    content_type: {type: Number, required: true, default: MessageType.TEXT},
    //the type of the event it can be message , join , typing
    event_type: {type: Number, required: true, default: EventType.MESSAGE},
    //use for checking message status , we can use it for check that user is read message or not
    read_status: {type: Number, required: true, default: ReadStatus.SENT},

    read_by: [{
                fullName:{type: String, trim: true, default: ''},
                image: {type: String, trim: true, default: 'user.png'},
                // readAt: {type: Number, trim: true, default: Date.now()}
                }],

    timelog: {type: Number, required: true, default: new Date().getTime()},
    
    deleted: {type:Boolean, default:false,trim:true}
},{timestamps:true});

messageSchema.pre('save', async function (next) {
    //get the count of the message document
    let count = await Message.countDocuments({});
    // and +1 for unique id
    this.index = count + 1;
   
    next();
});

// the schema is useless so far
// we need to create a model using it
let Message = mongoose.model('Message', messageSchema);

// make this available to our users in our Node applications
module.exports = {Message, MessageType, EventType,ReadStatus};