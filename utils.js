const jwt = require("jsonwebtoken");
const config = require("./config/constants");
const Request = require("request");
const crypto = require("crypto");
const User = require("./src/models/User");

// create result
function createResult(error, data, count) {
  const result = {};
  if (error == null || error == undefined) {
    result["status"] = "success";
    result["data"] = data;
    result["count"] = count;
    result["pageSize"] = config.pageSize;
    if (count) result["pages"] = getPages(count);
  } else {
    result["status"] = "error";
    if (typeof error == "string") {
      result["error"] = error;
    } else {
      result["error"] = `error occured: ${error}`;
    }
  }

  return result;
}

// create error
function createError(message) {
  return createResult(message, message);
}

// create success message
function createSuccess(message) {
  return createResult(null, message);
}

// get pages
function getPages(count) {
  return Math.ceil(count / config.pageSize);
}

function authorize(request, response, next) {
  const token = request.headers["X-Auth-Token"];
  let result = {};
  if (token != undefined) {
    try {
      const data = jwt.verify(token, config.secret);
      result = createResult(null, data);
      next();
    } catch (ex) {
      result = createError("Invalid token");
    }
  } else {
    result = createError("Token missing");
  }

  response.send(result);
}

function createDate(year, month, day) {
  return "";
}

function parseDate(strDate) {
  const parts = strDate.split("-");
  console.log(parts);
  const date = new Date(
    new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
  );
  console.log(date);
  return date;
}

function parseTime(strDate, strTime) {
  const dateParts = strDate.split("-");
  const timeParts = strTime.split(":");
  const timestamp = new Date(
    parseInt(dateParts[0]),
    parseInt(dateParts[1]) - 1,
    parseInt(dateParts[2]),
    parseInt(timeParts[0]),
    parseInt(timeParts[1])
  );
  const date = new Date(timestamp);
  return date;
}

function randomString(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let randomstring = "";
  for (let i = 0; i < length; i++) {
    const rnum = Math.floor(Math.random() * chars.length);
    randomstring += chars.substring(rnum, rnum + 1);
  }
  return randomstring;
}

function randomNumber(length = 6) {
  const chars = "0123456789";
  let randomstring = "";
  for (let i = 0; i < length; i++) {
    const rnum = Math.floor(Math.random() * chars.length);
    randomstring += chars.substring(rnum, rnum + 1);
  }
  return randomstring;
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    Request(url, (error, response, body) => {
      if (error) {
        reject(error);
      }
      resolve(JSON.parse(body));
    });
  });
}

function makePostRequest(url, body) {
  return new Promise((resolve, reject) => {
    var postheaders = {
      "Content-Type": "application/json",
    };
    const options = {
      url: url,
      body: body,
      json: true,
      method: "POST",
      headers: postheaders,
    };
    Request(options, (error, response, body) => {
      if (error) {
        reject(error);
      }
      console.log(body);
      resolve(body);
    });
  });
}

function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

function genUuid() {
  return uuidFromBytes(crypto.randomBytes(16));
}

function uuidFromBytes(rnd) {
  rnd[6] = (rnd[6] & 0x0f) | 0x40;
  rnd[8] = (rnd[8] & 0x3f) | 0x80;
  rnd = rnd.toString("hex").match(/(.{8})(.{4})(.{4})(.{4})(.{12})/);
  rnd.shift();
  return rnd.join("-");
}

async function getUserPhone(userId) {
  let user = await User.findById(userId).populate({
    path: "borrowerProfile sellerProfile contractorProfile",
    select: "phone",
  });
  let phone;
  if (user.borrowerProfile && user.borrowerProfile.phone) {
    phone = user.borrowerProfile.phone;
  } else if (user.sellerProfile && user.sellerProfile.phone) {
    phone = user.sellerProfile.phone;
  } else if (user.contractorProfile && user.contractorProfile.phone) {
    phone = user.contractorProfile.phone;
  }

  return phone;
}

async function validateUserApproved(request, response, next) {
  let user = await User.findOne({ _id: request.userId, deleted: false });
  if (user && user.approved) next();
  else return response.send(createError("User Application Not Approved"));
}

async function sendWebNotifications(title, body, clickUrl, users, clients, io) {
  console.log("sendWebNotifications(title,body,clickUrl,users,clients)");
  users.push("5f7ef083729fb546fbdd711d"); //added admin
  users.forEach(function (user) {
    //check from the hashmap that is user was connect to socket or not
    let socketId = clients.search(user);

    //if connected
    if (socketId) {
      //get socket id and emit the change and pass room object
      io.sockets.to(socketId).emit("webpushmessage", { title, body, clickUrl });
      console.log("webpushmessage", { user, socketId });
    } else {
      console.log("failed", { user });
      //if not
      //notify user with firebase cloud messaging
      //cloudMessage.unreadMessage(foundedRoom.last_msg_id, user.fcm_key);
    }
  });
}
module.exports = {
  createResult: createResult,
  createError: createError,
  createSuccess: createSuccess,
  authorize: authorize,
  parseDate: parseDate,
  parseTime: parseTime,
  randomString: randomString,
  randomNumber: randomNumber,
  makeRequest: makeRequest,
  makePostRequest: makePostRequest,
  getPageCount: getPages,
  validateEmail: validateEmail,
  genUuid: genUuid,
  getUserPhone: getUserPhone,
  validateUserApproved: validateUserApproved,
  sendWebNotifications: sendWebNotifications,
};
