const mongoose = require('mongoose')
let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;
const shortId = require('shortid');

let ChatType = {
    PERSONAL: 0,
    GROUP: 1,
    BROADCAST: 2
};


let RoomSchema = new Schema({
    name: {type: String, trim: true, unique: true},
    //unique code
    code: {type: String, trim: true, unique: true},
    //users of the room
    users: [{type: ObjectId, ref: 'User'}],
    //last message that sent in room
    last_msg_id: {type: ObjectId, ref: 'Message' , default:null},
    //the type of the chat , can be personal , group or broadcast
    type: {type: Number, default: ChatType.PERSONAL},
    //the admin of the room , or creator
    admin: {type: ObjectId, ref: 'User'},
    //check if room is deleted or not
    deleted: {type: Boolean, default: false}
});

RoomSchema.pre('save', async function (next) {
    //generate a unique short code
    this.code = await shortId.generate();
    next();
})

RoomSchema.pre('update', function (next) {
    this.updated_at = new Date().getTime();
    next();
})

let Room = mongoose.model('Room', RoomSchema);

module.exports = {Room, ChatType};

