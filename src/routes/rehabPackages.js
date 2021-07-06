const express = require('express')
const router = express.Router()
const path = require('path')
const User = require('../models/User')
const RehabPackage = require('../models/RehabPackage')
const utils = require('../../utils')
const multer = require('multer')
const s3ImageUpload = require('./s3ImageUpload')
const config = require('../../config/constants')

// SET STORAGE
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('destination', file);
        try {
            cb(null, config.tempUploadPath)
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
        if (ext !== '.pdf') {
            return callback("Only PDF files are allowed!")
        }
        console.log("fileFilter")
        callback(null, true)
    },
    limits: {
        fileSize: 1024 * 1024 * 10
    }
})


router.get('/package/set/:packageId', validateUserApproved, (request, response) => {
    try {
        const { packageId } = request.params;

        RehabPackage.findOne({ _id: packageId, deleted: false }, { deleted: 0, __v: 0 }, (error, rehabPackage) => {
            if (error) {
                response.send(utils.createError(error))
            } else if (!rehabPackage) {
                response.send(utils.createError('Rehab Package not found!'))
            } else {
                User.findOne({ _id: request.userId, deleted: false })
                    .exec((error, user) => {
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!user) {
                            response.send(utils.createError('user not found!'))
                        } else if (user.projectCreated) {
                            response.send(utils.createError('Your home design is freezed. Preferences can not be change now.'))
                        } else {
                            user.rehabPackage = packageId;
                            user.save(async (error, user) => {
                                if (error) {
                                    response.send(utils.createError(error))
                                } else if (!user) {
                                    response.send(utils.createError('User Rehab Package not saved!'))
                                } else {
                                    response.send(utils.createResult(error, user.safeUser()));
                                }
                            })
                        }
                    })
            }
        })
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Something went wrong!'))
    }
})

router.get('/package/list', (request, response) => {
    try {
        RehabPackage.find({ deleted: false }, { deleted: 0, __v: 0 }, (error, rehabPackages) => {
            if (error) {
                response.send(utils.createError(error))
            } else if (!rehabPackages) {
                response.send(utils.createError('rehabPackages not found'))
            } else {
                User.findOne({ _id: request.userId }).exec((err, user) => {
                    console.log({ err, user: user && true })
                    if (err) {
                        response.send(utils.createResult(error, rehabPackages));
                    } else if (!user && ['admin', 'construction'].indexOf(request.role) > -1) {
                        response.send(utils.createResult(error, rehabPackages));
                    } else {
                        let parsedRehabPackages = JSON.parse(JSON.stringify(rehabPackages))
                        parsedRehabPackages = parsedRehabPackages.map(r => {
                            r['isSelected'] = r._id == user.rehabPackage

                            return r;
                        })
                        response.send(utils.createResult(error, parsedRehabPackages));
                    }
                })
                // response.send(utils.createResult(error,rehabPackages));
            }
        })
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Unauthorized: invalid token'))
    }
})

router.post('/package/add', upload.single('pdfFile'), async (request, response) => {
    try {
        await s3ImageUpload(request.file, 'uploads/rehabpackages');
        const { name } = request.body;
        if (name) {
            let rehabPackage = new RehabPackage();
            rehabPackage.name = name;
            if (request.file) {
                rehabPackage.pdfFile = `uploads/rehabpackages/${request.file.filename}`;
            }

            rehabPackage.save((error, rehabPackage) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!rehabPackage) {
                    response.send(utils.createError('rehabPackage not found'))
                } else {
                    response.send(utils.createResult(error, rehabPackage));
                }
            })
        } else {
            response.send(utils.createError('name is required'))
        }
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Unauthorized: invalid token'))
    }
})

router.post('/package/update/:id', upload.single('pdfFile'), async (request, response) => {
    try {
        await s3ImageUpload(request.file, 'uploads/rehabpackages');
        const { id } = request.params;
        const { name } = request.body
        if (id) {
            RehabPackage.findOne({ _id: id }, { deleted: 0, __v: 0, createdOn: 0 }, (error, rehabPackage) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!rehabPackage) {
                    response.send(utils.createError('rehabPackage not found'))
                } else {

                    if (name) rehabPackage.name = name;
                    if (request.file) {
                        rehabPackage.pdfFile = `uploads/rehabpackages/${file.filename}`;
                    }
                    rehabPackage.save((error, rehabPackage) => {
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!rehabPackage) {
                            response.send(utils.createError('rehabPackage not found'))
                        } else {
                            response.send(utils.createResult(error, rehabPackage));
                        }
                    })
                }
            })
        } else {
            response.send(utils.createError('invalid request'))
        }
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Unauthorized: invalid token'))
    }
})

router.delete('/package/delete/:id', (request, response) => {
    try {
        const { id } = request.params;
        if (id) {
            RehabPackage.findOne({ _id: id }, { deleted: 0, __v: 0, createdOn: 0 }, (error, rehabPackage) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!rehabPackage) {
                    response.send(utils.createError('rehabPackage not found'))
                } else {

                    rehabPackage.deleted = true;

                    rehabPackage.save((error, rehabPackage) => {
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!rehabPackage) {
                            response.send(utils.createError('rehabPackage not found'))
                        } else {
                            response.send(utils.createSuccess(rehabPackage));
                        }
                    })
                }
            })
        } else {
            response.send(utils.createError('invalid request'))
        }
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Unauthorized: invalid token'))
    }
})


async function validateUserApproved(request, response, next) {
    let user = await User.findOne({ _id: request.userId, deleted: false })
    if (user && user.approved)
        next();
    else return response.send(utils.createError('User Application Not Approved'))
}

module.exports = router;
