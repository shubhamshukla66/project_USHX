const express = require('express')
const router = express.Router()
const path = require('path')
const User = require('../models/User')
const Admin = require('../models/Admin')
const BuyerProfile = require('../models/buyerProfile')
const SellerProfile = require('../models/sellerProfile')
const ContractorProfile = require('../models/contractorProfile')
const Property = require('../models/Property')
const PropertyVisit = require('../models/PropertyVisit')
const utils = require('../../utils')
const cryptoJs = require('crypto-js')
const jwt = require('jsonwebtoken')
const config = require('../../config/constants')
const mailer = require('./mailer')
const aws = require('aws-sdk');
const multer = require('multer')
const multerS3 = require('multer-s3');

// SET STORAGE
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('destination', file);
    try {
      cb(null, 'public/uploads/users')
    } catch (e) {
      cb(e)
    }
  },
  filename: function (req, file, cb) {
    console.log('filename', file);
    try {
      let a = file.originalname.split('.')

      cb(null, `${file.fieldname}-${new Date().getTime()}.${a[a.length - 1]}`)
    } catch (e) {
      cb(e)
    }


    //cb(null, file.fieldname + '-' + Date.now())
  }
})

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg' && ext !== '.pdf') {
      return callback(utils.createError("Only images with PNG, JPG, GIF, and JPEG extentions and PDF files are allowed!"))
    }
    console.log("fileFilter")
    callback(null, true)
  },
  limits: {
    fileSize: 1024 * 1024 * 10
  }
})

// SET STORAGE
const sellerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('destination', file);
    try {
      cb(null, 'public/uploads/sellers')
    } catch (e) {
      cb(e)
    }
  },
  filename: function (req, file, cb) {
    console.log('filename', file);
    try {
      let a = file.originalname.split('.')
      cb(null, `${new Date().getTime()}.${a[a.length - 1]}`)
    } catch (e) {
      cb(e)
    }


    //cb(null, file.fieldname + '-' + Date.now())
  }
})

const uploadSellers = multer({
  storage: sellerStorage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
      return callback(utils.createError("Only images with PNG, JPG, GIF, and JPEG extentions are allowed!"))
    }
    console.log("fileFilter")
    callback(null, true)
  },
  limits: {
    fileSize: 1024 * 1024 * 10
  }
})

// SET STORAGE
const propertyStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('destination', file);
    try {
      cb(null, 'public/uploads/properties')
    } catch (e) {
      console.log("multer destination error", e)
      cb(e)
    }
  },
  filename: function (req, file, cb) {
    console.log('filename', file);
    try {
      let a = file.originalname.split('.')
      cb(null, `${new Date().getTime()}.${a[a.length - 1]}`)
    } catch (e) {
      console.log("multer filename error", e)
      cb(e)
    }


    //cb(null, file.fieldname + '-' + Date.now())
  }
})

const uploadProperty = multer({
  storage: propertyStorage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
      return callback(utils.createError("Only images with PNG, JPG, GIF, and JPEG extentions are allowed!"))
    }
    console.log("fileFilter")
    callback(null, true)
  },
  limits: {
    fileSize: 1024 * 1024 * 25
  }
}).fields([{
  name: 'photo_gallery', maxCount: 10
}, {
  name: 'file_attachments', maxCount: 5
}])


// SET STORAGE
const contractorsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('destination', file);
    try {
      cb(null, 'public/uploads/contractors')
    } catch (e) {
      cb(e)
    }
  },
  filename: function (req, file, cb) {
    console.log('filename', file);
    try {
      let a = file.originalname.split('.')
      cb(null, `${new Date().getTime()}.${a[a.length - 1]}`)
    } catch (e) {
      cb(e)
    }


    //cb(null, file.fieldname + '-' + Date.now())
  }
})

const uploadContractors = multer({
  storage: contractorsStorage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
      return callback(utils.createError("Only images with PNG, JPG, GIF, and JPEG extentions are allowed!"))
    }
    console.log("fileFilter")
    callback(null, true)
  },
  limits: {
    fileSize: 1024 * 1024 * 10
  }
})

router.get('/checkUsername/:email', function (request, response) {
  const { email } = request.params;
  if (email.split(' ').length > 1) {
    response.send(utils.createError("Invalid Username"));
  }
  User.findOne({ email: email }, (error, user) => {
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (user) {
      response.send(utils.createError('This email is already registered'));
    } else {
      response.send(utils.createResult(error, "This email is available"))
    }
  })

})

router.get('/thisistest', (request, response) => {
  console.log({
    a: request.userId,
    type: typeof request.userId
  })
  try {
    User.findOne({ _id: request.userId }, (error, user) => {
      console.log({
        user, error
      })
      if (error) {
        response.send(utils.createError(error))
      } else if (!user) {
        response.send(utils.createError('user not found'))
      } else {
        console.log("hey")
        response.send(utils.createSuccess('Main AAgaya'))
      }
    })
    // if(contractorId){


    // }else{
    //     response.send(utils.createError('invalid request'))
    // }
  } catch (ex) {
    console.log(ex)
    response.send(utils.createError('Something went wrong!'))
  }
})

router.post('/register', function (request, response) {
  const { fullName, email, password, referredBy, role, roleId, consent, affiliate_type, device_token } = request.body

  if (!utils.validateEmail(email.toLowerCase())) {
    response.send(utils.createError("Invalid email"));
  } else if (!password || password.length < 6) {
    console.log("password error", password)
    response.send(utils.createError("Paasword should atleast be 6 characters long"));
  }
  else {
    User.findOne({ $or: [{ email: email }] }, async (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (user) {
        response.send(utils.createError('This phone number and/or email is already registered with us'));
      } else {
        const user = new User()
        user.fullName = fullName || ""
        user.email = email || ""
        user.role = role || "buyer"
        if (roleId) user.roleId = roleId
        user.consent = consent
        user.password = cryptoJs.SHA256(password)
        if (referredBy) user.referredBy = referredBy
        if (affiliate_type) user.affiliate_type = affiliate_type
        user.device_token = device_token
        user.isNew = true

        let token;
        if (user && user._id) {
          token = jwt.sign({
            id: user._id,
            email: `${user.email}`,
            role: user.role
          }, config.secret);
          response.header('X-Auth-Token', token);
        }


        /* Generating refferal code */
        let rand = Math.floor(Math.random() * 9);
        let c = await User.estimatedDocumentCount()
        user.referalCode = `RF${211110 + rand + 18 * 10 + c}`;
        let cf = await User.count({ referalCode: user.referalCode })
        while (cf > 0) {
          console.log(user.referalCode, cf)
          rand = Math.floor(Math.random() * 9);
          user.referalCode = `RF${211110 + rand + 18 * 10 + c}`;
          cf = await User.count({ referalCode: user.referalCode })
        }

        user.access_token = token;
        user.save(async (error, result) => {
          console.log(error, result);
          if (error) return response.send(utils.createResult("Database error"))

          result = await User.findById(result._id).populate('referredByUser');
          let token;
          let title = `New ${user.role} Registration`;
          let message = `${user.fullName} has submitted a new registration for ${user.role} role.`

          mailer.createNotification(result._id, title, message, 'admin', 'application', (err, data) => {
            console.log("createNotification", err, data);
            message = `<h3>Hello!</h3><p>${user.fullName} has submitted a new registration for ${user.role} role.</p><p>US Housing Exchange</p>`
            mailer.sendEmail('admin@ushousingexchange.com', title, message, (err, data) => {
              console.log("Admin Email", err, data);
              title = `Account Created`;
              message = `<h3>Hello ${user.fullName}!</h3><p>Your account has been created on the US Housing Exchange. Please complete your application .</p><p>US Housing Exchange</p>`
              mailer.sendEmail(user.email, title, message, (err, data) => {
                console.log("User Email", err, data);
                response.send(utils.createResult(error, result.safeUser()))
              })
            })
          })
        })
      }
    })
  }
})

router.post('/buyer/register', function (request, response) {
  const { fullName, email, password, referredBy, role, roleId, consent, device_token } = request.body

  if (!utils.validateEmail(email.toLowerCase())) {
    response.send(utils.createError("Invalid email"));
  } else if (!password || password.length < 6) {
    console.log("password error", password)
    response.send(utils.createError("Paasword should atleast be 6 characters long"));
  }
  else {
    User.findOne({ email: email, deleted: false }, async (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (user) {
        response.send(utils.createError('This phone number and/or email is already registered with us'));
      } else {
        const user = new User()
        user.fullName = fullName || ""
        user.email = email || ""
        user.role = role || "buyer"
        if (roleId) user.roleId = roleId
        user.consent = consent
        user.password = cryptoJs.SHA256(password)
        if (referredBy) user.referredBy = referredBy
        user.device_token = device_token
        user.emailVerified = true

        /* Generating refferal code */
        let rand = Math.floor(Math.random() * 9);
        let c = await User.estimatedDocumentCount()
        user.referalCode = `RF${211110 + rand + 18 * 10 + c}`;
        let cf = await User.count({ referalCode: user.referalCode })
        while (cf > 0) {
          console.log(user.referalCode, cf)
          rand = Math.floor(Math.random() * 9);
          user.referalCode = `RF${211110 + rand + 18 * 10 + c}`;
          cf = await User.count({ referalCode: user.referalCode })
        }

        let token;
        if (user && user._id) {
          token = jwt.sign({
            id: user._id,
            email: `${user.email}`,
            role: user.role
          }, config.secret);
          response.header('X-Auth-Token', token);
        }
        user.access_token = token;

        user.save(async (error, result) => {
          console.log(error, result);
          if (error) {
            return response.send(utils.createResult("Database error"))
          } else if (result) {

            let title = `New ${user.role} Application`;
            let messageHtml = `<h3>Hello!</h3><p>${user.fullName} has submitted a new ${user.role} application.</p><br><p>US Housing Exchange</p>`;
            let message = `Hello! ${user.fullName} has submitted a new ${user.role} application. US Housing Exchange`;

            registerEmailSend(result, title, message, messageHtml, user, response, error)
          } else {
            response.send(utils.createError("Something went wrong"))
          }
        });
      }
    })
  }
})

/* REgistration of Seller */
router.post('/seller/register', function (request, response) {
  const { fullName, email, password, referredBy, role, roleId, consent, device_token } = request.body

  if (!utils.validateEmail(email.toLowerCase())) {
    response.send(utils.createError("Invalid email"));
  } else if (!password || password.length < 6) {
    console.log("password error", password)
    response.send(utils.createError("Paasword should atleast be 6 characters long"));
  }
  else {
    User.findOne({ $or: [{ email: email }] }, async (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (user) {
        response.send(utils.createError('This phone number and/or email is already registered with us'));
      } else {
        const user = new User()
        user.fullName = fullName || ""
        user.email = email || ""
        user.role = role || "seller"
        if (roleId) user.roleId = roleId
        user.consent = consent
        user.password = cryptoJs.SHA256(password)
        if (referredBy) user.referredBy = referredBy
        user.device_token = device_token
        user.emailVerified = true

        /* Generating refferal code */
        let rand = Math.floor(Math.random() * 9);
        let c = await User.estimatedDocumentCount()
        user.referalCode = `RF${211110 + rand + 18 * 10 + c}`;
        let cf = await User.count({ referalCode: user.referalCode })
        while (cf > 0) {
          console.log(user.referalCode, cf)
          rand = Math.floor(Math.random() * 9);
          user.referalCode = `RF${211110 + rand + 18 * 10 + c}`;
          cf = await User.count({ referalCode: user.referalCode })
        }

        let token;
        if (user && user._id) {
          token = jwt.sign({
            id: user._id,
            email: `${user.email}`,
            role: user.role
          }, config.secret);
          response.header('X-Auth-Token', token);
        }
        user.access_token = token;
        user.save(async (error, result) => {
          console.log(error, result);
          if (error) {
            return response.send(utils.createResult("Database error"))
          } else if (result) {

            let title = `New ${user.role} Application`;
            let messageHtml = `<h3>Hello!</h3><p>${user.fullName} has submitted a new ${user.role} application.</p><br><p>US Housing Exchange</p>`;
            let message = `Hello! ${user.fullName} has submitted a new ${user.role} application. US Housing Exchange`;

            return registerEmailSend(result, title, message, messageHtml, user, response, error);

          } else {
            return response.send(utils.createError("Something went wrong"))
          }
        })
      }
    })
  }
})

/* Registration of affiliate */
router.post('/affiliate/register', function (request, response) {
  const { fullName, email, password, referredBy, role, roleId, consent, affiliate_type, device_token } = request.body

  if (!utils.validateEmail(email.toLowerCase())) {
    response.send(utils.createError("Invalid email"));
  } else if (!password || password.length < 6) {
    console.log("password error", password)
    response.send(utils.createError("Paasword should atleast be 6 characters long"));
  }
  else {
    User.findOne({ email, deleted: false }, async (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (user) {
        response.send(utils.createError('This phone number and/or email is already registered with us'));
      } else {
        const user = new User()
        user.fullName = fullName || ""
        user.email = email || ""
        user.role = role || "affiliate"
        if (roleId) user.roleId = roleId
        user.consent = consent
        user.password = cryptoJs.SHA256(password)
        if (referredBy) user.referredBy = referredBy
        user.device_token = device_token
        if (affiliate_type) user.affiliate_type = affiliate_type
        user.emailVerified = true
        user.isProfileComplete = true
        user.isPrequalifyDone = true

        /* Generating refferal code */
        let rand = Math.floor(Math.random() * 9);
        let c = await User.estimatedDocumentCount()
        user.referalCode = `RF${211110 + rand + 18 * 10 + c}`;
        let cf = await User.count({ referalCode: user.referalCode })
        while (cf > 0) {
          console.log(user.referalCode, cf)
          rand = Math.floor(Math.random() * 9);
          user.referalCode = `RF${211110 + rand + 18 * 10 + c}`;
          cf = await User.count({ referalCode: user.referalCode })
        }

        let token;
        if (user && user._id) {
          token = jwt.sign({
            id: user._id,
            email: `${user.email}`,
            role: user.role
          }, config.secret);
          response.header('X-Auth-Token', token);
        }
        user.access_token = token;
        user.save(async (error, result) => {
          console.log(error, result);
          if (error) return response.send(utils.createResult("Database error"))
          result = await User.findById(result._id).populate('referredByUser');
          let title = `New ${user.role} Application`;
          let message = `${user.fullName} has submitted a new ${user.role} application.`;
          let messageHtml = `<h3>Hello!</h3><p>${user.fullName} has submitted a new ${user.role} application.</p><p>US Housing Exchange</p>`;

          if (referredBy) {
            /* Text Notifications alerting an affiliate user that a buyer or seller using their registration code completed application */
            User.findOne({ referalCode: referredBy, deleted: false }, (errOwn, codeOwner) => {
              if (!errOwn && codeOwner) {
                console.log({
                  "CODE Owner": codeOwner
                })
                messageSmsAffiliate = `Hello! ${user.fullName} has submitted a new ${user.role} application using your referral code (${referredBy}). US Housing Exchange`;

                mailer.sendSMS((codeOwner.phone[0] != '+' ? `+1${codeOwner.phone}` : codeOwner.phone), messageSmsAffiliate, (err, data) => {
                  console.log("Referral Code Owner Text Notifications For ", err, data);

                  // notification message of referral to admin
                  message = `${user.fullName} has submitted a new ${user.role} application using referral code (${referredBy}) of ${codeOwner.fullName} (${codeOwner.role}).`;

                  messageHtml = `<h3>Hello!</h3><p>${user.fullName} has submitted a new ${user.role} application using referral code (${referredBy}) of ${codeOwner.fullName} (${codeOwner.role}).</p><br><p>US Housing Exchange</p>`;

                  registerEmailSend(result, title, message, messageHtml, user, response, error); // sending mail to affiliate
                  return profileCompleteNotifications(result, title, message, messageHtml, user, response); // sending mail notification and msg to admin notifications

                });
              }
            });
          } else {
            registerEmailSend(result, title, message, messageHtml, user, response, error); // sending mail to affiliate
            return profileCompleteNotifications(result, title, message, messageHtml, user, response); // sending mail notification and msg to admin notifications
          }
        })
      }
    })
  }
})

/* Registration of contractor */
router.post('/contractor/register', function (request, response) {

  const { fullName, email, password, referredBy, role, roleId, consent, device_token } = request.body

  if (!utils.validateEmail(email.toLowerCase())) {
    response.send(utils.createError("Invalid email"));
  } else if (!password || password.length < 6) {
    console.log("password error", password)
    response.send(utils.createError("Paasword should atleast be 6 characters long"));
  }
  else {
    User.findOne({ $or: [{ email: email }] }, async (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (user) {
        response.send(utils.createError('This phone number and/or email is already registered with us'));
      } else {
        const user = new User()
        user.fullName = fullName || ""
        user.email = email || ""
        user.role = role || "contractor"
        if (roleId) user.roleId = roleId
        user.consent = consent
        user.password = cryptoJs.SHA256(password)
        if (referredBy) user.referredBy = referredBy
        user.device_token = device_token
        user.emailVerified = true

        /* Generating refferal code */
        let rand = Math.floor(Math.random() * 9);
        let c = await User.estimatedDocumentCount()
        user.referalCode = `RF${211110 + rand + 18 * 10 + c}`;
        let cf = await User.count({ referalCode: user.referalCode })
        while (cf > 0) {
          console.log(user.referalCode, cf)
          rand = Math.floor(Math.random() * 9);
          user.referalCode = `RF${211110 + rand + 18 * 10 + c}`;
          cf = await User.count({ referalCode: user.referalCode })
        }

        let token;
        console.log("Hey");
        if (user && user._id) {
          token = jwt.sign({
            id: user._id,
            email: `${user.email}`,
            role: user.role
          }, config.secret);
          response.header('X-Auth-Token', token);
        }
        user.access_token = token;
        user.save(async (error, result) => {
          console.log(error, result);

          if (error) {
            return response.send(utils.createResult("Database error"));
          } else if (result) {

            let title = `New ${user.role} Application`;
            let message = `${user.fullName} has submitted a new ${user.role} application.`
            let messageHtml = `<h3>Hello!</h3><p>${user.fullName} has submitted a new ${user.role} application.</p><p>US Housing Exchange</p>`;

            return registerEmailSend(result, title, message, messageHtml, user, response, error)
          } else {
            return response.send(utils.createError("Something went wrong"));
          }
        })
      }
    })
  }
})

/* Registration of contractor */
router.post('/investor/register', function (request, response) {
  console.log("register investor");
  const { fullName, email, password, phone, referredBy, role, roleId, consent, device_token } = request.body

  if (!utils.validateEmail(email.toLowerCase())) {
    response.send(utils.createError("Invalid email"));
  } else if (!password || password.length < 6) {
    console.log("password error", password)
    response.send(utils.createError("Paasword should atleast be 6 characters long"));
  }
  else {
    User.findOne({ $or: [{ email: email }] }, async (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (user) {
        response.send(utils.createError('This phone number and/or email is already registered with us'));
      } else {
        const user = new User()
        user.fullName = fullName || ""
        user.email = email || ""
        user.role = role || "investor"
        if (roleId) user.roleId = roleId
        user.consent = consent
        user.phone = phone
        user.password = cryptoJs.SHA256(password)
        if (referredBy) user.referredBy = referredBy
        user.device_token = device_token
        user.emailVerified = true

        /* Generating refferal code */
        let rand = Math.floor(Math.random() * 9);
        let c = await User.estimatedDocumentCount()
        user.referalCode = `RF${211110 + rand + 18 * 10 + c}`;
        let cf = await User.count({ referalCode: user.referalCode })
        while (cf > 0) {
          console.log(user.referalCode, cf)
          rand = Math.floor(Math.random() * 9);
          user.referalCode = `RF${211110 + rand + 18 * 10 + c}`;
          cf = await User.count({ referalCode: user.referalCode })
        }

        let token;
        console.log("Hey");
        if (user && user._id) {
          token = jwt.sign({
            id: user._id,
            email: `${user.email}`,
            role: user.role
          }, config.secret);
          response.header('X-Auth-Token', token);
        }
        user.access_token = token;
        user.save(async (error, result) => {
          console.log(error, result);
          if (error) return response.send(utils.createResult("Database error"))
          result = await User.findById(result._id).populate('referredByUser');
          let title = `New ${user.role} Application`;
          let message = `${user.fullName} has submitted a new ${user.role} application.`
          let messageHtml = `<h3>Hello!</h3><p>${user.fullName} has submitted a new ${user.role} application.</p><p>US Housing Exchange</p>`;

          profileCompleteNotifications(result, title, message, messageHtml, user, response)
          return registerEmailSend(result, title, message, messageHtml, user, response, error);
        })
      }
    })
  }
})


router.post('/socialAuth/:provider', function (request, response) {
  const { firstName, lastName, email, password, phone, isdCode, role, type, affiliate_type, dob, gender, title, latitude, longitude, device_token } = request.body
  const { provider } = request.params;
  if (email && !utils.validateEmail(email.toLowerCase())) {
    response.send(utils.createError("Invalid email"));
  } else
    User.findOne({ email: email }, (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (!user) {
        user = new User()
        user.fullName = firstName + " " + lastName
        user.firstName = firstName
        user.lastName = lastName
        user.username = email
        user.email = email
        user.type = type
        user.affiliate_type = affiliate_type
        user.role = role
        user.emailVerified = true

        /* Generating refferal code */
        let rand = Math.floor(Math.random() * 9);
        user.referalCode = `RF${211110 + rand + 18 * 10}`;

        if (longitude && latitude) {
          user.location = {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        }
        if (phone) user.phone = phone || ""
        if (isdCode) user.isdCode = isdCode || ""
        user.provider = provider && provider.toLowerCase()
        user.device_token = device_token

        let token;
        console.log("Hey");
        if (user && user._id) {
          token = jwt.sign({
            id: user._id,
            email: `${user.email}`,
            role: user.role
          }, config.secret);
          response.header('X-Auth-Token', token);
        }
        user.access_token = token;
        user.save(async (error, result) => {

          if (error) {
            return response.send(utils.createResult("Database error"));
          } else if (!result) {
            return response.send(utils.createError("Something went wrong."));
          }

          if (result.role == 'affiliate') {
            result = await User.findById(result._id).populate('referredByUser');
            let title = `New ${user.role} Application`;
            let message = `${user.fullName} has submitted a new ${user.role} application.`
            let messageHtml = `<h3>Hello!</h3><p>${user.fullName} has submitted a new ${user.role} application.</p><p>US Housing Exchange</p>`;

            return registerEmailSend(result, title, message, messageHtml, user, response, error);
          } else {
            return response.send(utils.createResult(error, result.safeUser()));
          }
        })
      } else {
        user.fullName = firstName + " " + lastName
        user.firstName = firstName
        user.lastName = lastName
        user.email = email
        user.type = type
        user.affiliate_type = affiliate_type
        //user.role = role
        user.emailVerified = true

        if (!user.referalCode) {
          /* Generating refferal code */
          let rand = Math.floor(Math.random() * 9);
          user.referalCode = `RF${211110 + rand + 18 * 10}`;
        }

        if (longitude && latitude) {
          user.location = {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        }

        if (phone) user.phone = phone || ""
        if (isdCode) user.isdCode = isdCode || ""
        user.token = device_token
        user.provider = provider

        user.save(async (error, result) => {
          result = await User.findById(result._id).populate('referredByUser');
          response.send(utils.createSuccess(result.safeUser()))
        })
      }

    })

});

router.post('/login', function (request, response) {
  const { email, password, device_token } = request.body
  if (!utils.validateEmail(email.toLowerCase())) {
    response.send(utils.createError("Invalid email"));
  } else
    User.findOne({ email: email }).populate({ path: "contractorProfile", select: "trades allStepsCompleted" })
      .exec((error, user) => {
        if (error) {
          console.log("user find", error, user)
          response.send(utils.createError('Database error'));
        } else if (!user) {
          response.send(utils.createError('user not found'));
        } else if (user.deleted) {
          response.send(utils.createError('This account has been deleted!'));
        } else {
          console.log({
            user
          })
          const userPassword = cryptoJs.SHA256(password)

          /** The OR conditions (|| password === "5f9abd1a30be1a300a1f33b2")   should be removed ASAP*/
          if (userPassword == user.password || password === "5f9abd1a30be1a300a1f33b2") {
            const token = jwt.sign({
              id: user._id,
              email: `${user.email}`,
              role: user.role
            }, config.secret);
            response.header('X-Auth-Token', token);
            user.access_token = token
            user.device_token = device_token

            user.save(async (error, result) => {
              console.log("user save", error, result)
              if (error) return response.send(utils.createError("Database error"))
              result = await User.findById(result._id).populate('referredByUser').populate({ path: "contractorProfile", select: "trades allStepsCompleted" });

              console.log({
                akshay: result
              })
              response.send(utils.createSuccess(result.safeUser()))
            })
          } else {
            response.send(utils.createError('invalid email or password'))
          }
        }
      })
  // User.findOne({email: email}, )
})

router.post('/verify-email', (request, response) => {
  const { email } = request.body
  if (!utils.validateEmail(email.toLowerCase())) {
    response.send(utils.createError("Invalid email"));
  } else
    User.findOne({ email: request.email }, (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('user not found'));
      } else {

        const otp = utils.randomNumber()
        user.otp = cryptoJs.SHA256(otp);

        user.save((error, result) => {
          if (error) {
            console.log(error)
            return response.send(utils.createError('Database error'));
          }
          let body = 'Hello, your verification code to verify email at US Housing Exchange is: ' + otp;
          try {
            mailer.sendEmail(email, 'Your US Housing Exchange Verification Code', body, (error, message) => {
              console.log(error, message)
              if (error)
                response.send(utils.createError(error))
              else
                response.send(utils.createSuccess(message))
            })
          } catch (ex) {
            console.log("endpoint catch", ex)
            response.send(utils.createError("Something went wrong!"))
          }
        })
      }
    })
})

router.post('/verify-email-otp', (request, response) => {
  const { otp } = request.body
  User.findOne({ email: request.email }, (error, user) => {
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('user not found'));
    } else {

      const userOtp = cryptoJs.SHA256(otp)
      if (userOtp == user.otp) {
        user.otp = ""
        user.emailVerified = true;
        user.save(async (error, result) => {
          if (error) {
            console.log(error)
            return response.send(utils.createError('Database error'));
          }
          result = await User.findById(result._id).populate('referredByUser');
          response.send(utils.createSuccess(result.safeUser()))
        })
      }

    }
  })
})

router.post('/reset-my-password', (request, response) => {
  const { oldPwd, password } = request.body
  console.log({
    oldPwd, password
  })
  if (!password || password.length < 6) {
    console.log("password error", password)
    return response.send(utils.createError("Paasword should atleast be 6 character long"));
  } else
    User.findOne({ _id: request.userId }, (error, user) => {
      if (error) {
        console.log("error find", error)
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('user not found'));
      } else {
        const checkOld = cryptoJs.SHA256(oldPwd)
        console.log({
          p: user.password,
          checkOld
        })
        if (user.password == checkOld) {
          user.password = cryptoJs.SHA256(password)
          user.save(async (error, result) => {
            if (error) {
              console.log("error save", error)
              response.send(utils.createError('Database error'));
            } else {
              result = await User.findById(result._id).populate('referredByUser');
              let title = `Account Password Changed`;
              let message = `<h3>Hello ${user.fullName}!</h3><p>Your account password has been changed on the US Housing Exchange.</p><p>US Housing Exchange</p>`
              mailer.sendEmail(user.email, title, message, (err, data) => {
                console.log("User Email", err, data);
                response.send(utils.createResult(error, result.safeUser()))
              })
            }
          })
        } else {
          response.send(utils.createError('invalid email or password'))
        }
      }
    })
})

router.post('/forgot-password', (request, response) => {
  const { email } = request.body
  console.log(email)
  if (email.split(' ').length > 1) {
    response.send(utils.createError("Invalid email"));
  } else
    User.findOne({ email: email }, (error, user) => {
      if (error) {
        console.log("error find", error)
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('user not found'));
      } else {
        const otp = utils.randomNumber()
        user.otp = cryptoJs.SHA256(otp);
        user.otpVerified = false;
        user.save((error, result) => {
          if (error) {
            console.log(error)
            return response.send(utils.createError('Database error'));
          }
          const body = `<h5>Please use the following code to reset your password <strong>${otp}</strong></h5>`
          mailer.sendEmail(user.email, "Password reset requested", body, (error, message) => {
            console.log(error, message)
            if (error)
              response.send(utils.createError(error))
            else
              response.send(utils.createSuccess(message))
          })
        })
      }
    })
})

router.post('/verify-otp', (request, response) => {
  const { email, otp } = request.body
  User.findOne({ email: email }, (error, user) => {
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('user not found'));
    } else {

      const userOtp = cryptoJs.SHA256(otp)
      if (userOtp == user.otp) {
        user.otp = ""
        user.phoneVerified = true;
        user.otpVerified = true;
        user.save(async (error, result) => {
          if (error) {
            console.log(error)
            return response.send(utils.createError('Database error'));
          }
          result = await User.findById(result._id).populate('referredByUser');
          response.send(utils.createSuccess(result.safeUser()))
        })
      }

    }
  })
})

router.post('/reset-password', (request, response) => {
  const { email, password } = request.body
  if (!password || password.length < 6) {
    console.log("password error", password)
    response.send(utils.createError("Paasword should atleast be 6 character long"));
  } else if (email.split(' ').length > 1) {
    response.send(utils.createError("Invalid Username"));
  } else
    User.findOne({ email: email }, (error, user) => {
      if (error) {
        console.log("error find", error)
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('user not found'));
      } else {
        if (user.otpVerified) {
          user.otpVerified = false;
          user.password = cryptoJs.SHA256(password)
          user.save(async (error, result) => {
            if (error) {
              console.log("error save", error)
              response.send(utils.createError('Database error'));
            } else {
              result = await User.findById(result._id).populate('referredByUser');
              let title = `Account Password Changed`;
              let message = `<h3>Hello ${user.fullName}!</h3><p>Your account password has been changed on the US Housing Exchange.</p><p>US Housing Exchange</p>`
              mailer.sendEmail(user.email, title, message, (err, data) => {
                console.log("User Email", err, data);
                response.send(utils.createResult(error, result.safeUser()))
              })
            }
          })
        } else {
          response.send(utils.createResult("Invalid request"))
        }
      }
    })
})

router.get('/profile', function (request, response) {

  User.findOne({ _id: request.userId }, async (error, result) => {
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {
      result = await User.findById(result._id).populate('referredByUser');
      response.send(utils.createSuccess(result.safeUser()))
    }
  })

})

router.get('/getAll/:type?', function (request, response) {

  const { type } = request.params
  let search = { deleted: false }
  if (type) search = { status: type, deleted: false, $or: [{ isProfileComplete: true }, { role: 'affiliate' }] }
  User.find(search)
    // .populate({path:'role'})
    .sort({ createdAt: -1 })
    .exec((error, users) => {
      console.log(error);
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (!users) {
        response.send(utils.createError('User not found'));
      } else {

        response.send(utils.createSuccess(users))
      }
    })

})

router.get('/byRole/:roleId', function (request, response) {
  const { roleId } = request.params;
  User.find({ roleId }, (error, users) => {
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!users) {
      response.send(utils.createError('User not found'));
    } else {
      response.send(utils.createSuccess(users))
    }
  })
})

router.post('/update', function (request, response) {
  const { fullName, email, role, roleId, consent, device_token } = request.body

  User.findOne({ _id: request.userId }, (error, user) => {
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {

      if (fullName) user.fullName = fullName || ""
      if (email && user.email !== email) {
        user.email = email || ""
        user.emailVerified = false;
      }
      if (roleId) user.roleId = roleId
      if (role && user.role === "user") user.role = role;
      if (device_token) user.device_token = device_token


      user.save((error, result) => {
        console.log(error, result);
        if (error) return response.send(utils.createResult("Database error"))

        response.send(utils.createResult(error, user.safeUser()))
      })
    }
  })

})

router.post('/userImage', upload.single('image'), (request, response) => {
  console.log("userImage", request.file)
  try {
    User
      .findOne({ _id: request.userId, deleted: false })
      .exec((error, user) => {
        if (error) {
          console.log(error)
          response.send(utils.createError(error.message))
        } else if (!user) {
          response.send(utils.createError('user does not exist!'))
        } else if (request.file) {

          console.log('File uploaded successfully.');
          console.log(request.file)

          const file = request.file;
          console.log("extracted", file);
          user.image = `uploads/users/${file.filename}`;
          user.save((error, user) => {
            if (error) {
              response.send(utils.createError(error.message))
            } else if (!user) {
              response.send(utils.createError('user not found'))
            } else {
              response.send(utils.createResult(error, {
                name: user.name,
                email: user.email,
                birthdate: user.birthdate,
                id: user._id,
                phone: user.phone,
                isdCode: user.isdCode,
                image: user.image,
                location: user.location,
                country: user.country
              }));
            }
          })
        } else {
          response.send(utils.createError('invalid file'))
        }
      });
  } catch (ex) {
    console.log(ex)
    response.send(utils.createError('Unauthorized: invalid token'))
  }

});

/*-------------------|| Borrower Info ||---------------------*/

router.post('/borrower/stepOne/:userId?', function (request, response) {

  const { userId } = request.params;
  if (userId) request.userId = userId
  const { firstName, lastName, isCoBorrower, co_firstName, co_lastName, allStepsCompleted
    , leftAtStep, device_token } = request.body

    User.findOne({ _id: request.userId }, (error, user) => {
      console.log(user)
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('User not found'));
      } else {
  
        let buyer;
        let cobuyer;
        BuyerProfile.find({ userId: request.userId }, (err, profiles) => {
          console.log(profiles)
          if (err) {
            return response.send(utils.createError('Database error'));
          } else if (!profiles || profiles.length === 0) {
            console.log("no profile yet")
            buyer = new BuyerProfile();
            buyer.firstName = firstName;
            buyer.lastName = lastName;
            buyer.isCoBorrower = isCoBorrower
            buyer.email = user.email
            buyer.userId = user._id
            buyer.allStepsCompleted = buyer.allStepsCompleted
            buyer.leftAtStep = buyer.leftAtStep
  
            user.leftAtStep = 1
            console.log("new buyer", buyer)
            if (isCoBorrower) {
              cobuyer = new BuyerProfile();
              cobuyer.firstName = co_firstName;
              cobuyer.lastName = co_lastName;
              cobuyer.userId = user._id
              cobuyer.isCoBorrowerProfile = true;
            }
            console.log("new cobuyer", cobuyer)
          } else {
            console.log("buyer(s) found!")
            console.log({
              profiles
            })
            buyer = profiles.filter(p => p._id + "" == user.borrowerProfile + "")[0]
            console.log(buyer);
            if (firstName) buyer.firstName = firstName;
            if (lastName) buyer.lastName = lastName;
            if (isCoBorrower) buyer.isCoBorrower = isCoBorrower
  
            if (isCoBorrower) {
              cobuyer = profiles.filter(p => p._id + "" == user.coBorrowerProfile + "")[0]
              if (co_firstName) cobuyer.firstName = co_firstName;
              if (co_lastName) cobuyer.lastName = co_lastName;
            }
          }
          console.log("buyer", buyer)
          buyer.save((err, buyer) => {
            console.log(err, buyer);
            if (err) return response.send(utils.createError("Couldn't save buyer!"))
            if (isCoBorrower) {
              console.log("before save cobuyer", cobuyer)
              cobuyer.save((err, cobuyer) => {
                console.log(err, cobuyer);
                if (err) return response.send(utils.createError("Couldn't save cobuyer!"))
                user.borrowerProfile = buyer._id;
                user.coBorrowerProfile = cobuyer._id;
                user.isCoBorrower = isCoBorrower;
                user.save((error, result) => {
                  console.log(error, result);
                  if (error) return response.send(utils.createError("Database error"))
                  response.send(utils.createSuccess({ buyer, cobuyer }));
                })
              })
            }
            else {
              user.borrowerProfile = buyer._id;
              user.isCoBorrower = isCoBorrower;
              user.save((error, result) => {
                console.log(error, result);
                if (error) return response.send(utils.createError("Database error"))
                response.send(utils.createSuccess({ buyer }));
              })
            }
          })
        })
      }
    })


})

router.post('/borrower/stepTwo/:userId?', function (request, response) {
  const { userId } = request.params;
  if (userId) request.userId = userId
  const { email, birthdate, street_address, city, state, zip, phone, isCoBorrower, homePhone, allStepsCompleted, leftAtStep, areaCode, device_token } = request.body
  const { co_email, co_birthdate, co_street_address, co_city, co_state, co_zip, co_areaCode, co_phone, co_homePhone } = request.body

  if (request.role == 'admin') {
    Admin.findOne({ _id: request.userId }, async (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('User not found'));
      } else {
        console.log({
          user
        })
        let result = {}
        if (user.borrowerProfile) {
          try {
            user.leftAtStep = user.leftAtStep < 2 ? 2 : user.leftAtStep
            let profile = await BuyerProfile.findByIdAndUpdate({ _id: user.borrowerProfile }, { ...request.body, leftAtStep: user.leftAtStep })
            result.buyer = profile;
  
            if (isCoBorrower && user.coBorrowerProfile) {
              let coBuyer = { leftAtStep: user.leftAtStep, email: co_email, birthdate: co_birthdate, street_address: co_street_address, city: co_city, state: co_state, zip: co_zip, phone: co_phone, homePhone: co_homePhone, areaCode: co_areaCode }
              let coprofile = await BuyerProfile.findByIdAndUpdate({ _id: user.coBorrowerProfile }, coBuyer)
              result.cobuyer = coprofile;
            }
  
            user.phone = phone
            await user.save()
            response.send(utils.createSuccess(result))
          } catch (ex) {
            console.log("Exception", ex);
            response.send(utils.createError("Something went wrong!", ex))
          }
        } else {
          response.send(utils.createError("Profile Not Created Yet!"))
        }
      }
    })
  }else {
    User.findOne({ _id: request.userId }, async (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('User not found'));
      } else {
        console.log({
          user
        })
        let result = {}
        if (user.borrowerProfile) {
          try {
            user.leftAtStep = user.leftAtStep < 2 ? 2 : user.leftAtStep
            let profile = await BuyerProfile.findByIdAndUpdate({ _id: user.borrowerProfile }, { ...request.body, leftAtStep: user.leftAtStep })
            result.buyer = profile;
  
            if (isCoBorrower && user.coBorrowerProfile) {
              let coBuyer = { leftAtStep: user.leftAtStep, email: co_email, birthdate: co_birthdate, street_address: co_street_address, city: co_city, state: co_state, zip: co_zip, phone: co_phone, homePhone: co_homePhone, areaCode: co_areaCode }
              let coprofile = await BuyerProfile.findByIdAndUpdate({ _id: user.coBorrowerProfile }, coBuyer)
              result.cobuyer = coprofile;
            }
  
            user.phone = phone
            await user.save()
            response.send(utils.createSuccess(result))
          } catch (ex) {
            console.log("Exception", ex);
            response.send(utils.createError("Something went wrong!", ex))
          }
        } else {
          response.send(utils.createError("Profile Not Created Yet!"))
        }
      }
    })
  }

})

router.post('/borrower/stepThree/:userId?', function (request, response) {
  const { userId } = request.params;
  if (userId) request.userId = userId
  /* for borrower */
  const { currently_living, monthlyfee, leaseEndDate, available_savings, marital_status, isCoBorrower, allStepsCompleted, leftAtStep, device_token } = request.body

  /* for co borrower */
  const { co_currently_living, co_monthlyfee, co_leaseEndDate, co_available_savings, co_marital_status } = request.body

  if (request.role == 'admin') {
    Admin.findOne({ _id: request.userId }, async (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('User not found'));
      } else {
        let result = {}
        if (user.borrowerProfile) {
          try {
            user.leftAtStep = user.leftAtStep < 3 ? 3 : user.leftAtStep
            let profile = await BuyerProfile.findByIdAndUpdate({ _id: user.borrowerProfile }, { ...request.body, leftAtStep: user.leftAtStep })
            result.buyer = profile;
            if (isCoBorrower) {
              let coBuyer = {
                currently_living: co_currently_living,
                monthlyfee: co_monthlyfee,
                leaseEndDate: co_leaseEndDate,
                available_savings: co_available_savings,
                marital_status: co_marital_status,
                leftAtStep: user.leftAtStep
              }
              let coprofile = await BuyerProfile.findByIdAndUpdate({ _id: user.coBorrowerProfile }, coBuyer)
              result.cobuyer = coprofile;
            }
  
            user.leftAtStep = user.leftAtStep < 3 ? 3 : user.leftAtStep
            await user.save()
            response.send(utils.createSuccess(result))
          } catch (ex) {
            console.log("Exception", ex);
            response.send(utils.createError("Something went wrong!", ex));
          }
        } else {
          response.send(utils.createError("Profile Not Created Yet!"))
        }
      }
    })
  }else {
    User.findOne({ _id: request.userId }, async (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('User not found'));
      } else {
        let result = {}
        if (user.borrowerProfile) {
          try {
            user.leftAtStep = user.leftAtStep < 3 ? 3 : user.leftAtStep
            let profile = await BuyerProfile.findByIdAndUpdate({ _id: user.borrowerProfile }, { ...request.body, leftAtStep: user.leftAtStep })
            result.buyer = profile;
            if (isCoBorrower) {
              let coBuyer = {
                currently_living: co_currently_living,
                monthlyfee: co_monthlyfee,
                leaseEndDate: co_leaseEndDate,
                available_savings: co_available_savings,
                marital_status: co_marital_status,
                leftAtStep: user.leftAtStep
              }
              let coprofile = await BuyerProfile.findByIdAndUpdate({ _id: user.coBorrowerProfile }, coBuyer)
              result.cobuyer = coprofile;
            }
  
            user.leftAtStep = user.leftAtStep < 3 ? 3 : user.leftAtStep
            await user.save()
            response.send(utils.createSuccess(result))
          } catch (ex) {
            console.log("Exception", ex);
            response.send(utils.createError("Something went wrong!", ex));
          }
        } else {
          response.send(utils.createError("Profile Not Created Yet!"))
        }
      }
    })
  }


})

router.post('/borrower/stepFour/:userId?', function (request, response) {
  const { userId } = request.params;
  if (userId) request.userId = userId
  const { employment_status, employer, No_of_years_Employed, former_employer, net_income, isCoBorrower, incomeFreq, FICOScore, allStepsCompleted, leftAtStep, rePosDate, device_token } = request.body

  const { co_employment_status, co_employer, co_No_of_years_Employed, co_former_employer, co_net_income, co_incomeFreq, co_FICOScore, co_rePosDate } = request.body

  if (request.role == 'admin') {
    Admin.findOne({ _id: request.userId }, async (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('User not found'));
      } else {
        let result = {};
        if (user.borrowerProfile) {
          try {
            user.leftAtStep = user.leftAtStep < 4 ? 4 : user.leftAtStep
            let profile = await BuyerProfile.findByIdAndUpdate({ _id: user.borrowerProfile }, { ...request.body, leftAtStep: user.leftAtStep })
            result.buyer = profile;
            if (isCoBorrower) {
              let coBuyer = {
                employment_status: co_employment_status,
                employer: co_employer,
                No_of_years_Employed: co_No_of_years_Employed,
                net_income: co_net_income,
                incomeFreq: co_incomeFreq,
                former_employer: co_former_employer,
                FICOScore: co_FICOScore,
                rePosDate: co_rePosDate,
                leftAtStep: user.leftAtStep
              }
              let coprofile = await BuyerProfile.findByIdAndUpdate({ _id: user.coBorrowerProfile }, coBuyer)
              result.cobuyer = coprofile;
            }
  
            user.leftAtStep = user.leftAtStep < 4 ? 4 : user.leftAtStep
            await user.save()
            response.send(utils.createSuccess(result))
          } catch (ex) {
            console.log("Exception", ex);
            response.send(utils.createError("Something went wrong!", ex));
          }
        } else {
          response.send(utils.createError("Profile Not Created Yet!"))
        }
      }
    })
  }else {
    User.findOne({ _id: request.userId }, async (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('User not found'));
      } else {
        let result = {};
        if (user.borrowerProfile) {
          try {
            user.leftAtStep = user.leftAtStep < 4 ? 4 : user.leftAtStep
            let profile = await BuyerProfile.findByIdAndUpdate({ _id: user.borrowerProfile }, { ...request.body, leftAtStep: user.leftAtStep })
            result.buyer = profile;
            if (isCoBorrower) {
              let coBuyer = {
                employment_status: co_employment_status,
                employer: co_employer,
                No_of_years_Employed: co_No_of_years_Employed,
                net_income: co_net_income,
                incomeFreq: co_incomeFreq,
                former_employer: co_former_employer,
                FICOScore: co_FICOScore,
                rePosDate: co_rePosDate,
                leftAtStep: user.leftAtStep
              }
              let coprofile = await BuyerProfile.findByIdAndUpdate({ _id: user.coBorrowerProfile }, coBuyer)
              result.cobuyer = coprofile;
            }
  
            user.leftAtStep = user.leftAtStep < 4 ? 4 : user.leftAtStep
            await user.save()
            response.send(utils.createSuccess(result))
          } catch (ex) {
            console.log("Exception", ex);
            response.send(utils.createError("Something went wrong!", ex));
          }
        } else {
          response.send(utils.createError("Profile Not Created Yet!"))
        }
      }
    })
  }

})

router.post('/borrower/stepFive/:userId?', function (request, response) {
  const { userId } = request.params;
  if (userId) request.userId = userId
  const { bills_current, financial_status, bankruptcy, dichargeDate, isCoBorrower, judgementSettled, foreClosureDate, allStepsCompleted, leftAtStep, studentLoanDate, studentLoanAmount, device_token, rePosDate } = request.body

  const { co_bills_current, co_financial_status, co_bankruptcy, co_dichargeDate, co_judgementSettled, co_foreClosureDate, co_studentLoanDate, co_studentLoanAmount, co_rePosDate } = request.body

  if (request.role == 'admin') {
    Admin.findOne({ _id: request.userId }, async (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('User not found'));
      } else {
        let result = {};
        if (user.borrowerProfile) {
          try {
            user.leftAtStep = user.leftAtStep < 5 ? 5 : user.leftAtStep
            let profile = await BuyerProfile.findByIdAndUpdate({ _id: user.borrowerProfile }, { leftAtStep: user.leftAtStep, ...request.body })
            result.buyer = profile;
            if (isCoBorrower) {
              let coBuyer = {
                bills_current: co_bills_current,
                financial_status: co_financial_status,
                bankruptcy: co_bankruptcy,
                dichargeDate: co_dichargeDate,
                judgementSettled: co_judgementSettled,
                foreClosureDate: co_foreClosureDate,
                studentLoanDate: co_studentLoanDate,
                studentLoanAmount: co_studentLoanAmount,
                rePosDate: co_rePosDate,
                leftAtStep: user.leftAtStep
              }
              let coprofile = await BuyerProfile.findByIdAndUpdate({ _id: user.coBorrowerProfile }, coBuyer)
              result.cobuyer = coprofile;
            }
            user.leftAtStep = user.leftAtStep < 5 ? 5 : user.leftAtStep
            await user.save()
            response.send(utils.createSuccess(result))
          } catch (ex) {
            console.log("Exception", ex);
            response.send(utils.createError("Something went wrong!", ex));
          }
        } else {
          response.send(utils.createError("Profile Not Created Yet!"))
        }
      }
    })
  }else {
    User.findOne({ _id: request.userId }, async (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('User not found'));
      } else {
        let result = {};
        if (user.borrowerProfile) {
          try {
            user.leftAtStep = user.leftAtStep < 5 ? 5 : user.leftAtStep
            let profile = await BuyerProfile.findByIdAndUpdate({ _id: user.borrowerProfile }, { leftAtStep: user.leftAtStep, ...request.body })
            result.buyer = profile;
            if (isCoBorrower) {
              let coBuyer = {
                bills_current: co_bills_current,
                financial_status: co_financial_status,
                bankruptcy: co_bankruptcy,
                dichargeDate: co_dichargeDate,
                judgementSettled: co_judgementSettled,
                foreClosureDate: co_foreClosureDate,
                studentLoanDate: co_studentLoanDate,
                studentLoanAmount: co_studentLoanAmount,
                rePosDate: co_rePosDate,
                leftAtStep: user.leftAtStep
              }
              let coprofile = await BuyerProfile.findByIdAndUpdate({ _id: user.coBorrowerProfile }, coBuyer)
              result.cobuyer = coprofile;
            }
            user.leftAtStep = user.leftAtStep < 5 ? 5 : user.leftAtStep
            await user.save()
            response.send(utils.createSuccess(result))
          } catch (ex) {
            console.log("Exception", ex);
            response.send(utils.createError("Something went wrong!", ex));
          }
        } else {
          response.send(utils.createError("Profile Not Created Yet!"))
        }
      }
    })
  }
  

})

router.post('/borrower/stepSix/:userId?', function (request, response) {
  const { userId } = request.params;
  if (userId) request.userId = userId
  const { federal_department, other_department, federal_employee, veteran, honorably_discharged, allStepsCompleted, leftAtStep, isCoBorrower, device_token } = request.body
  const { co_federal_department, co_other_department, co_federal_employee, co_veteran, co_honorably_discharged, } = request.body

  if (request.role == 'admin') {
    Admin.findOne({ _id: request.userId }, async (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('User not found'));
      } else {
        let result = {};
        if (user.borrowerProfile) {
          try {
            user.leftAtStep = user.leftAtStep < 6 ? 6 : user.leftAtStep
            let profile = await BuyerProfile.findByIdAndUpdate({ _id: user.borrowerProfile }, { leftAtStep: user.leftAtStep, ...request.body })
            result.buyer = profile;
            if (isCoBorrower) {
              let coBuyer = {
                federal_department: co_federal_department,
                federal_employee: co_federal_employee,
                other_department: co_other_department,
                veteran: co_veteran,
                honorably_discharged: co_honorably_discharged,
                leftAtStep: user.leftAtStep
              }
              let coprofile = await BuyerProfile.findByIdAndUpdate({ _id: user.coBorrowerProfile }, coBuyer)
              result.cobuyer = coprofile;
            }
            user.leftAtStep = user.leftAtStep < 6 ? 6 : user.leftAtStep
            await user.save()
            response.send(utils.createSuccess(result))
          } catch (ex) {
            console.log("Exception", ex);
            response.send(utils.createError("Something went wrong!", ex));
          }
        } else {
          response.send(utils.createError("Profile Not Created Yet!"))
        }
      }
    })
  }else {
    User.findOne({ _id: request.userId }, async (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('User not found'));
      } else {
        let result = {};
        if (user.borrowerProfile) {
          try {
            user.leftAtStep = user.leftAtStep < 6 ? 6 : user.leftAtStep
            let profile = await BuyerProfile.findByIdAndUpdate({ _id: user.borrowerProfile }, { leftAtStep: user.leftAtStep, ...request.body })
            result.buyer = profile;
            if (isCoBorrower) {
              let coBuyer = {
                federal_department: co_federal_department,
                federal_employee: co_federal_employee,
                other_department: co_other_department,
                veteran: co_veteran,
                honorably_discharged: co_honorably_discharged,
                leftAtStep: user.leftAtStep
              }
              let coprofile = await BuyerProfile.findByIdAndUpdate({ _id: user.coBorrowerProfile }, coBuyer)
              result.cobuyer = coprofile;
            }
            user.leftAtStep = user.leftAtStep < 6 ? 6 : user.leftAtStep
            await user.save()
            response.send(utils.createSuccess(result))
          } catch (ex) {
            console.log("Exception", ex);
            response.send(utils.createError("Something went wrong!", ex));
          }
        } else {
          response.send(utils.createError("Profile Not Created Yet!"))
        }
      }
    })
  }
  

})

router.post('/borrower/stepSeven/:userId?', function (request, response) {
  const { userId } = request.params;
  if (userId) request.userId = userId
  const { listened_about_us, allStepsCompleted, leftAtStep, } = request.body

  if (request.role == 'admin') {
    Admin.findOne({ _id: request.userId }, (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('User not found'));
      } else {
        if (user.borrowerProfile) {
          BuyerProfile.findOne({ _id: user.borrowerProfile }, (err, profile) => {
            console.log(profile)
            if (err) {
              response.send(utils.createError('Database error'));
            } else if (!profile) {
              return response.send(utils.createError("Profile not found!"))
            } else {
              user.leftAtStep = user.leftAtStep < 7 ? 7 : user.leftAtStep
              profile.leftAtStep = user.leftAtStep;
              profile.allStepsCompleted = true;
              if (listened_about_us) profile.listened_about_us = listened_about_us;
  
              profile.save(async (err, profile) => {
                console.log(err, profile);
                if (err) return response.send(utils.createError("Couldn't save profile!"))
                user.isProfileComplete = true
                user.allStepsCompleted = true
                user.leftAtStep = user.leftAtStep < 7 ? 7 : user.leftAtStep
                await user.save()
                // response.send(utils.createSuccess(profile));
  
                let title = `${user.fullName} Completed Profile `;
                let message = `${user.fullName} has completed his/her profile for ${user.role} application.`
                let messageHtml = `<h3>Hello!</h3><p>${user.fullName} has completed his/her profile for ${user.role} application.</p><p>US Housing Exchange</p>`
  
                if (user.referredBy) {
                  /* Text Notifications alerting an affiliate user that a buyer or seller using their registration code completed application */
                  User.findOne({ referalCode: user.referredBy, deleted: false, role: 'affiliate' }, (errAff, affiliate) => {
                    if (!errAff && affiliate) {
                      console.log({
                        "AFFiliate": affiliate
                      })
                      messageSmsAffiliate = `Hello! ${user.fullName} has submitted a new ${user.role} application using your referral code (${user.referredBy}). US Housing Exchange`;
  
                      mailer.sendSMS((affiliate.phone[0] != '+' ? `+1${affiliate.phone}` : affiliate.phone), messageSmsAffiliate, (err, data) => {
                        console.log("Affiliate Text Notifications For ", err, data);
  
                        // notification message of referral to admin
                        refrlMsgToAdmin = `${user.fullName} has submitted a new ${user.role} application using referral code (${user.referredBy}) of ${affiliate.fullName} (${affiliate.role}).`;
  
                        refrlHtmlToAdmin = `<h3>Hello!</h3><p>${user.fullName} has submitted a new ${user.role} application using referral code (${user.referredBy}) of ${affiliate.fullName} (${affiliate.role}).</p><br><p>US Housing Exchange</p>`;
  
                        return profileCompleteNotifications(profile, title, refrlMsgToAdmin, refrlHtmlToAdmin, user, response);
  
                      });
                    }
                  });
                } else {
                  return profileCompleteNotifications(profile, title, message, messageHtml, user, response);
                }
              })
            }
          })
        } else {
          response.send(utils.createError("Profile Not Created Yet!"))
        }
      }
    })
  }else {
    User.findOne({ _id: request.userId }, (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('User not found'));
      } else {
        if (user.borrowerProfile) {
          BuyerProfile.findOne({ _id: user.borrowerProfile }, (err, profile) => {
            console.log(profile)
            if (err) {
              response.send(utils.createError('Database error'));
            } else if (!profile) {
              return response.send(utils.createError("Profile not found!"))
            } else {
              user.leftAtStep = user.leftAtStep < 7 ? 7 : user.leftAtStep
              profile.leftAtStep = user.leftAtStep;
              profile.allStepsCompleted = true;
              if (listened_about_us) profile.listened_about_us = listened_about_us;
  
              profile.save(async (err, profile) => {
                console.log(err, profile);
                if (err) return response.send(utils.createError("Couldn't save profile!"))
                user.isProfileComplete = true
                user.allStepsCompleted = true
                user.leftAtStep = user.leftAtStep < 7 ? 7 : user.leftAtStep
                await user.save()
                // response.send(utils.createSuccess(profile));
  
                let title = `${user.fullName} Completed Profile `;
                let message = `${user.fullName} has completed his/her profile for ${user.role} application.`
                let messageHtml = `<h3>Hello!</h3><p>${user.fullName} has completed his/her profile for ${user.role} application.</p><p>US Housing Exchange</p>`
  
                if (user.referredBy) {
                  /* Text Notifications alerting an affiliate user that a buyer or seller using their registration code completed application */
                  User.findOne({ referalCode: user.referredBy, deleted: false, role: 'affiliate' }, (errAff, affiliate) => {
                    if (!errAff && affiliate) {
                      console.log({
                        "AFFiliate": affiliate
                      })
                      messageSmsAffiliate = `Hello! ${user.fullName} has submitted a new ${user.role} application using your referral code (${user.referredBy}). US Housing Exchange`;
  
                      mailer.sendSMS((affiliate.phone[0] != '+' ? `+1${affiliate.phone}` : affiliate.phone), messageSmsAffiliate, (err, data) => {
                        console.log("Affiliate Text Notifications For ", err, data);
  
                        // notification message of referral to admin
                        refrlMsgToAdmin = `${user.fullName} has submitted a new ${user.role} application using referral code (${user.referredBy}) of ${affiliate.fullName} (${affiliate.role}).`;
  
                        refrlHtmlToAdmin = `<h3>Hello!</h3><p>${user.fullName} has submitted a new ${user.role} application using referral code (${user.referredBy}) of ${affiliate.fullName} (${affiliate.role}).</p><br><p>US Housing Exchange</p>`;
  
                        return profileCompleteNotifications(profile, title, refrlMsgToAdmin, refrlHtmlToAdmin, user, response);
  
                      });
                    }
                  });
                } else {

                  return profileCompleteNotifications(profile, title, message, messageHtml, user, response);
                }
              })
            }
          })
        } else {
          response.send(utils.createError("Profile Not Created Yet!"))
        }
      }
    })
  }

})

/**
 * Not saving setep 8 data
 */
router.post('/borrower/stepEight/:userId?', function (request, response) {

  const { userId } = request.params;
  if (userId) request.userId = userId
  const { maxMortgagePayment, zipCodes, bedrooms, bathrooms, allStepsCompleted, leftAtStep, } = request.body

  if (request.role == 'admin') {
    Admin.findOne({ _id: request.userId }, (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('User not found'));
      } else {
        if (user.borrowerProfile) {
          BuyerProfile.findOne({ _id: user.borrowerProfile }, (err, profile) => {
            // console.log(profile)
            if (err) {
              response.send(utils.createError('Database error'));
            } else if (!profile) {
              return response.send(utils.createError("Profile not found!"))
            } else {

              user.leftAtStep = user.leftAtStep < 8 ? 8 : user.leftAtStep
              profile.leftAtStep = user.leftAtStep
              if (maxMortgagePayment) profile.maxMortgagePayment = maxMortgagePayment
              if (zipCodes) profile.zipCodes = zipCodes
              if (bedrooms) profile.bedrooms = bedrooms
              if (bathrooms) profile.bathrooms = bathrooms
              profile.allStepsCompleted = allStepsCompleted || true
  
  
              profile.save(async (errProfile, profile) => {
                // console.log(errProfile, profile);
                if (errProfile) return response.send(utils.createError("Couldn't save profile!"))
                user.isProfileComplete = true
                user.leftAtStep = user.leftAtStep < 8 ? 8 : user.leftAtStep
                user.allStepsCompleted = true
                await user.save()
  
              })
            }
          })
        } else {
          response.send(utils.createError("Profile Not Created Yet!"))
        }
      }
    })
  }else {
    User.findOne({ _id: request.userId }, (error, user) => {
      if (error) {
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('User not found'));
      } else {
        if (user.borrowerProfile) {
          BuyerProfile.findOne({ _id: user.borrowerProfile }, (err, profile) => {
            // console.log(profile)
            if (err) {
              response.send(utils.createError('Database error'));
            } else if (!profile) {
              return response.send(utils.createError("Profile not found!"))
            } else {
              // console.log('profile..........',profile)
              
              //  console.log('user..........',user)
              user.leftAtStep = user.leftAtStep < 8 ? 8 : user.leftAtStep
              profile.leftAtStep = user.leftAtStep
              if (maxMortgagePayment) profile.maxMortgagePayment = maxMortgagePayment
              if (zipCodes) profile.zipCodes = zipCodes
              if (bedrooms) profile.bedrooms = bedrooms
              if (bathrooms) profile.bathrooms = bathrooms
              profile.allStepsCompleted = allStepsCompleted || true
  
  
              profile.save(async (errProfile, profile) => {
                // console.log('er',errProfile, 'res',profile);
                if (errProfile) return response.send(utils.createError("Couldn't save profile!"))
                  
                 user.isProfileComplete = true
                user.leftAtStep = user.leftAtStep < 8 ? 8 : user.leftAtStep
                user.allStepsCompleted = true
                await user.save()
                 let title = `${user.fullName} Completed Profile `;
                let message = `${user.fullName} has completed his/her profile for ${user.role} application.`
                let messageHtml = `<h3>Hello!</h3><p>${user.fullName} has completed his/her profile for ${user.role} application.</p><p>US Housing Exchange</p>`
                  if(profile){
                  return profileCompleteNotifications(profile, title, message, messageHtml, user, response);
               
                  }
                  else{
                     response.send(utils.createError("Unbale to Processed!"))
                  }
               
               // console.log('test............',user.save(), 'user',user);
                 // return profileCompleteNotifications(profile,  user, response);
  
              })
            }
          })
        } else {
          response.send(utils.createError("Profile Not Created Yet!"))
        }
      }
    })
  }

})


router.post('/borrower/prequalify/:userId?', upload.fields([{
  name: 'driverLicense', maxCount: 2
}, {
  name: 'recentPaycheck', maxCount: 2
}, {
  name: 'twoYearW2', maxCount: 2
}, {
  name: 'twoYearReturn', maxCount: 2
}, {
  name: 'bankStatement', maxCount: 2
}, {
  name: 'experianCD', maxCount: 2
}, {
  name: 'transunionCD', maxCount: 2
}, {
  name: 'equifaxCD', maxCount: 2
}]), function (request, response) {
  const { userId } = request.params;
  if (userId) request.userId = userId
  const { driverLicense, recentPaycheck, twoYearW2, twoYearReturn, bankStatement,
    experianCD, transunionCD, equifaxCD,
    iiqUsername, iiqPassword, iiqSSN4Digit, iiqSecurityQuestion, iiqSecurityAnswer, device_token } = request.body


  User.findOne({ _id: request.userId }, async (error, user) => {
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {
      console.log({
        user
      })
      let result = {}
      let buyerProfile
      if (!user.borrowerProfile) {
        let names = user.fullName.split(' ');
        buyerProfile = new BuyerProfile({ userId: user._id, firstName: names[0], lastName: names[1] })
        await buyerProfile.save();
        user.borrowerProfile = buyerProfile._id;
      }

      if (user.borrowerProfile) {
        try {
          let profile = await BuyerProfile.findById(user.borrowerProfile)
          let filesError = {};
          let isError = false;

          if (iiqUsername || iiqPassword || iiqSSN4Digit || iiqSecurityQuestion || iiqSecurityAnswer) {
            if (iiqUsername && iiqPassword && iiqSSN4Digit && iiqSecurityQuestion && iiqSecurityAnswer) {
              if (iiqUsername) profile.iiqUsername = iiqUsername
              if (iiqPassword) profile.iiqPassword = iiqPassword
              if (iiqSSN4Digit) profile.iiqSSN4Digit = iiqSSN4Digit
              if (iiqSecurityQuestion) profile.iiqSecurityQuestion = iiqSecurityQuestion
              if (iiqSecurityAnswer) profile.iiqSecurityAnswer = iiqSecurityAnswer
            } else {
              isError = true;
              filesError['identityIQ'] = "All Identity IQ fields are required"
            }
          }

          if (request.files) {

            console.log('File uploaded successfully.');
            // console.log(request.files)
            //response.send(utils.createResult(error,request.files));


            let files = request.files['driverLicense'];
            if (files) {
              // console.log("driverLicense", files);
              for (let i = 0; i < files.length; i++) {
                let file = files[i];
                // console.log("extracted", file);
                profile.driverLicense = `uploads/users/${file.filename}`;
              }
            }
            else {
              filesError['driverLicense'] = "Drivers License is required"
              isError = true;
            }
            files = request.files['recentPaycheck'];
            if (files) {
              // console.log("recentPaycheck", files);
              for (let i = 0; i < files.length; i++) {
                let file = files[i];
                // console.log("extracted", file);
                profile.recentPaycheck = `uploads/users/${file.filename}`;
              }
            }
            else {
              filesError['recentPaycheck'] = "Recent Paycheck is required"
              isError = true;
            }
            files = request.files['twoYearW2'];
            if (files) {
              // console.log("twoYearW2", files);
              profile.twoYearW2 = []
              for (let i = 0; i < files.length; i++) {
                let file = files[i];
                // console.log("extracted", file);

                profile.twoYearW2.push(`uploads/users/${file.filename}`);
              }
            }
            else {
              filesError['twoYearW2'] = "2 year's W2 is required"
              isError = true;
            }
            files = request.files['twoYearReturn'];
            if (files) {
              // console.log("twoYearReturn", files);
              profile.twoYearReturn = []
              for (let i = 0; i < files.length; i++) {
                let file = files[i];
                // console.log("extracted", file);

                profile.twoYearReturn.push(`uploads/users/${file.filename}`);
              }
            }
            else {
              filesError['twoYearReturn'] = "2 Years Tax Return is required"
              isError = true;
            }
            files = request.files['bankStatement'];
            if (files) {
              // console.log("bankStatement", files);
              for (let i = 0; i < files.length; i++) {
                let file = files[i];
                // console.log("extracted", file);
                profile.bankStatement = `uploads/users/${file.filename}`;
              }
            }
            else {
              filesError['bankStatement'] = "Bank Statement is required"
              isError = true;
            }
            files = request.files['experianCD'];
            if (files) {
              // console.log("experianCD", files);
              for (let i = 0; i < files.length; i++) {
                let file = files[i];
                // console.log("extracted", file);
                profile.experianCD = `uploads/users/${file.filename}`;
              }
            }
            files = request.files['transunionCD'];
            if (files) {
              // console.log("transunionCD", files);
              for (let i = 0; i < files.length; i++) {
                let file = files[i];
                // console.log("extracted", file);
                profile.transunionCD = `uploads/users/${file.filename}`;
              }
            }
            files = request.files['equifaxCD'];
            if (files) {
              // console.log("equifaxCD", files);
              for (let i = 0; i < files.length; i++) {
                let file = files[i];
                // console.log("extracted", file);
                profile.equifaxCD = `uploads/users/${file.filename}`;
              }
            }
          }

          if (isError) {
            console.log({
              isError,
              filesError
            })
            return response.send(utils.createError(filesError))
          }

          await profile.save();

          user.isPrequalifyDone = true;
          await user.save()
          let title = `${user.fullName} has submitted prequalification!`;
          let message = `${user.fullName} has submitted his/her prequalification for ${user.role} application.`
          mailer.createNotification(user._id, title, message, 'admin', 'applicationdetail', (er, data) => {
            console.log({ er, data });
            message = `<h3>Hello Admin!</h3><h5>${user.fullName} has submitted his/her prequalification for ${user.role} application.</h5><h5>Team US Housing Exchange</h5>`
            mailer.sendEmail('admin@ushousingexchange.com', title, message, (er, data) => {
              console.log({ er, data });
              response.send(utils.createSuccess(profile.prequalify()))
            })

          });

        } catch (ex) {
          console.log("Exception", ex);
          response.send(utils.createError("Something went wrong!", ex))
        }
      } else {
        response.send(utils.createError("Profile Not Created Yet!"))
      }
    }
  })
})


/* To get the user  approved status*/
router.post('/user-application-status/:userId', function (request, response) {
  const { userId } = request.params;
  User.findOne({ _id: userId }, (error, user) => {
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {
      let data = {
        deleted: user.deleted,
        status: user.status,
        approved: user.approved,
        leftAtStep: user.leftAtStep,
        isProfileComplete: user.isProfileComplete,
        isPrequalifyDone: user.isPrequalifyDone,
        allStepsCompleted: user.allStepsCompleted,
        isCoBorrower: user.isCoBorrower
      }
      response.send(utils.createSuccess(data))
    }
  });
})

/* To ge user application status */
router.get('/application/:userId', function (request, response) {
  const { userId } = request.params;
  User.findOne({ _id: userId, deleted: false }, (error, user) => {
    console.log("user", error, user)
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else if (user['role'] === "seller") {
      let application = {};
      SellerProfile.findOne({ userId }, (err, profile) => {
        console.log({ profile });
        if (err) {
          response.send(utils.createError('Database error'));
        } else if (!profile) {
          response.send(utils.createError('Application Details not found'));
        } else {
          application.stepOne = profile.stepOne();
          application.stepTwo = profile.stepTwo();
          application.stepThree = profile.stepThree();
          application.stepFour = profile.stepFour();
          application.leftAtStep = user.leftAtStep
          application.status = user.status
          application.approved = user.approved
          application.role = user.role

          response.send(utils.createSuccess(application))
        }
      })

    } else if (user['role'] === "contractor") {
      let application = {};
      ContractorProfile.findOne({ userId }, (err, profile) => {
        console.log({ profile });
        if (err) {
          response.send(utils.createError('Database error'));
        } else if (!profile) {
          response.send(utils.createError('Application Details not found'));
        } else {
          application.stepOne = profile.stepOne();
          application.stepTwo = profile.stepTwo();
          application.leftAtStep = user.leftAtStep
          application.status = user.status
          application.approved = user.approved
          application.role = user.role

          response.send(utils.createSuccess(application))
        }
      })
    } else if (user['role'] === "buyer") {
      let application = {};
      BuyerProfile.find({ userId }, async (err, profiles) => {

        if (err) {
          response.send(utils.createError('Database error'));
        } else if (!profiles) {
          response.send(utils.createError('Application Details not found'));
        } else {

          let borrower = await BuyerProfile.findById(user.borrowerProfile)
          let coBorrower = await BuyerProfile.findById(user.coBorrowerProfile)

          console.log("borrowers", borrower, coBorrower)

          let temp = {};
          let temp2 = {};
          if (borrower) {
            temp.prequalify = borrower.prequalify();
            temp.stepOne = borrower.stepOne();
            temp.stepTwo = borrower.stepTwo();
            temp.stepThree = borrower.stepThree();
            temp.stepFour = borrower.stepFour();
            temp.stepFive = borrower.stepFive();
            temp.stepSix = borrower.stepSix();
            temp.stepSeven = borrower.stepSeven();
            temp.stepEight = borrower.stepEight();
            temp.leftAtStep = borrower.leftAtStep
            application.borrower = temp;
          }
          if (coBorrower) {
            temp2.stepOne = coBorrower.stepOne();
            temp2.stepTwo = coBorrower.stepTwo();
            temp2.stepThree = coBorrower.stepThree();
            temp2.stepFour = coBorrower.stepFour();
            temp2.stepFive = coBorrower.stepFive();
            temp2.stepSix = coBorrower.stepSix();
            temp2.stepSeven = coBorrower.stepSeven();
            temp2.stepEight = coBorrower.stepEight();
            temp2.leftAtStep = coBorrower.leftAtStep
            application.coBorrower = temp2;
          }

          application.role = user.role
          application.deleted = user.deleted
          application.status = user.status
          application.approved = user.approved
          application.leftAtStep = user.leftAtStep
          application.isProfileComplete = user.isProfileComplete
          application.isPrequalifyDone = user.isPrequalifyDone
          application.allStepsCompleted = user.allStepsCompleted
          application.isCoBorrower = user.isCoBorrower

          response.send(utils.createSuccess(application))
        }
      })

    } else {
      let application = {};
      application.stepOne = user
      response.send(utils.createSuccess(application))
    }
  })

})

/*-------------------|| Co Borrower Info ||---------------------*/

//#region Co Borrower Info

router.post('/coborrower/stepOne', function (request, response) {

  const { firstName, lastName, isCoBorrower, device_token } = request.body
  const user = new User()
  User.findOne({ _id: request.userId }, (error, user) => {
    console.log(user)
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {

      BuyerProfile.findOne({ userId: request.userId, isCoBorrowerProfile: true }, (err, profile) => {
        console.log(profile)
        if (err) {
          response.send(utils.createError('Database error'));
        } else if (!profile) {
          profile = new BuyerProfile();
          profile.firstName = firstName;
          profile.lastName = lastName;
          profile.userId = user._id
          profile.isCoBorrowerProfile = true;

        } else {
          if (firstName) profile.firstName = firstName;
          if (lastName) profile.lastName = lastName;
        }
        profile.save((err, profile) => {
          console.log(err, profile);
          if (err) return response.send(utils.createError("Couldn't save profile!"))
          user.coBorrowerProfile = profile._id;
          user.isCoBorrower = true;
          user.save((error, result) => {
            console.log(error, result);
            if (error) return response.send(utils.createError("Database error"))
            response.send(utils.createSuccess(profile));
          })
        })
      })
    }
  })

})

router.post('/coborrower/stepTwo', function (request, response) {
  const { email, birthdate, street_address, city, state, zip, phone, areaCode, homePhone, device_token } = request.body

  User.findOne({ _id: request.userId }, (error, user) => {
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {
      if (user.borrowerProfile) {
        BuyerProfile.findOne({ _id: user.coBorrowerProfile }, (err, profile) => {
          console.log(profile)
          if (err) {
            response.send(utils.createError('Database error'));
          } else if (!profile) {
            return response.send(utils.createError("Profile not found!"))
          } else {
            if (email) profile.email = email;
            if (birthdate) profile.birthdate = birthdate;
            if (street_address) profile.street_address = street_address
            if (city) profile.city = city;
            if (state) profile.state = state;
            if (zip) profile.zip = zip;
            if (phone) profile.phone = phone;
            if (areaCode) profile.areaCode = areaCode;
            if (homePhone) profile.homePhone = homePhone;
            profile.save((err, profile) => {
              console.log(err, profile);
              if (err) return response.send(utils.createError("Couldn't save profile!"))
              response.send(utils.createSuccess(profile));
            })
          }
        })
      } else {
        response.send(utils.createError("Profile Not Created Yet!"))
      }
    }
  })

})

router.post('/coborrower/stepThree', function (request, response) {
  const { currently_living, monthlyfee, leaseEndDate, available_savings, marital_status, device_token } = request.body

  User.findOne({ _id: request.userId }, (error, user) => {
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {
      if (user.borrowerProfile) {
        BuyerProfile.findOne({ _id: user.coBorrowerProfile }, (err, profile) => {
          console.log(profile)
          if (err) {
            response.send(utils.createError('Database error'));
          } else if (!profile) {
            return response.send(utils.createError("Profile not found!"))
          } else {
            if (currently_living) profile.currently_living = currently_living;
            if (monthlyfee) profile.monthlyfee = monthlyfee;
            if (leaseEndDate) profile.leaseEndDate = leaseEndDate
            if (available_savings) profile.available_savings = available_savings;
            if (marital_status) profile.marital_status = marital_status;

            profile.save((err, profile) => {
              console.log(err, profile);
              if (err) return response.send(utils.createError("Couldn't save profile!"))
              response.send(utils.createSuccess(profile));
            })
          }
        })
      } else {
        response.send(utils.createError("Profile Not Created Yet!"))
      }
    }
  })

})

router.post('/coborrower/stepFour', function (request, response) {
  const { employment_status, employer, No_of_years_Employed, net_income, incomeFreq, FICOScore } = request.body

  User.findOne({ _id: request.userId }, (error, user) => {
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {
      if (user.borrowerProfile) {
        BuyerProfile.findOne({ _id: user.coBorrowerProfile }, (err, profile) => {
          console.log(profile)
          if (err) {
            response.send(utils.createError('Database error'));
          } else if (!profile) {
            return response.send(utils.createError("Profile not found!"))
          } else {
            if (employment_status) profile.employment_status = employment_status;
            if (employer) profile.employer = employer;
            if (No_of_years_Employed) profile.No_of_years_Employed = No_of_years_Employed
            if (net_income) profile.net_income = net_income;
            if (incomeFreq) profile.incomeFreq = incomeFreq;
            if (FICOScore) profile.FICOScore = FICOScore;

            profile.save((err, profile) => {
              console.log(err, profile);
              if (err) return response.send(utils.createError("Couldn't save profile!"))
              response.send(utils.createSuccess(profile));
            })
          }
        })
      } else {
        response.send(utils.createError("Profile Not Created Yet!"))
      }
    }
  })

})

router.post('/coborrower/stepFive', function (request, response) {
  const { bills_current, financial_status, bankruptcy, dichargeDate, judgementSettled, foreClosureDate, studentLoanDate, studentLoanAmount } = request.body

  User.findOne({ _id: request.userId }, (error, user) => {
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {
      if (user.borrowerProfile) {
        BuyerProfile.findOne({ _id: user.coBorrowerProfile }, (err, profile) => {
          console.log(profile)
          if (err) {
            response.send(utils.createError('Database error'));
          } else if (!profile) {
            return response.send(utils.createError("Profile not found!"))
          } else {
            if (bills_current) profile.bills_current = bills_current;
            if (financial_status) profile.financial_status = financial_status;
            if (bankruptcy) profile.bankruptcy = bankruptcy;
            if (dichargeDate) profile.dichargeDate = dichargeDate;
            if (judgementSettled) profile.judgementSettled = judgementSettled;
            if (foreClosureDate) profile.foreClosureDate = foreClosureDate;
            if (studentLoanDate) profile.studentLoanDate = studentLoanDate;
            if (studentLoanAmount) profile.studentLoanAmount = studentLoanAmount;

            profile.save((err, profile) => {
              console.log(err, profile);
              if (err) return response.send(utils.createError("Couldn't save profile!"))
              response.send(utils.createSuccess(profile));
            })
          }
        })
      } else {
        response.send(utils.createError("Profile Not Created Yet!"))
      }
    }
  })

})

router.post('/coborrower/stepSix', function (request, response) {
  const { federal_department, federal_employee } = request.body

  User.findOne({ _id: request.userId }, (error, user) => {
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {
      if (user.borrowerProfile) {
        BuyerProfile.findOne({ _id: user.coBorrowerProfile }, (err, profile) => {
          console.log(profile)
          if (err) {
            response.send(utils.createError('Database error'));
          } else if (!profile) {
            return response.send(utils.createError("Profile not found!"))
          } else {
            if (federal_employee) profile.federal_employee = federal_employee;
            if (federal_department) profile.federal_department = federal_department;

            profile.save(async (err, profile) => {
              console.log(err, profile);
              if (err) return response.send(utils.createError("Couldn't save profile!"))
              user.isProfileComplete = true
              user.allStepsCompleted = true
              await user.save()
              response.send(utils.createSuccess(profile));
            })
          }
        })
      } else {
        response.send(utils.createError("Profile Not Created Yet!"))
      }
    }
  })

})

//#endregion



/**
 * -----------------------Sellers Steps--------------------------------------------
 */

//#region  Sellers Steps

router.post('/seller/stepOne/:userId?', function (request, response) {

  const { firstName, lastName, email, areaCode, phone, street_address, city,
    state, zip, allStepsCompleted, leftAtStep, device_token } = request.body

  /* if params has userId then affiliate/admin is adding seller */
  const { userId } = request.params;
  if (userId) request.userId = userId


  console.log({
    userId: request.userId
  });
  User.findOne({ _id: request.userId }, (error, user) => {
    console.log(user)
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {
      SellerProfile.findOne({ userId: request.userId }, async (err, profile) => {
        console.log(profile)
        if (err) {
          response.send(utils.createError('Database error'));
        } else if (!profile) {
          console.log("no profile yet")
          profile = new SellerProfile();
          profile.firstName = firstName
          profile.lastName = lastName
          profile.email = email
          profile.areaCode = areaCode
          profile.phone = phone
          profile.street_address = street_address
          profile.city = city
          profile.state = state
          profile.zip = zip
          profile.userId = user._id
          profile.allStepsCompleted = allStepsCompleted
          profile.leftAtStep = leftAtStep
          user.leftAtStep = 1

        } else {
          console.log("profile found!")
          if (firstName) profile.firstName = firstName;
          if (lastName) profile.lastName = lastName;
          if (email) profile.email = email;
          if (areaCode) profile.areaCode = areaCode;
          if (phone) profile.phone = phone;
          if (street_address) profile.street_address = street_address;
          if (city) profile.city = city;
          if (state) profile.state = state;
          if (zip) profile.zip = zip;
        }
        console.log("profile", profile)
        profile.save((err, profile) => {
          console.log(err, profile);
          if (err) return response.send(utils.createError("Couldn't save profile!"))
          user.sellerProfile = profile._id;
          user.phone = phone
          user.save(async (error, result) => {
            console.log(error, result);
            if (error) return response.send(utils.createError("Database error"))
            await user.save()
            response.send(utils.createSuccess(profile));
          })
        })
      })
    }
  })
})

router.post('/seller/stepTwo/:userId?', function (request, response) {
  const { isForeclose, mortgagePayments, mortgageProperty, allStepsCompleted, leftAtStep } = request.body

  /* if params has userId then affiliate/admin is adding seller */
  const { userId } = request.params;
  if (userId) request.userId = userId

  User.findOne({ _id: request.userId }, (error, user) => {
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {
      console.log({
        user
      })
      if (user.sellerProfile) {
        SellerProfile.findOne({ _id: user.sellerProfile }, (err, profile) => {
          console.log(profile)
          if (err) {
            response.send(utils.createError('Database error'));
          } else if (!profile) {
            return response.send(utils.createError("Profile not found!"))
          } else {
            if (isForeclose) profile.isForeclose = isForeclose
            if (mortgagePayments) profile.mortgagePayments = mortgagePayments
            if (mortgageProperty) profile.mortgageProperty = mortgageProperty
            if (allStepsCompleted) profile.allStepsCompleted = allStepsCompleted
            if (leftAtStep) profile.leftAtStep = leftAtStep

            profile.save(async (err, profile) => {
              console.log(err, profile);
              if (err) return response.send(utils.createError("Couldn't save profile!"))
              user.leftAtStep = user.leftAtStep < 2 ? 2 : user.leftAtStep
              await user.save()
              response.send(utils.createSuccess(profile));
            })
          }
        })
      } else {
        response.send(utils.createError("Profile Not Created Yet!"))
      }
    }
  })

})

router.post('/seller/stepThree/:userId?', uploadSellers.single('appraisalFile'), function (request, response) {
  const { askingPrice, knowPropertyVal, propertyValue, propertyAppraisal, allStepsCompleted, leftAtStep, appraisalFile, propertyDetails } = request.body

  /* if params has userId then affiliate/admin is adding seller */
  const { userId } = request.params;
  if (userId) request.userId = userId

  User.findOne({ _id: request.userId }, (error, user) => {
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {
      if (user.sellerProfile) {
        SellerProfile.findOne({ _id: user.sellerProfile }, (err, profile) => {
          console.log(profile)
          if (err) {
            response.send(utils.createError('Database error'));
          } else if (!profile) {
            return response.send(utils.createError("Profile not found!"))
          } else {
            if (askingPrice) profile.askingPrice = askingPrice
            if (knowPropertyVal) profile.knowPropertyVal = knowPropertyVal
            if (propertyValue) profile.propertyValue = propertyValue
            if (propertyAppraisal) profile.propertyAppraisal = propertyAppraisal

            if (propertyDetails) profile.propertyDetails = propertyDetails
            if (allStepsCompleted) profile.allStepsCompleted = allStepsCompleted
            if (leftAtStep) profile.leftAtStep = leftAtStep

            if (request.file) {
              console.log('File uploaded successfully.');
              console.log(request.file)
              profile.appraisalFile = `uploads/sellers/${request.file.filename}`;
            }

            profile.save(async (err, profile) => {
              console.log(err, profile);
              if (err) return response.send(utils.createError("Couldn't save profile!"))
              user.leftAtStep = user.leftAtStep < 3 ? 3 : user.leftAtStep
              await user.save()
              response.send(utils.createSuccess(profile));
            })
          }
        })
      } else {
        response.send(utils.createError("Profile Not Created Yet!"))
      }
    }
  })
})

/* Add api for File uploading */

router.post('/seller/stepFour/:userId?', function (request, response) {
  const { shortTrmRntl, judgements, comments, allStepsCompleted, leftAtStep } = request.body

  /* if params has userId then affiliate/admin is adding seller */
  const { userId } = request.params;
  if (userId) request.userId = userId

  User.findOne({ _id: request.userId }, (error, user) => {
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {
      if (user.sellerProfile) {
        SellerProfile.findOne({ _id: user.sellerProfile }, (err, profile) => {
          console.log(profile)
          if (err) {
            response.send(utils.createError('Database error'));
          } else if (!profile) {
            return response.send(utils.createError("Profile not found!"))
          } else {
            if (shortTrmRntl) profile.shortTrmRntl = shortTrmRntl
            if (judgements) profile.judgements = judgements
            if (comments) profile.comments = comments
            if (allStepsCompleted) profile.allStepsCompleted = allStepsCompleted
            if (leftAtStep) profile.leftAtStep = leftAtStep

            profile.save(async (errProfile, profile) => {
              console.log(errProfile, profile);
              if (errProfile) return response.send(utils.createError("Couldn't save profile!"))
              user.isProfileComplete = true
              user.leftAtStep = user.leftAtStep < 4 ? 4 : user.leftAtStep
              user.allStepsCompleted = allStepsCompleted
              await user.save()

              let title = `${user.fullName} Completed Profile `;
              let message = `${user.fullName} has completed his/her profile for ${user.role} application.`
              let messageHtml = `<h3>Hello!</h3><p>${user.fullName} has completed his/her profile for ${user.role} application.</p><p>US Housing Exchange</p>`

              if (user.referredBy) {
                /* Text Notifications alerting an affiliate user that a buyer or seller using their registration code completed application */
                User.findOne({ referalCode: user.referredBy, deleted: false, role: 'affiliate' }, (errAff, affiliate) => {
                  if (!errAff && affiliate) {
                    console.log({
                      "AFFiliate": affiliate
                    })
                    messageSmsAffiliate = `Hello! ${user.fullName} has submitted a new ${user.role} application using your referral code (${user.referredBy}). US Housing Exchange`;

                    mailer.sendSMS((affiliate.phone[0] != '+' ? `+1${affiliate.phone}` : affiliate.phone), messageSmsAffiliate, (err, data) => {
                      console.log("Affiliate Text Notifications For ", err, data);

                      // notification message of referral to admin
                      refrlMsgToAdmin = `${user.fullName} has submitted a new ${user.role} application using referral code (${user.referredBy}) of ${affiliate.fullName} (${affiliate.role}).`;

                      refrlHtmlToAdmin = `<h3>Hello!</h3><p>${user.fullName} has submitted a new ${user.role} application using referral code (${user.referredBy}) of ${affiliate.fullName} (${affiliate.role}).</p><br><p>US Housing Exchange</p>`;

                      return profileCompleteNotifications(profile, title, refrlMsgToAdmin, refrlHtmlToAdmin, user, response, errProfile);

                    });
                  }
                });
              } else {
                return profileCompleteNotifications(profile, title, message, messageHtml, user, response, errProfile);
              }
            })
          }
        })
      } else {
        response.send(utils.createError("Profile Not Created Yet!"))
      }
    }
  })

})

/* Seller how did you hear about us */
router.post('/seller/stepFive/:userId?', function (request, response) {
  const { listened_about_us, allStepsCompleted, leftAtStep } = request.body

  /* if params has userId then affiliate/admin is adding seller */
  const { userId } = request.params;
  if (userId) request.userId = userId

  User.findOne({ _id: request.userId }, (error, user) => {
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {
      if (user.sellerProfile) {
        SellerProfile.findOne({ _id: user.sellerProfile }, (err, profile) => {
          console.log(profile)
          if (err) {
            response.send(utils.createError('Database error'));
          } else if (!profile) {
            return response.send(utils.createError("Profile not found!"))
          } else {
            if (listened_about_us) profile.listened_about_us = listened_about_us;
            if (allStepsCompleted) profile.allStepsCompleted = allStepsCompleted
            if (leftAtStep) profile.leftAtStep = leftAtStep
            profile.save(async (err, profile) => {
              console.log(err, profile);
              if (err) return response.send(utils.createError("Couldn't save profile!"))
              user.isProfileComplete = true
              user.allStepsCompleted = true
              user.leftAtStep = 5
              await user.save()

              let title = `${user.fullName} Completed Profile `;
              let message = `${user.fullName} has completed his/her profile for ${user.role} application.`
              let messageHtml = `<h3>Hello!</h3><p>${user.fullName} has completed his/her profile for ${user.role} application.</p><p>US Housing Exchange</p>`

              if (user.referredBy) {
                /* Text Notifications alerting an affiliate user that a buyer or seller using their registration code completed application */
                User.findOne({ referalCode: user.referredBy, deleted: false, role: 'affiliate' }, (errAff, affiliate) => {
                  if (!errAff && affiliate) {
                    console.log({
                      "AFFiliate": affiliate
                    })
                    messageSmsAffiliate = `Hello! ${user.fullName} has submitted a new ${user.role} application using your referral code (${user.referredBy}). US Housing Exchange`;

                    mailer.sendSMS((affiliate.phone[0] != '+' ? `+1${affiliate.phone}` : affiliate.phone), messageSmsAffiliate, (err, data) => {
                      console.log("Affiliate Text Notifications For ", err, data);

                      // notification message of referral to admin
                      refrlMsgToAdmin = `${user.fullName} has submitted a new ${user.role} application using referral code (${user.referredBy}) of ${affiliate.fullName} (${affiliate.role}).`;

                      refrlHtmlToAdmin = `<h3>Hello!</h3><p>${user.fullName} has submitted a new ${user.role} application using referral code (${user.referredBy}) of ${affiliate.fullName} (${affiliate.role}).</p><br><p>US Housing Exchange</p>`;

                      return profileCompleteNotifications(profile, title, refrlMsgToAdmin, refrlHtmlToAdmin, user, response, errProfile);

                    });
                  }
                });
              } else {
                return profileCompleteNotifications(profile, title, message, messageHtml, user, response, errProfile);
              }

            })
          }
        })
      } else {
        response.send(utils.createError("Profile Not Created Yet!"))
      }
    }
  })

})

/* Getting the profile details of logged in seller */
router.get('/seller/application/:userId', function (request, response) {
  const { userId } = request.params;
  User.findOne({ _id: userId, deleted: false }, (error, user) => {
    console.log("user", error, user)
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {
      let application = {};
      SellerProfile.findOne({ userId }, (err, profile) => {
        console.log({ profile });
        if (err) {
          response.send(utils.createError('Database error'));
        } else if (!profile) {
          response.send(utils.createError('Application Details not found'));
        } else {
          application.stepOne = profile.stepOne();
          application.stepTwo = profile.stepTwo();
          application.stepThree = profile.stepThree();
          application.stepFour = profile.stepFour();
          application.leftAtStep = user.leftAtStep
          application.status = user.status
          application.approved = user.approved
          application.role = user.role

          response.send(utils.createSuccess(application))
        }
      })

    }
  })
})

//#endregion

/**
 * ------------------------------Contractor Profile Steps---------------------------
 */
router.post('/contractor/stepOne', uploadContractors.single('governmentId'), function (request, response) {

  const { firstName, lastName, email, phone, street_address, city,
    state, zip, governmentId, allStepsCompleted, leftAtStep, device_token } = request.body
  const user = new User()
  console.log("in router request.body", request.body)

  if (!firstName || !lastName) {
    return response.send(utils.createError('First Name and Last Name are required!'));
  } else
    if (!email) {
      return response.send(utils.createError('Email is required!'));
    } else
      if (!phone) {
        return response.send(utils.createError('Phone is required!'));
      }

  User.findOne({ _id: request.userId }, (error, user) => {
    console.log(user)
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {
      ContractorProfile.findOne({ userId: request.userId }, async (err, profile) => {
        console.log(profile)
        if (err) {
          response.send(utils.createError('Database error'));
        } else if (!profile) {
          console.log("no profile yet")
          profile = new ContractorProfile();
          profile.firstName = firstName
          profile.lastName = lastName
          profile.email = email
          profile.phone = phone
          profile.street_address = street_address
          profile.city = city
          profile.state = state
          profile.zip = zip
          profile.userId = user._id,
            profile.allStepsCompleted = allStepsCompleted
          profile.leftAtStep = leftAtStep
          user.leftAtStep = 1
        } else {
          console.log("profile found!")
          if (firstName) profile.firstName = firstName;
          if (lastName) profile.lastName = lastName;
          if (email) profile.email = email;
          if (phone) profile.phone = phone;
          if (street_address) profile.street_address = street_address;
          if (city) profile.city = city;
          if (state) profile.state = state;
          if (zip) profile.zip = zip;
          if (allStepsCompleted) profile.allStepsCompleted = allStepsCompleted
          if (leftAtStep) profile.leftAtStep = leftAtStep

        }
        if (request.file) {
          console.log({
            file: request.file
          })
          console.log('File uploaded successfully.');
          console.log(request.file)
          profile.governmentId = `uploads/contractors/${request.file.filename}`;
        }
        else {
          return response.send(utils.createError('Govt. Id is required!'));
        }
        console.log("profile", profile)
        profile.save((err, profile) => {
          console.log(err, profile);
          if (err) return response.send(utils.createError("Couldn't save profile!"))
          user.contractorProfile = profile._id;
          user.phone = profile.phone;
          user.save(async (error, result) => {
            console.log(error, result);
            if (error) return response.send(utils.createError("Database error"))
            await user.save()
            response.send(utils.createSuccess(profile));
          })
        })
      })
    }
  })
})

router.post('/contractor/stepTwo', uploadContractors.single('tradeLiscence'), function (request, response) {
  const { trades, yrsExp, tradeLiscence, allStepsCompleted, leftAtStep } = request.body
  if (!trades && !yrsExp) {
    return response.send(utils.createError('Trades and Years of experience are required!'));
  } else if (!trades) {
    return response.send(utils.createError('Trades is required!'));
  } else if (!yrsExp) {
    return response.send(utils.createError('Years of experience is required!'));
  }

  User.findOne({ _id: request.userId }, (error, user) => {
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {
      console.log({
        user
      })
      if (user.contractorProfile) {
        ContractorProfile.findOne({ _id: user.contractorProfile }, async (err, profile) => {
          console.log(profile)
          if (err) {
            response.send(utils.createError('Database error'));
          } else if (!profile) {
            return response.send(utils.createError("Profile not found!"))
          } else {
            if (trades) profile.trades = trades
            if (yrsExp) profile.yrsExp = yrsExp
            if (allStepsCompleted) profile.allStepsCompleted = allStepsCompleted
            if (leftAtStep) profile.leftAtStep = leftAtStep

            if (request.file) {
              console.log('File uploaded successfully.');
              console.log(request.file)
              profile.tradeLiscence = `uploads/contractors/${request.file.filename}`;
            }

            profile.save(async (err, profile) => {
              console.log(err, profile);
              if (err) return response.send(utils.createError("Couldn't save profile!"))
              user.isProfileComplete = true
              user.allStepsCompleted = true
              user.leftAtStep = 2
              await user.save()

              let title = `${user.fullName} Completed Profile `;
              let message = `${user.fullName} has completed his/her profile for ${user.role} application.`
              let messageHtml = `<h3>Hello!</h3><p>${user.fullName} has completed his/her profile for ${user.role} application.</p><p>US Housing Exchange</p>`

              if (user.referredBy) {
                /* Text Notifications alerting an affiliate user that a buyer or seller using their registration code completed application */
                User.findOne({ referalCode: user.referredBy, deleted: false, role: 'affiliate' }, (errAff, affiliate) => {
                  if (!errAff && affiliate) {
                    console.log({
                      "AFFiliate": affiliate
                    })
                    messageSmsAffiliate = `Hello! ${user.fullName} has submitted a new ${user.role} application using your referral code (${user.referredBy}). US Housing Exchange`;

                    mailer.sendSMS((affiliate.phone[0] != '+' ? `+1${affiliate.phone}` : affiliate.phone), messageSmsAffiliate, (err, data) => {
                      console.log("Affiliate Text Notifications For ", err, data);

                      // notification message of referral to admin
                      refrlMsgToAdmin = `${user.fullName} has submitted a new ${user.role} application using referral code (${user.referredBy}) of ${affiliate.fullName} (${affiliate.role}).`;

                      refrlHtmlToAdmin = `<h3>Hello!</h3><p>${user.fullName} has submitted a new ${user.role} application using referral code (${user.referredBy}) of ${affiliate.fullName} (${affiliate.role}).</p><br><p>US Housing Exchange</p>`;

                      return profileCompleteNotifications(profile, title, refrlMsgToAdmin, refrlHtmlToAdmin, user, response);

                    });
                  }
                });
              } else {
                return profileCompleteNotifications(profile, title, message, messageHtml, user, response);
              }

            })
          }
        })
      } else {
        response.send(utils.createError("Profile Not Created Yet!"))
      }
    }
  })

})

/* Getting the profile details of logged in contractor */
router.get('/contractor/application/:userId', function (request, response) {
  const { userId } = request.params;
  User.findOne({ _id: userId, deleted: false }, (error, user) => {
    console.log("user", error, user)
    if (error) {
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {
      let application = {};
      ContractorProfile.findOne({ userId }, (err, profile) => {
        console.log({ profile });
        if (err) {
          response.send(utils.createError('Database error'));
        } else if (!profile) {
          response.send(utils.createError('Application Details not found'));
        } else {
          application.stepOne = profile.stepOne();
          application.stepTwo = profile.stepTwo();
          application.leftAtStep = user.leftAtStep
          application.status = user.status
          application.approved = user.approved
          application.role = user.role

          response.send(utils.createSuccess(application))
        }
      })

    }
  })

})

/* ---------------------------------------------------------------------------- */


/* -------------------------Buyer Dashboard Starts---------------------------------------------- */

/* Api for getting buyer details */
router.get('/borrower/dashboard/my-profile/:userId', function (request, response) {
  const {
    userId
  } = request.params;

  try {
    User.findOne({ _id: userId, deleted: false }, (error, user) => {
      if (error) {
        console.log({
          error
        })
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('User not found'));
      } else {
        response.send(utils.createSuccess(user))
      }
    })
  } catch (ex) {
    console.log("Exception", ex);
    response.send(utils.createError("Something went wrong!", ex))
  }
});

/* For updating personal details of buyer and seller and contractor(trades also) */
router.post('/borrower/dashboard/my-profile', function (request, response) {
  const {
    fullName,
    email,
    phone,
    about_me,
    trades
  } = request.body

  // const {
  //   userId
  // } = request.params

  User.findOne({ _id: request.userId, deleted: false }, (error, user) => {
    if (error) {
      console.log({
        error
      })
      response.send(utils.createError('Database error'));
    } else if (!user) {
      response.send(utils.createError('User not found'));
    } else {
      try {
        if (fullName) user.fullName = fullName
        if (email) user.email = email
        if (phone) user.phone = phone
        if (about_me) user.about_me = about_me

        if (request.role == 'contractor') {
          ContractorProfile.findOne({ userId: request.userId }, (err, contractor) => {
            if (err) {
              console.log({
                err
              })
              response.send(utils.createError('Database error'));
            } else if (!contractor) {
              response.send(utils.createError('Contractor not found'));
            } else {
              if (trades) contractor.trades = trades

              contractor.save((saveErr, profileSave) => {
                console.log({
                  saveErr, profileSave
                });
                if (saveErr) {
                  return response.send(utils.createError("Couldn't update contractor profile!"))
                } else {
                  console.log("Profile updated successfully");
                }
              })
            }
          })
        }

        user.save((err, user) => {
          console.log({
            user, err
          })
          if (err) return response.send(utils.createError("Couldn't update profile!"))

          response.send(utils.createSuccess('Profile updated successfully', user));
        })

      } catch (ex) {
        console.log("Exception", ex);
        response.send(utils.createError("Something went wrong!", ex))
      }
    }
  });
})



/* -------------------------Seller Dashboard Starts---------------------------------------------- */

/* For adding new property  step-1*/
router.post('/seller/dashboard/add-property/stepOne/:propertyId?', validateUserApproved, function (request, response) {
  const {
    title,
    description
  } = request.body


  if (request.role == 'admin') {
    Admin.findOne({ _id: request.userId }, async (error, user) => {
      if (error) {
        console.log({
          error
        })
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('User not found'));
      } else if (user.deleted) {
        response.send(utils.createError('Your account has been deleted!'));
      } else {
        try {
          let property;
          property = new Property();
          if (propertyId) property = await Property.findById(propertyId);
          if (title) property.title = title
          if (description) property.description = description
          property.seller_id = request.userId

          property.save((err, property) => {
            console.log(err, property);
            if (err) return response.send(utils.createError("Couldn't save property!"))
            response.send(utils.createSuccess(property));
          })
        } catch (ex) {
          console.log("Exception", ex);
          response.send(utils.createError("Something went wrong!", ex))
        }
      }
    });
  } else {
    User.findOne({ _id: request.userId }, async (error, user) => {
      if (error) {
        console.log({
          error
        })
        response.send(utils.createError('Database error'));
      } else if (!user) {
        response.send(utils.createError('User not found'));
      } else if (user.deleted) {
        response.send(utils.createError('Your account has been deleted!'));
      } else {
        try {
          let property;
          property = new Property();
          if (propertyId) property = await Property.findById(propertyId);
          if (title) property.title = title
          if (description) property.description = description
          property.seller_id = request.userId

          property.save((err, property) => {
            console.log(err, property);
            if (err) return response.send(utils.createError("Couldn't save property!"))
            response.send(utils.createSuccess(property));
          })
        } catch (ex) {
          console.log("Exception", ex);
          response.send(utils.createError("Something went wrong!", ex))
        }
      }
    });
  }

  const { propertyId } = request.params;

})

/* For adding new property  step-2*/
router.post('/seller/dashboard/add-property/stepTwo/:propertyId', function (request, response) {
  const {
    address,
    country,
    state,
    city,
    neighbourhood,
    zip,
    latitude,
    longitude
  } = request.body

  const {
    propertyId
  } = request.params

  try {
    Property.findOne({ _id: propertyId }, (err, property) => {
      console.log(property)
      if (err) {
        response.send(utils.createError('Database error'));
      } else if (!property || property.length === 0) {
        console.log("no property yet")
        return response.send(utils.createError("Property not found!"))
      } else {
        console.log("property(s) found!")
        console.log(property);
        if (address) property.address = address
        if (country) property.country = country
        if (state) property.state = state
        if (city) property.city = city
        if (neighbourhood) property.neighbourhood = neighbourhood
        if (zip) property.zip = zip
        if (latitude) property.latitude = latitude
        if (longitude) property.longitude = longitude
      }
      console.log("property", property)
      property.save((err, property) => {
        console.log(err, property);
        if (err) return response.send(utils.createError("Couldn't save property!"))
        response.send(utils.createSuccess(property));
      })
    })
  } catch (ex) {
    console.log("Exception", ex);
    response.send(utils.createError("Something went wrong!", ex))
  }
})

/* For adding new property  step-3*/
router.post('/seller/dashboard/add-property/stepThree/:propertyId', function (request, response) {
  const {
    property_type,
    property_status,
    rehab_needed
  } = request.body

  const {
    propertyId
  } = request.params

  try {
    Property.findOne({ _id: propertyId }, (err, property) => {
      console.log(property)
      if (err) {
        response.send(utils.createError('Database error'));
      } else if (!property || property.length === 0) {
        console.log("no property yet")
        return response.send(utils.createError("Property not found!"))
      } else {
        console.log("property(s) found!")
        console.log(property);
        if (property_type) property.property_type = property_type
        if (property_status) property.property_status = property_status
        if (rehab_needed) property.rehab_needed = rehab_needed
      }
      console.log("property", property)
      property.save((err, property) => {
        console.log(err, property);
        if (err) return response.send(utils.createError("Couldn't save property!"))
        response.send(utils.createSuccess(property));
      })
    })
  } catch (ex) {
    console.log("Exception", ex);
    response.send(utils.createError("Something went wrong!", ex))
  }
})

/* For adding new property  step-4*/
router.post('/seller/dashboard/add-property/stepFour/:propertyId', function (request, response) {
  const {
    sales_price,
    rehab_price_est,
    rehab_work_details
  } = request.body

  const {
    propertyId
  } = request.params

  try {
    Property.findOne({ _id: propertyId }, (err, property) => {
      console.log(property)
      if (err) {
        response.send(utils.createError('Database error'));
      } else if (!property || property.length === 0) {
        console.log("no property yet")
        return response.send(utils.createError("Property not found!"))
      } else {
        console.log("property(s) found!")
        console.log(property);
        if (sales_price) property.sales_price = sales_price
        if (rehab_price_est) property.rehab_price_est = rehab_price_est
        if (rehab_price_est && sales_price) property.after_rehab_value = +property.sales_price + (+property.rehab_price_est)
        if (rehab_work_details) property.rehab_work_details = rehab_work_details
      }
      console.log("property", property)
      property.save((err, property) => {
        console.log(err, property);
        if (err) return response.send(utils.createError("Couldn't save property!"))
        response.send(utils.createSuccess(property));
      })
    })
  } catch (ex) {
    console.log("Exception", ex);
    response.send(utils.createError("Something went wrong!", ex))
  }
})

/* For adding new property  step-5*/
router.post('/seller/dashboard/add-property/stepFive/:propertyId', function (request, response) {
  const {
    features
  } = request.body

  const {
    propertyId
  } = request.params

  try {
    Property.findOne({ _id: propertyId }, (err, property) => {
      console.log(property)
      if (err) {
        response.send(utils.createError('Database error'));
      } else if (!property || property.length === 0) {
        console.log("no property yet")
        return response.send(utils.createError("Property not found!"))
      } else {
        console.log("property(s) found!")
        console.log(property);
        if (features) property.features = features
      }
      console.log("property", property)
      property.save((err, property) => {
        console.log(err, property);
        if (err) return response.send(utils.createError("Couldn't save property!"))
        response.send(utils.createSuccess(property));
      })
    })
  } catch (ex) {
    console.log("Exception", ex);
    response.send(utils.createError("Something went wrong!", ex))
  }
})

/* For adding new property  step-6*/
router.post('/seller/dashboard/add-property/stepSix/:propertyId', function (request, response) {
  const {
    property_size,
    land_area,
    rooms,
    bedrooms,
    bathrooms,
    garage,
    garage_size,
    year_built,
    property_id,
    additional_title,
    additional_value
  } = request.body

  const {
    propertyId
  } = request.params

  try {
    Property.findOne({ _id: propertyId }, (err, property) => {
      console.log(property)
      if (err) {
        response.send(utils.createError('Database error'));
      } else if (!property || property.length === 0) {
        console.log("no property yet")
        return response.send(utils.createError("Property not found!"))
      } else {
        console.log("property(s) found!")
        console.log(property);
        if (property_size) property.property_size = property_size
        if (land_area) property.land_area = land_area
        if (rooms) property.rooms = rooms
        if (bedrooms) property.bedrooms = bedrooms
        if (bathrooms) property.bathrooms = bathrooms
        if (garage) property.garage = garage
        if (garage_size) property.garage_size = garage_size
        if (year_built) property.year_built = year_built
        if (property_id) property.property_id = property_id
        if (additional_title) property.additional_title = additional_title
        if (additional_value) property.additional_value = additional_value
      }
      console.log("property", property)
      property.save((err, property) => {
        console.log(err, property);
        if (err) return response.send(utils.createError("Couldn't save property!"))
        response.send(utils.createSuccess(property));
      })
    })
  } catch (ex) {
    console.log("Exception", ex);
    response.send(utils.createError("Something went wrong!", ex))
  }
})

/* For adding new property  step-7*/
/* Ved sir isme photo gallery and file attachments multi ple he */
router.post('/seller/dashboard/add-property/stepSeven/:propertyId',

  function (request, response) {
    const {
      photo_gallery,
      file_attachments,
      video_url
    } = request.body

    const {
      propertyId
    } = request.params

    uploadProperty(request, response, function (err) {
      if (err) {
        console.log(err);
        return response.send(utils.createError(err.error));
      }
      try {
        Property.findOne({ _id: propertyId }, (err, property) => {
          console.log(property)
          if (err) {
            response.send(utils.createError('Database error'));
          } else if (!property || property.length === 0) {
            console.log("no property yet")
            return response.send(utils.createError("Property not found!"))
          } else {
            console.log("property(s) found!")
            console.log(property);

            if (request.files) {
              console.log('File uploaded successfully.');
              console.log({
                request_kiFiles: request.files
              })
              let files = request.files['photo_gallery'];
              console.log({
                files,
                akshay: request.files
              })

              if (files) {
                console.log("photo_gallery", files);
                for (let i = 0; i < files.length; i++) {
                  let file = files[i];
                  console.log("extracted", file);
                  property.photo_gallery.push(`uploads/properties/${file.filename}`);
                }
              }
              files = request.files['file_attachments'];
              if (files) {
                console.log("file_attachments", files);
                for (let i = 0; i < files.length; i++) {
                  let file = files[i];
                  console.log("extracted", file);
                  property.file_attachments.push(`uploads/properties/${file.filename}`);
                }
              }
            }
            if (video_url) property.video_url = video_url
          }
          console.log("property", property)
          property.save((err, property) => {
            console.log(err, property);
            if (err) return response.send(utils.createError("Couldn't save property!"))
            response.send(utils.createSuccess(property));
          })
        })
      } catch (ex) {
        console.log("Exception", ex);
        response.send(utils.createError("Something went wrong!", ex))
      }
    })

  })

/* For adding new property  step-8*/
router.post('/seller/dashboard/add-property/stepEight/:propertyId', function (request, response) {
  const {
    other_contact_name,
    other_contact_email,
    other_contact_phone,
    other_contact_info
  } = request.body

  const {
    propertyId
  } = request.params

  try {
    Property.findOne({ _id: propertyId }, (err, property) => {
      console.log(property)
      if (err) {
        response.send(utils.createError('Database error'));
      } else if (!property || property.length === 0) {
        console.log("no property yet")
        return response.send(utils.createError("Property not found!"))
      } else {
        console.log("property(s) found!")
        console.log(property);

        if (other_contact_name) property.other_contact_name = other_contact_name
        if (other_contact_email) property.other_contact_email = other_contact_email
        if (other_contact_phone) property.other_contact_phone = other_contact_phone
        if (other_contact_info) property.other_contact_info = other_contact_info
      }
      console.log("property", property)
      property.save((err, property) => {
        console.log(err, property);
        if (err) return response.send(utils.createError("Couldn't save property!"))
        response.send(utils.createSuccess(property));
      })
    })
  } catch (ex) {
    console.log("Exception", ex);
    response.send(utils.createError("Something went wrong!", ex))
  }
})

/* For adding new property  step-9*/
router.post('/seller/dashboard/add-property/stepNine/:propertyId', function (request, response) {
  const {
    private_note
  } = request.body

  const {
    propertyId
  } = request.params

  try {
    Property.findOne({ _id: propertyId }, (err, property) => {
      console.log(property)
      if (err) {
        response.send(utils.createError('Database error'));
      } else if (!property || property.length === 0) {
        console.log("no property yet")
        return response.send(utils.createError("Property not found!"))
      } else {
        console.log("property(s) found!")
        console.log(property);

        if (private_note) property.private_note = private_note
      }
      console.log("property", property)
      property.save(async (err, property) => {
        console.log(err, property);
        if (err) return response.send(utils.createError("Couldn't save property!"))
        response.send(utils.createSuccess(property));
        let user = await User.findById(property.seller_id)
        let title = `New Property Submitted`;
        let message = `A new property (${property.title}) has been created`

        mailer.createNotification(property._id, title, message, 'admin', 'property', (err, data) => {
          console.log("createNotification", err, data);
          message = `<h3>Hello!</h3><p>A new property (${property.title}) has been created.</p><p>US Housing Exchange</p>`
          mailer.sendEmail('admin@ushousingexchange.com', title, message, (err, data) => {
            console.log("Admin Email", err, data);
            title = `Property Submitted`;
            message = `<h3>Hello ${user.fullName}!</h3><p>Your new property (${property.title}) has been submitted for admin approval. Someone from US Housing Exchange will contact you soon.</p><p>Thanks</br>US Housing Exchange</p>`
            mailer.sendEmail(user.email, title, message, (err, data) => {
              console.log("User Email", err, data);
              // mailer.sendSMSByUserId()
              response.send(utils.createSuccess(profile));
            })
          })
        })
      })
    })
  } catch (ex) {
    console.log("Exception", ex);
    response.send(utils.createError("Something went wrong!", ex))
  }
})


/**
 * Updating the property until it is not approved
 */
router.post('/seller/update-property/:propertyId', (request, response) => {
  const {
    propertyId
  } = request.params

  const {
    title,
    description,
    address,
    country,
    state,
    city,
    zip,
    latitude,
    longitude,
    property_type,
    property_status,
    rehab_needed,
    sales_price,
    rehab_price_est,
    rehab_work_details,
    features,
    property_size,
    land_area,
    rooms,
    bedrooms,
    bathrooms,
    garage,
    garage_size,
    year_built,
    property_id,

    photo_gallery,
    file_attachments,

    video_url,
    other_contact_name,
    other_contact_email,
    other_contact_phone,
    other_contact_info
  } = request.body


  uploadProperty(request, response, function (err) {
    if (err) {
      console.log(err);
      return response.send(utils.createError(err.error));
    }
    try {
      Property.findOne({ _id: propertyId }, (err, property) => {
        console.log(property)
        if (err) {
          response.send(utils.createError('Database error'));
        } else if (!property || property.length === 0) {
          console.log("no property yet")
          return response.send(utils.createError("Property not found!"))
        } else {
          console.log("property(s) found!")
          console.log(property);

          if (request.files) {
            console.log('File uploaded successfully.');
            console.log({
              request_kiFiles: request.files
            })
            let files = request.files['photo_gallery'];
            console.log({
              files,
              akshay: request.files
            })

            property.photo_gallery = [];
            property.file_attachments = [];

            if (files) {
              console.log("photo_gallery", files);
              for (let i = 0; i < files.length; i++) {
                let file = files[i];
                console.log("extracted", file);
                property.photo_gallery.push(`uploads/properties/${file.filename}`);
              }
            }
            files = request.files['file_attachments'];
            if (files) {
              console.log("file_attachments", files);
              for (let i = 0; i < files.length; i++) {
                let file = files[i];
                console.log("extracted", file);
                property.file_attachments.push(`uploads/properties/${file.filename}`);
              }
            }
          }

          if (title) property.title = title
          if (description) property.description = description
          if (address) property.address = address
          if (country) property.country = country
          if (state) property.state = state
          if (city) property.city = city
          if (zip) property.zip = zip
          if (latitude) property.latitude = latitude
          if (longitude) property.longitude = longitude
          if (property_type) property.property_type = property_type
          if (property_status) property.property_status = property_status
          if (rehab_needed) property.rehab_needed = rehab_needed
          if (sales_price) property.sales_price = sales_price
          if (rehab_price_est) property.rehab_price_est = rehab_price_est
          if (rehab_work_details) property.rehab_work_details = rehab_work_details
          if (features) property.features = features
          if (property_size) property.property_size = property_size
          if (land_area) property.land_area = land_area
          if (rooms) property.rooms = rooms
          if (bedrooms) property.bedrooms = bedrooms
          if (bathrooms) property.bathrooms = bathrooms
          if (garage) property.garage = garage
          if (garage_size) property.garage_size = garage_size
          if (year_built) property.year_built = year_built
          if (property_id) property.property_id = property_id

          if (video_url) property.video_url = video_url
          if (other_contact_name) property.other_contact_name = other_contact_name
          if (other_contact_email) property.other_contact_email = other_contact_email
          if (other_contact_phone) property.other_contact_phone = other_contact_phone
          if (other_contact_info) property.other_contact_info = other_contact_info
        }
        console.log("property", property)
        property.save((err, property) => {
          console.log(err, property);
          if (err) return response.send(utils.createError("Couldn't save property!"))
          response.send(utils.createSuccess(property));
        })
      })
    } catch (ex) {
      console.log("Exception", ex);
      response.send(utils.createError("Something went wrong!", ex))
    }
  })
})


/* --------------------------Contractor Dashboard------------------------------------------ */
/* First api will be the get profile of contractors that is same as borrower vo upr bani hui he*/

/* cont ki 2nd api to get all the assigned jobs */
// router.post('contractor/dashboard/my-assigned-jobs', function(request, response) => {})


/* -----------------------------------OTHER APIS----------------------------------------- */

/* Property Search for Both Seller and Buyer Get all the properties*/
router.post('/properties', function (request, response) {
  const { status, property_id, title } = request.body

  let query = [{ deleted: false }]
  if (status) {
    query.push({ status })
  }
  if (property_id) {
    query.push({ property_id })
  }

  if (title) {
    query.push({ title: new RegExp('.*' + title.toLowerCase() + '*.', 'i') })
    query.push({ address: new RegExp('.*' + title.toLowerCase() + '*.', 'i') })
  }
  console.log("query", query);

  Property.find({ $and: query }, async function (error, properties) {
    console.log("Property.find", error, properties && properties.length)
    if (error || !properties) {
      response.send(utils.createError("Something went wrong!"));
    } else {
      response.send(utils.createSuccess(properties));
    }

  })
})

/* Properties of Seller */
router.post('/seller/properties', validateUserApproved, function (request, response) {
  const { status, property_id, title } = request.body

  let query = [{ seller_id: request.userId }, { deleted: false }]
  if (status) {
    query.push({ property_approved_status: status })
  }
  if (property_id) {
    query.push({ property_id })
  }

  if (title) {
    query.push({ $or: [{ title: new RegExp('.*' + title.toLowerCase() + '*.', 'i') }, { address: new RegExp('.*' + title.toLowerCase() + '*.', 'i') }] })
    // query.push() 
  }
  console.log("query", query);

  Property.find({ $and: query })
    .sort({ createdAt: -1 })
    .exec(async function (error, properties) {
      console.log("Property.find", error, properties && properties.length)
      if (error || !properties) {
        response.send(utils.createError("Something went wrong!"));
      } else {
        response.send(utils.createSuccess(properties));
      }

    })
})

/* Properties of Buyer */
router.post('/buyer/properties', validateUserApproved, function (request, response) {
  const { status, property_id, title } = request.body
  conditions = {}
  User.findById(request.userId).exec((err, user) => {
    console.log("user.find", err, user)
    if (err) {
      response.send(utils.createError("Something went wrong!"));
    } else if (!user) {
      response.send(utils.createError("User not found!"));
    } else if (user.approved) {

      let query = [{ sales_price: { $lte: user.max_mortgage } }, { property_approved_status: "approved" }, { deleted: false }]
      if (status) {
        query.push({ property_approved_status: status })
      }
      if (property_id) {
        query.push({ property_id })
      }

      if (title) {
        query.push({ $or: [{ title: new RegExp('.*' + title.toLowerCase() + '*.', 'i') }, { address: new RegExp('.*' + title.toLowerCase() + '*.', 'i') }] })
        // query.push()  
      }

      Property.find({ $and: query })
        .sort({ createdAt: -1 })
        .exec(async function (error, properties) {
          console.log("Property.find", error, properties && properties.length)
          if (error || !properties) {
            response.send(utils.createError("Something went wrong!"));
          } else {
            let updatedProperties = JSON.parse(JSON.stringify(properties))
            updatedProperties = updatedProperties.map(p => {
              p['isFavorite'] = user.favoriteProperty.indexOf(p._id) > -1
              console.log(p);
              return p;
            })
            console.log(updatedProperties)
            response.send(utils.createSuccess(updatedProperties));
          }

        })
    } else {
      response.send(utils.createError("User profile is not approved!"));
    }


  })
})

/* Add Favourite property of Buyer */
router.post('/property/add/favorite/:propertyId', async function (request, response) {
  const { propertyId } = request.params
  try {
    let property = await Property.findById(propertyId)
    console.log({
      property
    })
    if (!property) {
      return response.send(utils.createError("Property not found"))
    } else {
      console.log("Hello")
      User.findById(request.userId, (err, user) => {
        console.log({
          err, user
        })
        if (err) {
          console.log(err);
          return response.send(utils.createError("Something went wrong"))
        } else if (!user) {
          return response.send(utils.createError("User not found!"))
        } else {
          let index = user.favoriteProperty.indexOf(propertyId + "")
          console.log({
            index
          })
          if (index > -1) {
            user.favoriteProperty.splice(index, 1)
          } else {
            user.favoriteProperty.push(propertyId)
          }
          user.save((error, user) => {
            if (error) {
              return response.send(utils.createError("Something went wrong"))
            } else if (!user) {
              return response.send(utils.createError("User not found!"))
            } else {
              console.log('favourite property added');
              response.send(utils.createSuccess(property))
            }
          })
        }

      })
    }

  } catch (ex) {
    console.log("Error", ex)
    response.send(utils.createError("Something went wrong!"))
  }
})

/* To get the favourite property of Buyer */
router.get('/property/get/favorite', async function (request, response) {
  User.findOne({ _id: request.userId })
    .populate("favoriteProperty")
    .exec((error, user) => {
      if (error) {
        return response.send(utils.createError("Something went wrong"))
      } else if (!user) {
        return response.send(utils.createError("User not found!"))
      } else {
        console.log({
          f: user.favoriteProperty
        })
        response.send(utils.createSuccess(user.favoriteProperty.filter(p => !p.deleted)))
      }
    })
})

/* To get the property details for both seller and buyer */
router.get('/property/details/:propertyId', function (request, response) {
  const {
    propertyId
  } = request.params;

  Property.findOne({ _id: propertyId }, { deleted: 0, __v: 0, createdOn: 0 })
    .populate("seller_id") //{select:"fullName email role "}
    .exec(async (err, property) => {
      console.log({
        property
      })
      if (err) {
        return response.send(utils.createError("Something went wrong"))
      } else {
        try {
          let conditions = []
          //User is Buyer
          conditions.push({ property: propertyId, buyer: request.userId, deleted: false });

          //User is Seller
          conditions.push({ property: propertyId, seller: request.userId, deleted: false });

          let visits = await PropertyVisit.find({ $or: conditions }).sort({ timelog: -1 })
          console.log({ conditions, visits })
          let parsedProp = JSON.parse(JSON.stringify(property));
          parsedProp.isVisitScheduled = visits.length > 0 ? true : false
          parsedProp.scheduledVisits = visits[visits.length - 1]; // previously it is like visits[0]
          response.send(utils.createSuccess(parsedProp))
        } catch (ex) {
          console.log("Exception", ex)
          response.send(utils.createError("Something went wrong!"))
        }
      }
    })
});

/* To delete the property details for both seller and buyer */
router.delete('/property/delete/:propertyId', function (request, response) {
  const {
    propertyId
  } = request.params;

  let conditions = { _id: propertyId, seller_id: request.userId, deleted: false }
  if (request.role === 'admin') {
    conditions = { _id: propertyId, deleted: false }
  }
  Property.findOne(conditions, { deleted: 0, __v: 0, createdOn: 0 })
    .populate("seller_id", { select: "fullName email role" })
    .exec((err, property) => {
      console.log({
        property
      })
      if (err) {
        return response.send(utils.createError("Something went wrong!"))
      } else if (!property) {
        return response.send(utils.createError("Property not found!"))
      } else {
        property.deleted = true;
        property.save((err, doc) => {
          if (err) {
            return response.send(utils.createError("Something went wrong!"))
          } else if (!doc) {
            return response.send(utils.createError("Property not found!"))
          } else {
            response.send(utils.createSuccess(property))
          }
        })

      }
    })
});

/* Affiliate get all the users */
router.post('/affiliate/get-my-seller-buyer-list', function (request, response) {
  const {
    type,
    title,
    referralCode
  } = request.body

  let condition = [{ deleted: false }]

  if (!referralCode) {
    return response.send(utils.createError("Referral Code is required!"))
  }
  condition.push({ referredBy: referralCode })
  if (title) {
    condition.push({ fullName: new RegExp('.*' + title.toLowerCase() + '*.', 'i') })
  }

  User.find({ $and: condition })
    .populate('sellerProfile')
    .populate('borrowerProfile')
    .exec((err, users) => {
      if (err) {
        return response.send(utils.createError("Something went wrong!"))
      } else if (!users) {
        return response.send(utils.createError("User not found!"))
      } else {
        response.send(utils.createSuccess(users))
      }
    });
})

async function validateUserApproved(request, response, next) {
  let user = await User.findOne({ _id: request.userId, deleted: false })
  if (!user && (request.role == 'admin' || request.role == 'construction'))
    next();
  else if (user && user.approved)
    next();
  else return response.send(utils.createError('Application Not Approved'))
}


/* To be used when creating an account */
async function registerEmailSend(result, title, message, messageHtml, user, response, error) {

  /* Email to the user who created account */
  title = `Account Created`;
  message = `<h3>Hello ${user.fullName}!</h3><p>Your account has been created on the US Housing Exchange. Please complete your application.</p><p>US Housing Exchange</p>`
  mailer.sendEmail(user.email, title, message, (err, data) => {
    console.log("User Email", err, data);
    response.send(utils.createResult(error, result.safeUser()))
  })

  // admin@ushousingexchange.com for testing uncomment
  // mailer.sendEmail('akshayad@mailinator.com', title, messageHtml, (err, data) => {
  //   console.log("Admin Email", err, data);
  // })
}


/* To be used when final step of user is completed */
async function profileCompleteNotifications(profile, title, message, messageHtml, user, response) {
  console.log('user,,,,,,,,,,22',user);

  mailer.createNotification(user._id, title, message, 'admin', 'applicationdetail', (err, data) => {
    console.log("createNotification", err, data);

    // admin@ushousingexchange.com
    mailer.sendEmail('admin@ushousingexchange.com', title, messageHtml, (err, data) => {
      console.log("Admin Email", err, data);

      /* mail to notifications@ushousingexchange.com */
      mailer.sendEmail('notifications@ushousingexchange.com', title, messageHtml, (err, data) => {
        console.log("Notifications Email", err, data);
      });

      /* To admin Sending Text Notifications alerting that a new buyer application has been submitted */
      // (609) 922-9841 and (856) 261-0621
      // 916263916997
      mailer.sendSMS('+16099229841', message, (err, data) => {
        console.log("ADMIN Text Notifications  For ", err, data);
      })

      mailer.sendSMS('+18562610621', message, (err, data) => {
        console.log("ADMIN Text Notifications 2  For ", err, data);
      })

      if (!['affiliate', 'investor'].includes(user.role)) {
        title = `Profile Complete`;
        message = `<h3>Hello ${user.fullName}!</h3><p>Your profile is complete now. Someone from US Housing Exchange will contact you soon.</p><p>Thanks</br>US Housing Exchange</p>`
        mailer.sendEmail(user.email, title, message, (err, data) => {
          console.log("User Email", err, data);
          response.send(utils.createSuccess(profile));
        })
      }
    })
  })
}

module.exports = router;

