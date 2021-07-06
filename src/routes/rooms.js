const {Room} = require('../models/chatRoom')
const {Message, MessageType, EventType, ReadStatus} = require('../models/chatMessage')
const response = require('./response');

//create new room
exports.createRoom = async function (req, res) {
    //get users
    let users = req.body.users && req.body.users.split(',');
    // push the current user into user list
    users.push(req.user._id);
    //remove duplicate items
    let uniqueList = [...new Set(users)];
    //create room model
    let room = new Room({users: uniqueList,name:req.body.name, admin: req.userId});
    //check if there is room with this info
    let foundRoom = await Room.findOne({
        admin: req.user._id,
        users: uniqueList
    }).populate("users", '_id name username avatar last_seen', {
        _id: {
            $ne: req.user._id //except the current user
        }
    }).populate("last_msg_id").populate({
        path: 'last_msg_id',
        populate: {path: 'from'}
    }).populate("admin", '_id name username avatar last_seen');

    //check : if there is no room
    if (!foundRoom) {

        //create default message for first creation of room
        let createdMessage = new Message({room: room._id, content: "Room created", event_type: EventType.SERVER});
        createdMessage.save();

        //set the message id to last message of the room
        room.last_msg_id = createdMessage._id;
        await room.save(async function (err) {
            if (err) {
                //if there is error during create room we throw error
                return res.status(response.STATUS_BAD_REQUEST).json(
                    response.createResponse(response.FAILED, "Failed to create room")
                );
            } else {
                //if create room was successful we get it from database and populate users,last_msg_id and admin
                let roomCreated = await Room.findOne(room._id).populate("users", '_id name username avatar last_seen', {
                    _id: {
                        $ne: req.user._id //except current user
                    }
                }).populate("last_msg_id").populate("admin", '_id name username avatar last_seen');

                //if we get data we return to user
                if (roomCreated) {
                    return res.status(response.STATUS_OK).json(
                        response.createResponse(response.SUCCESS, "Success", {room: roomCreated})
                    );
                } else { // and if there is error to get data we return it with error
                    return res.status(response.STATUS_OK).json(
                        response.createResponse(response.SUCCESS, "Room created but failed to get data")
                    );
                }

            }
        })
    } else {
        //check : in there is a room return the exiting room
        return res.status(response.STATUS_OK).json(
            response.createResponse(response.SUCCESS, "already exist", {room: foundRoom})
        );
    }


};

//get all users room
exports.getRooms = async function (req, res) {
    try {
        //get room from database
        let foundRoom = await Room.find({"users": {"$in": req.user._id}}).populate("users", '_id name username avatar last_seen', {
            _id: {
                $ne: req.user._id //except the current user
            }
        }).populate("last_msg_id").populate({
            //we need to know that who is the sender of the last message and we need to populate it
            path: 'last_msg_id',
            populate: {path: 'from'}
        }).populate("admin", '_id name username avatar last_seen');
        return res.status(response.STATUS_OK).json(
            response.createResponse(response.SUCCESS, "Success", {rooms: foundRoom}, foundRoom.length)
        );
    } catch (e) {
        return res.status(response.SERVER_ERROR).json(
            response.createResponse(response.ERROR, e)
        );
    }
};

//get single room
exports.getRoom = async function (req, res) {
    try {
        //get id from parameters
        let id = req.params.room;

        /*we call this function when user open a room ,so that mean user seen the message and we need to update all of the
        message in this room and set to seen*/
        await Message.updateMany({room: id}, {read_status: ReadStatus.READ}, {multi: true});

        //get room and populate
        let foundRoom = await Room.findById(id).populate("users", '_id name username avatar last_seen', {
            _id: {
                $ne: req.user._id //except the current user
            }
        }).populate("last_msg_id").populate({
            path: 'last_msg_id',
            populate: {path: 'from'}
        }).populate("admin", '_id name username avatar last_seen');

        //get all message from this room
        let roomMessages = await Message.find({room: foundRoom.id})
            .populate('from', '_id name username avatar last_seen')

        return res.status(response.STATUS_OK).json(
            response.createResponse(response.SUCCESS, "Success", {
                room: foundRoom,
                messages: roomMessages
            }, foundRoom.length)
        );

    } catch (e) {
        return res.status(response.SERVER_ERROR).json(
            response.createResponse(response.ERROR, e)
        );
    }
};
