var AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");
var mime = require('mime');

const s3ImageUploadLocalToPublic = (distFolderPath, fileName, folderPath) => {
    const s3 = new AWS.S3();
    const filePath = path.join(distFolderPath, fileName);
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (error, fileContent) => {
            if (error) { throw error; }
            s3.putObject({
                Bucket: 'ushx-live',
                Key: folderPath + fileName,
                Body: fileContent,
                ACL: 'public-read',
                ContentType: mime.getType(filePath)
            }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`Successfully uploaded '${fileName}'!`);
                    resolve(res);
                }
            });
        });
    })
}

module.exports = s3ImageUploadLocalToPublic;