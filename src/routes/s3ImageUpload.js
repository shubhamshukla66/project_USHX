var AWS = require("aws-sdk");
const fs = require("fs");
const utils = require('../../utils')
const s3Config = require("../../config/s3");

const s3ImageUpload = (file, path) => {
    AWS.config.update(s3Config);
    const s3 = new AWS.S3();
    var params = {
        Bucket: 'ushx-live',
        Body: fs.createReadStream(file.path),
        Key: `${path}/${file.filename}`,
        ContentType: file.mimetype,
        ACL: 'public-read'
    };

    return new Promise((resolve, reject) => {
        s3.upload(params, function (s3Err, data) {
            if (s3Err) {
                utils.createError("Error on upload image!")
                reject(s3Err);
            } else {
                fs.unlinkSync(file.path);
                resolve(data.key)
            }
        })
    })
}

module.exports = s3ImageUpload;