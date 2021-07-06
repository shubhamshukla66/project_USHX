const axios = require('axios')
const request = require('request');
const twilio = require('twilio')
const config = require('../../config/constants')
const Notification = require('../models/Notification')
const User = require('../models/User')
const utils = require('../../utils')

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
var admin = require("firebase-admin");

var serviceAccount = require("../../config/ushx-9ba8a-firebase-adminsdk-al4yq-326225207f.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ushx-9ba8a.firebaseio.com"
});

// Set the configuration 
// AWS.config.update({
//   accessKeyId: config.aws.email_accessKeyId,
//   secretAccessKey: config.aws.email_secretAccessKey,
//   region: config.aws.region
// });

const accountSid = 'AC89612a660da918cc521581a5c1cab599'
const authToken = 'cc58c77e77cc12d6c2d7953b4799f77f'
const fromNumber = '+12815192095'


async function createDynamicJobLink(jobId, callback) {
  let body = {
    'dynamicLinkInfo': {
      'domainUriPrefix': 'https://ushx.page.link',
      'link': `https://ushousingexchange.com/contractors/job-details/${jobId}?jobid=${jobId}`,
      "androidInfo": {
        "androidPackageName": "com.ushx"
      },
      "iosInfo": {
        "iosBundleId": "com.ushx"
      },
      "socialMetaTagInfo": {
        "socialTitle": "Job Details",
        "socialDescription": "Update the job assigned to you",
        "socialImageLink": "https://ushousingexchange.com/bg-video-contractors.jpg"
      }
    }
  }

  return request({
    url: `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${config.firebase.WEB_API_KEY}`,
    method: 'POST', json: true, body
  }, function (error, response) {
    if (error) {
      console.log('Error :', error)
      return callback({ status: 'error', error: error })
    } else {
      if (response && response.statusCode !== 200) {
        console.log('Error on Request :', response.body.error.message)
        return callback({ status: 'error', error: response.body.error.message })
      } else {
        // console.log('Dynamic Link :', response.body);
        return callback(null, { status: 'success', link: response.body.shortLink })
      }
    }
  });


}
// Twilio Credentials
// UN: admin@ushousingexchange.com
// PW: USH0usingExch@nge2020!
async function sendSMS(number, body, callback) {
  console.log("sendSMS", number, body)
  try {
    const client = new twilio(accountSid, authToken);
    let response = await client.messages.create({
      body: body,
      to: number,
      from: fromNumber
    })
    callback(null, "SMS Sent to " + number)
  } catch (ex) {
    console.log("sendSMS catch", ex)
    callback("Error Sending SMS to " + number, null)
  }
  // .then((message) => {
  //   console.log(message.sid)
  //   response.send(utils.createSuccess({otp: otp}))
  // })
}

async function sendSMSByUserId(userId, body, callback) {
  console.log("sendSMSByUserId", userId, body)
  let number = '+917581023076'
  try {
    number = await utils.getUserPhone(userId);
    if (!number) {
      callback("phone number not found!")
    } else {
      const client = new twilio(accountSid, authToken);
      let response = await client.messages.create({
        body: body,
        to: number,
        from: fromNumber
      })
      callback(null, "SMS Sent to " + number)
    }
  } catch (ex) {
    console.log("sendSMS catch", ex)
    callback("Error Sending SMS to " + number, null)
  }
  // .then((message) => {
  //   console.log(message.sid)
  //   response.send(utils.createSuccess({otp: otp}))
  // })
}


async function sendEmail(email, subject, body, callback) {
  AWS.config.update({
    accessKeyId: config.aws.email_accessKeyId,
    secretAccessKey: config.aws.email_secretAccessKey,
    region: config.aws.region
  });
  console.log("sendEmail", email, body)
  try {
    // Create sendEmail params 
    var params = {
      Destination: { /* required */
        CcAddresses: [],
        ToAddresses: [
          email,
          /* more items */
        ]
      },
      Message: { /* required */
        Body: { /* required */
          Html: {
            Charset: "UTF-8",
            Data: body
          }
          ,
          Text: {
            Charset: "UTF-8",
            Data: body
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject
        }
      },
      Source: 'US Housing Exchange <notifications@ushousingexchange.com>', /* required */

    };

    // Create the promise and SES service object
    var sendPromise = new AWS.SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise();

    // Handle promise's fulfilled/rejected states
    sendPromise.then(
      function (data) {
        console.log(data);
        callback(null, "Email Sent to " + email)
      }).catch(
        function (err) {
          console.error(err, err.stack);
          callback("Failed to send email to " + email, null,)
        });


  } catch (ex) {
    console.log("emailsent catch", ex)
    callback("Error Sending Email to " + email)
  }
}
// Send a message to the device corresponding to the provided
// registration token.
async function sendNotification(title, body, intent, token, callback) {
  console.log("sendNotification", title, body, intent, token)
  try {
    const message = {
      notification: {
        title: title,
        body: body
      },
      data: {
        title: title,
        body: body
      },
      android: {
        notification: {
          sound: 'default',
          click_action: intent || "",
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default'
          },
        },
      },
      token
    };
    let response = await admin.messaging().send(message)
    console.log("notification", response)
    callback(null, response)
  } catch (ex) {
    console.log("notification Error", ex);
    callback("Error: Notification Failed!", null)
  }
}

async function sendNotificationByUserId(title, body, intent, userId, callback) {
  console.log("sendNotificationByUserId", title, body, userId, intent)
  try {
    let user = await User.findById(userId);
    if (!user.device_token) {
      callback("Not token found")
    } else {
      const message = {
        notification: {
          title: title,
          body: body
        },
        data: {
          title: title,
          body: body
        },
        android: {
          notification: {
            sound: 'default',
            click_action: intent || "",
          },
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default'
            },
          },
        },
        token: user.device_token
      };
      let response = await admin.messaging().send(message)
      console.log("notification", response)
      callback(null, response)
    }
  } catch (ex) {
    console.log("notification Error", ex);
    callback("Error: Notification Failed!", null)
  }
}

async function sendMultiCast(title, body, intent, tokens, callback) {
  console.log("sendNotification", title, body, intent, tokens)
  try {
    const message = {
      notification: {
        title: title,
        body: body
      },
      data: {
        title: title,
        body: body
      },
      android: {
        notification: {
          sound: 'default',
          click_action: intent || "",
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default'
          },
        },
      },
      tokens
    };
    let response = await admin.messaging().sendMulticast(message)
    console.log("notification", response)
    callback(null, "success")
  } catch (ex) {
    console.log("notification Error", ex);
    callback("Error: Notification Failed!", null)
  }
}

async function createNotification(actionId, title, message, user, action, callback) {
  try {
    let notification = new Notification({ title, message, for: user, action, actionId });
    notification = await notification.save();
    callback(null, notification)
  } catch (ex) {
    console.log("Exception", ex)
    callback("Error saving notification");
  }

}

module.exports = {
  sendSMS: sendSMS,
  sendNotification: sendNotification,
  sendMultiCast: sendMultiCast,
  sendEmail: sendEmail,
  createNotification: createNotification,
  sendNotificationByUserId: sendNotificationByUserId,
  sendSMSByUserId: sendSMSByUserId,
  createDynamicJobLink: createDynamicJobLink
}



