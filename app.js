const mongoose = require("mongoose");
const express = require("express");
const http = require("http");
const path = require("path");
const logger = require("morgan");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const dbConfig = require("./config/database");
const config = require("./config/constants");
const s3Config = require("./config/s3");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const HashMap = require("hashmap");
const User = require("./src/models/User");
var AWS = require("aws-sdk");
var s3ImageUploadLocalToPublic = require('./src/routes/s3ImageUploadLocalToPublic');

const indexRouter = require("./src/routes/index");
const adminRouter = require("./src/routes/admin");
const notificationsRouter = require("./src/routes/notifications");
const permissionsRouter = require("./src/routes/permissions");
const rolesRouter = require("./src/routes/roles");
const projectsRouter = require("./src/routes/projects");
const rehabPackagesRouter = require("./src/routes/rehabPackages");
const projectsV2Router = require("./src/routes/projects_v2");
const scheduleRouter = require("./src/routes/propertySchedule");
const usersRouter = require("./src/routes/users");
const messagesRouter = require("./src/routes/messages");
const roomsRouter = require("./src/routes/rooms");

const app = express();
app.use(cors());
app.options("*", cors());

app.use((request, response, next) => {
  console.log(
    "------------------------------- New Request ------------------------------------"
  );
  console.log(new Date());
  console.log("For Path: ", request.url);
  if (
    request.url.toLowerCase().startsWith("/app") ||
    !request.url.toLowerCase().startsWith("/api") ||
    request.url.toLowerCase().startsWith("/api/v1/user/socialauth/") ||
    request.url.toLowerCase().startsWith("/api/v1/user/checkusername/") ||
    request.url.toLowerCase().startsWith("/api/v1/user/property/details") ||
    request.url
      .toLowerCase()
      .startsWith("/api/v1/admin/property/before/after/") ||
    request.url.toLowerCase() === "/api/v1/messages" ||
    request.url.toLowerCase() === "/api/v1/contact/email" ||
    request.url.toLowerCase() === "/api/v1/investor/questions" ||
    request.url.toLowerCase() === "/api/v1/contact/email/otp" ||
    request.url.toLowerCase() === "/api/v1/admin/login" ||
    request.url.toLowerCase() === "/api/v1/admin/register" ||
    request.url.toLowerCase() ===
    "/api/v1/admin/property/before/after/getall" ||
    request.url.toLowerCase() === "/api/v1/property/list" ||
    request.url.toLowerCase() === "/api/v1/user/login" ||
    request.url.toLowerCase() === "/api/v1/user/register" ||
    request.url.toLowerCase() === "/api/v1/user/buyer/register" ||
    request.url.toLowerCase() === "/api/v1/user/seller/register" ||
    request.url.toLowerCase() === "/api/v1/user/affiliate/register" ||
    request.url.toLowerCase() === "/api/v1/user/contractor/register" ||
    request.url.toLowerCase() === "/api/v1/user/verify-otp" ||
    request.url.toLowerCase() === "/api/v1/user/forgot-password" ||
    request.url.toLowerCase() === "/api/v1/user/reset-password" ||
    request.url.toLowerCase().startsWith("/api/v2/user/socialauth/") ||
    request.url.toLowerCase().startsWith("/api/v2/user/checkusername/") ||
    request.url.toLowerCase().startsWith("/api/v2/user/property/details") ||
    request.url
      .toLowerCase()
      .startsWith("/api/v2/admin/property/before/after/") ||
    request.url.toLowerCase() === "/api/v2/messages" ||
    request.url.toLowerCase() === "/api/v2/contact/email" ||
    request.url.toLowerCase() === "/api/v2/investor/questions" ||
    request.url.toLowerCase() === "/api/v2/contact/email/otp" ||
    request.url.toLowerCase() === "/api/v2/admin/login-new" ||
    request.url.toLowerCase() === "/api/v2/admin/login" ||
    request.url.toLowerCase() === "/api/v2/admin/register" ||
    request.url.toLowerCase() ===
    "/api/v2/admin/property/before/after/getall" ||
    request.url.toLowerCase() === "/api/v2/property/list" ||
    request.url.toLowerCase().startsWith("/api/v2/project/worker/job/") ||
    request.url.toLowerCase() === "/api/v2/user/login" ||
    request.url.toLowerCase() === "/api/v2/user/register" ||
    request.url.toLowerCase() === "/api/v2/user/buyer/register" ||
    request.url.toLowerCase() === "/api/v2/user/seller/register" ||
    request.url.toLowerCase() === "/api/v2/user/affiliate/register" ||
    request.url.toLowerCase() === "/api/v2/user/contractor/register" ||
    request.url.toLowerCase() === "/api/v2/user/woymingllc/register" ||
    request.url.toLowerCase() === "/api/v2/user/verify-otp" ||
    request.url.toLowerCase() === "/api/v2/user/forgot-password" ||
    request.url.toLowerCase() === "/api/v2/user/reset-password"
  ) {
    const token = request.headers["token"];
    console.log("token:", token);
    console.log("Login ====>", request.url.toLowerCase())
    if (token) {
      try {
        const data = jwt.verify(token, config.secret);
        console.log(data);
        request.user = { _id: data.id };
        request.userId = data.id;
        request.email = data.email;
        request.role = data.role || "";
        next();
      } catch (ex) {
        response.status(401);
        response.send("invalid token");
      }
    } else {
      next();
    }
  } else if (!request.url.toLowerCase().startsWith("/api")) {
    next();
  } else {
    const token = request.headers["token"];
    console.log("token:", token);
    if (token == undefined) {
      response.status(403);
      response.send("unauthorized");
      return;
    } else {
      try {
        const data = jwt.verify(token, config.secret);
        console.log(data);
        request.user = { _id: data.id };
        request.userId = data.id;
        request.email = data.email;
        request.role = data.role || "";
        next();
      } catch (ex) {
        response.status(401);
        response.send("invalid token");
      }
    }
  }
});

AWS.config.update(s3Config);

mongoose.connect(dbConfig, {
  useFindAndModify: false,
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

app.use(logger("dev"));
app.use(express.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
    parameterLimit: 50000,
  })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use((request, response, next) => {
  const size = config.pageSize;
  request.pagination = {};
  let page = 1;
  if (request.query.page) {
    page = parseInt(request.query.page);
  }
  request.pagination.skip = size * (page - 1);
  request.pagination.limit = size;
  console.log("request.pagination", request.pagination);
  console.log("request.body", request.body);
  console.log("request.params", request.params);
  next();
});

// /* For https */
const https = require("https");
// fs = require("fs"); //already using fs

/*  */
// const options = {
//   key: fs.readFileSync("/etc/letsencrypt/live/ushousingexchange.com/privkey.pem"),
//   cert: fs.readFileSync("/etc/letsencrypt/live/ushousingexchange.com/fullchain.pem")
// };

var server = http.Server(app); //For Http
// var server = https.createServer(options, app); /* For Https */
var io = require("socket.io")(server);
let clients = new HashMap(); // to store online users

app.use(function (req, res, next) {
  res.io = io;
  res.connectedClients = clients;
  next();
});

io.use(async (socket, next) => {
  try {
    //   console.log("io.use()")
    //check to see if there is such a user?
    // console.log({access_token: socket.handshake.query.public_key},socket,socket.handshake,socket.handshake.query)
    // console.log(socket)
    // console.warn(socket.handshake)

    let user = await User.findOne({
      access_token: socket.handshake.query.public_key,
    });
    // console.info(socket.handshake.query.public_key,{user})
    if (user) {
      //exist : store user to hashmap and next()
      clients.set(socket.id, user._id.toString());
      //console.log("clients",clients.size)
      await User.findByIdAndUpdate(user._id, { last_seen: 0 });
      return next();
    } else {
      //not exist: don't allow user
      console.log("err");
    }
  } catch (e) {
    console.log(e);
  }
});

io.on("connection", function (socket) {
  //socket.emit('webpushmessage',{title:'Test',body:"my new body",clickUrl:"5f962e7c47416ea284a63a9d"})
  console.log("[socket] connected :" + socket.id);

  socket.on("join", async function (room) {
    //android device pass parameter "room id " to the event and join
    socket.join(room);
  });

  //event join room
  socket.on("testme", async function (room) {
    //android device pass parameter "room id " to the event and join
    console.log("testme called", room);
    // io.sockets.emit('webpushmessage',{title:'Test',body:"my new body",clickUrl:"5f962e7c47416ea284a63a9d"})
  });

  //  socket.on('message_detection', async function (data) {
  //      //detect the message and send it to user
  //      await messagesRouter.sendMessage(data, io, socket)

  //      //notify user that have new message
  //      await messagesRouter.notifyDataSetChanged(data.room, io, clients)
  //  })

  socket.on("disconnect", async function () {
    console.log("[socket] disconnected :" + socket.id);
    //in this event we get user from database and set last seen to now
    await User.findByIdAndUpdate(clients.get(socket.id), {
      last_seen: new Date().getTime(),
    });
    //search in hashmap and find the related socket and delete it
    await clients.delete(socket.id);
  });
});


// app.get('/imagesTransform', (req, res) => {
//   fs.readdir('./public/uploads', (err, files) => {
//     files.forEach(file => {
//       if (file !== '.DS_Store') {
//         let formPath = "uploads/" + file;
//         const distFolderPath = path.join(__dirname, './public/' + formPath);
//         fs.readdir(distFolderPath, async (err, files) => {
//           if (!files || files.length === 0) {
//             console.log(`provided folder '${distFolderPath}' is empty or does not exist.`);
//             console.log('Make sure your project was compiled!');
//             return;
//           }
//           for (const fileName of files) {
//             await s3ImageUploadLocalToPublic(distFolderPath, fileName, formPath + '/');
//           }
//         });
//       }
//     });
//   });
//   res.send({ name: "WIP" });
// });

app.get('/getuserlist', function (request, response) {
  User.find((error, users) => {
    response.send(users)
  })
})

app.get('/updateuserlist', function (request, response) {
  try {
    User.updateMany({}, { $set: { "origin": 'USHX' } }, (error, users) => {
      if (error) throw err;
      response.send(users)
    });
  } catch (e) {
    print(e);
  }
})

app.use("/api/v1/", indexRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/admin/notification", notificationsRouter);
app.use("/api/v1/user", usersRouter);
app.use("/api/v1/permission", permissionsRouter);
app.use("/api/v1/visit", scheduleRouter);
app.use("/api/v1/role", rolesRouter);
app.use("/api/v1/project", projectsRouter);
app.use("/api/v1/rehab", rehabPackagesRouter);
app.post("/api/v1/room", roomsRouter.createRoom);
app.get("/api/v1/room", roomsRouter.getRooms);
app.get("/api/v1/room/:room", roomsRouter.getRoom);
app.post("/api/v1/messages", messagesRouter.sendMessage);
app.get("/api/v1/messages", messagesRouter.messageList);

// app.use('/api/v2/', indexRouter)
// app.use('/api/v2/admin', adminRouter)
// app.use('/api/v2/admin/notification', notificationsRouter)
// app.use('/api/v2/user', usersRouter)
// app.use('/api/v2/permission', permissionsRouter)
// app.use('/api/v2/visit', scheduleRouter)
// app.use('/api/v2/role', rolesRouter)
// app.use('/api/v2/project', projectsRouter)
// app.use('/api/v2/rehab', rehabPackagesRouter)
// app.post('/api/v2/room', roomsRouter.createRoom);
// app.get('/api/v2/room', roomsRouter.getRooms);
// app.get('/api/v2/room/:room', roomsRouter.getRoom);
// app.post('/api/v2/messages', messagesRouter.sendMessage);
// app.get('/api/v2/messages', messagesRouter.messageList);

app.use("/api/v1/", indexRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/admin/notification", notificationsRouter);
app.use("/api/v1/user", usersRouter);
app.use("/api/v1/permission", permissionsRouter);
app.use("/api/v1/visit", scheduleRouter);
app.use("/api/v1/role", rolesRouter);
app.use("/api/v1/project", projectsRouter);
app.use("/api/v1/rehab", rehabPackagesRouter);
app.post("/api/v1/room", roomsRouter.createRoom);
app.get("/api/v1/room", roomsRouter.getRooms);
app.get("/api/v1/room/:room", roomsRouter.getRoom);
app.post("/api/v1/messages", messagesRouter.sendMessage);
app.get("/api/v1/messages", messagesRouter.messageList);
app.use("/api/v2/", indexRouter);
app.use("/api/v2/admin", adminRouter);
app.use("/api/v2/admin/notification", notificationsRouter);
app.use("/api/v2/user", usersRouter);
app.use("/api/v2/permission", permissionsRouter);
app.use("/api/v2/visit", scheduleRouter);
app.use("/api/v2/role", rolesRouter);
app.use("/api/v2/project", projectsRouter);
app.use("/api/v2/project2", projectsV2Router);
app.use("/api/v2/rehab", rehabPackagesRouter);
app.post("/api/v2/room", roomsRouter.createRoom);
app.get("/api/v2/room", roomsRouter.getRooms);
app.get("/api/v2/room/:room", roomsRouter.getRoom);
app.post("/api/v2/messages", messagesRouter.sendMessage);
app.get("/api/v2/messages", messagesRouter.messageList);

var port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("Server running on " + port);
});

// module.exports = { app, server }