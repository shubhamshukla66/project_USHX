const express = require('express')
const router = express.Router()
const path = require('path')
const Project = require('../models/Project')
const Job = require('../models/Job')
const Task = require('../models/Task')
const Comment = require('../models/Comment')
const CheckinLog = require('../models/CheckinLog')
const { Message, MessageType } = require('../models/chatMessage')
const User = require('../models/User')
const Admin = require('../models/Admin')
const mailer = require('./mailer')
const utils = require('../../utils')
const multer = require('multer')
const multerS3 = require('multer-s3');
const { populate } = require('../models/User')
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
            cb(null, `${new Date().getTime()}.${a[a.length - 1]}`)
        } catch (e) {
            cb(e)
        }


        //cb(null, file.fieldname + '-' + Date.now())
    }
})

const upload = multer({
    storage: storage,
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


/* others */
router.get('/list/my', (request, response) => {
    try {
        Project.find({ members: { $in: request.userId }, deleted: false }, { deleted: 0, __v: 0, createdOn: 0 }, request.pagination)
            .populate({ path: "buyer seller affiliate constructionManager contractor", select: "fullName email role" })
            .exec((error, projects) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!projects) {
                    response.send(utils.createError('projects not found'))
                } else {
                    response.send(utils.createResult(error, projects));
                }
            })
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Unauthorized: invalid token'))
    }
})

/* admin */
router.get('/list', (request, response) => {
    console.log(request.file)
    try {
        Project.find({ deleted: false }, { deleted: 0, __v: 0, createdOn: 0 })
            .populate({ path: "buyer seller affiliate constructionManager contractor", select: "fullName email role" })
            .sort({ createdAt: -1 })
            .exec((error, projects) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!projects) {
                    response.send(utils.createError('projects not found'))
                } else {
                    response.send(utils.createResult(error, projects));
                }
            })
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Unauthorized: invalid token'))
    }
})

/* admin */
router.get('/detail/:id', (request, response) => {
    try {
        const { id } = request.params;
        if (id) {
            Project.findOne({ _id: id }, { deleted: 0, __v: 0, createdOn: 0 })
                .populate({ path: "buyer seller affiliate constructionManager contractor realtor accountExec loanOfficer", select: "fullName email role" })
                .populate("property")
                .populate({ path: 'jobs', populate: 'tasks comments' })
                .populate({
                    path: 'messages', populate: [{ path: 'from', select: "_id fullName email image last_seen" },
                    { path: 'project', select: "_id name" }]
                })
                .exec((error, project) => {
                    if (error) {
                        response.send(utils.createError(error))
                    } else if (!project) {
                        response.send(utils.createError('project not found'))
                    } else {
                        console.log({
                            project
                        })

                        response.send(utils.createResult(error, project));

                        // if(name) project.name = name;
                        // if(buyer) project.buyer = buyer
                        // if(seller) project.seller = seller
                        // if(affiliate) project.affiliate = affiliate
                        // if(constructionManager) project.constructionManager = constructionManager
                        // if(contractor) project.contractor = contractor 

                        // project.save((error,project)=>{
                        //     if (error) {
                        //         response.send(utils.createError(error))
                        //     } else if (!project) {
                        //         response.send(utils.createError('project not found'))
                        //     } else {                                    

                        //     }
                        // })
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

/* admin */
router.post('/add', (request, response) => {
    try {
        const { name, description, property, buyer, seller, affiliate, constructionManager, contractor, realtor, loanOfficer, accountExec } = request.body;
        if (name) {
            let project = new Project();
            project.name = name;
            project.description = description;
            if (property) {
                project.property = property
            }
            if (buyer) {
                project.buyer = buyer
                project.members.push(buyer)
            }
            if (seller) {
                project.seller = seller
                project.members.push(seller)
            }
            if (affiliate) {
                project.affiliate = affiliate
                project.members.push(affiliate)
            }
            if (constructionManager) {
                project.constructionManager = constructionManager
                project.members.push(constructionManager)
            }
            if (contractor) {
                project.contractor = contractor
                project.members.push(contractor)
            }

            if (realtor) {
                project.realtor = realtor
                project.members.push(realtor)
            }

            if (accountExec) {
                project.accountExec = accountExec
                project.members.push(accountExec)
            }

            if (loanOfficer) {
                project.loanOfficer = loanOfficer
                project.members.push(loanOfficer)
            }

            project.save((error, project) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!project) {
                    response.send(utils.createError('project not found'))
                } else {
                    response.send(utils.createResult(error, project));
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

/* admin */
router.post('/update/:id', (request, response) => {
    try {
        const { id } = request.params;
        const { name, description, property, buyer, seller, affiliate, constructionManager, contractor, loanOfficer, realtor, accountExec } = request.body;
        if (id) {
            Project.findOne({ _id: id }, { deleted: 0, __v: 0, createdOn: 0 }, (error, project) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!project) {
                    response.send(utils.createError('project not found'))
                } else {

                    if (name) project.name = name;
                    if (description) project.description = description;
                    if (property) project.property = property

                    if (buyer) {
                        let index = project.members.indexOf(project.buyer)
                        if (index > -1)
                            project.members.splice(index, 1, buyer)
                        else project.members.push(buyer)
                        project.buyer = buyer
                        //project.members.push(buyer)
                    }
                    if (seller) {
                        let index = project.members.indexOf(project.seller)
                        if (index > -1)
                            project.members.splice(index, 1, seller)
                        else project.members.push(seller)
                        project.seller = seller
                    }
                    if (affiliate) {
                        let index = project.members.indexOf(project.affiliate)
                        if (index > -1)
                            project.members.splice(index, 1, affiliate)
                        else project.members.push(affiliate)
                        project.affiliate = affiliate
                    }
                    if (constructionManager) {
                        let index = project.members.indexOf(project.constructionManager)
                        if (index > -1)
                            project.members.splice(index, 1, constructionManager)
                        else project.members.push(constructionManager)
                        project.constructionManager = constructionManager
                    }
                    if (contractor) {
                        let index = project.members.indexOf(project.contractor)
                        if (index > -1)
                            project.members.splice(index, 1, contractor)
                        else project.members.push(contractor)
                        project.contractor = contractor
                    }
                    if (realtor) {
                        let index = project.members.indexOf(project.realtor)
                        if (index > -1)
                            project.members.splice(index, 1, realtor)
                        else project.members.push(realtor)
                        project.realtor = realtor
                    }
                    if (accountExec) {
                        let index = project.members.indexOf(project.accountExec)
                        if (index > -1)
                            project.members.splice(index, 1, accountExec)
                        else project.members.push(accountExec)
                        project.accountExec = accountExec
                    }
                    if (loanOfficer) {
                        let index = project.members.indexOf(project.loanOfficer)
                        if (index > -1)
                            project.members.splice(index, 1, loanOfficer)
                        else project.members.push(loanOfficer)
                        project.loanOfficer = loanOfficer
                    }

                    project.save((error, project) => {
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!project) {
                            response.send(utils.createError('project not found'))
                        } else {
                            response.send(utils.createResult(error, project));
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

/* delete project */
router.delete('/delete/:id', (request, response) => {
    try {
        const { id } = request.params;
        if (id) {
            Project.findOne({ _id: id }, { deleted: 0, __v: 0, createdOn: 0 }, (error, project) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!project) {
                    response.send(utils.createError('project not found'))
                } else {

                    project.deleted = true;

                    project.save((error, project) => {
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!project) {
                            response.send(utils.createError('project not found'))
                        } else {
                            response.send(utils.createSuccess(project));
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

/* amdin */
router.post('/job/create/:projectId', (request, response) => {
    try {
        const { projectId } = request.params;
        const { phase, title, description, estCost, trade, property, contractor } = request.body;
        if (projectId) {
            Project.findOne({ _id: projectId }, { deleted: 0, __v: 0, createdOn: 0 }, async (error, project) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!project) {
                    response.send(utils.createError('project not found'))
                } else {
                    let phaseId = phase
                    if (!phaseId) {
                        let count = await Phase.count({ project: projectId })
                        phaseId = await new Phase({ name: `Phase ${count}`, project: projectId }).save()
                    }

                    if (phaseId) {

                        let job = new Job()

                        if (title) job.title = title;
                        if (description) job.description = description
                        if (estCost) job.estCost = estCost
                        if (trade) job.trade = trade
                        if (property) job.property = property
                        if (phaseId) job.phase = phaseId
                        if (contractor) {
                            job.contractor = contractor
                            job.status = 'accepted'
                            job.applied.push(contractor)
                        }
                        job.project = projectId
                        job.createdBy = request.userId

                        job.save((error, job) => {
                            if (error) {
                                response.send(utils.createError(error))
                            } else if (!job) {
                                response.send(utils.createError('job not saved!'))
                            } else {
                                project.jobs.push(job)
                                project.save(async (error, project) => {
                                    if (error) {
                                        response.send(utils.createError(error))
                                    } else if (!project) {
                                        response.send(utils.createError('project not found'))
                                    } else {

                                        let notifTitle = `New Job Assigned`;
                                        let message = `A new job (${job.title}) has been assigned to you`
                                        if (contractor) {
                                            let user = await User.findById(contractor)
                                            utils.sendWebNotifications(notifTitle, message, "", [user._id], response.connectedClients, response.io)
                                            mailer.sendNotificationByUserId(notifTitle, message, '', contractor, (e, data) => {
                                                console.log("Send Notification", e, data);
                                                mailer.sendSMSByUserId(user._id, message, (err, data) => {
                                                    console.log("Send SMSByUserId", err, data);
                                                    message = `<h3>Hello ${user.fullName}!</h3><p>A new job (${job.title}) has been assigned to you by Senior Construction Advisor.</p><p>Thanks</br>US Housing Exchange</p>`
                                                    mailer.sendEmail(user.email, notifTitle, message, (err, data) => {
                                                        console.log("User Email", err, data);

                                                        response.send(utils.createResult(error, job));
                                                    })
                                                })
                                            })
                                        } else {
                                            response.send(utils.createResult(error, job));
                                        }
                                    }
                                })
                            }
                        })
                    }
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

/* admin */
router.post('/job/update/:jobId', (request, response) => {
    try {
        const { jobId } = request.params;
        const { title, description, estCost, trade, property, contractor } = request.body;
        if (jobId) {
            Job.findOne({ _id: jobId }, { deleted: 0, __v: 0, createdOn: 0 }, (error, job) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!job) {
                    response.send(utils.createError('project not found'))
                } else {

                    if (title) job.title = title;
                    if (description) job.description = description
                    if (estCost) job.estCost = estCost
                    if (trade) job.trade = trade
                    if (property) job.property = property
                    if (contractor) {
                        job.contractor = contractor
                        job.status = 'accepted'
                        job.applied.push(contractor)
                    }
                    job.save((error, job) => {
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!job) {
                            response.send(utils.createError('job not saved!'))
                        } else {
                            if (contractor) {
                                let notifTitle = `New Job Assigned`;
                                let message = `A new job (${job.title}) has been assigned to you`
                                utils.sendWebNotifications(notifTitle, message, "", [contractor], response.connectedClients, response.io)
                            }
                            response.send(utils.createResult(error, job));
                        }
                    })
                }
            })

        } else {
            response.send(utils.createError('invalid request'))
        }
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Something went wrong!'))
    }
})

/* admin */
router.delete('/job/delete/:jobId', (request, response) => {
    try {
        const { jobId } = request.params;

        if (jobId) {
            Job.findOne({ _id: jobId }, { deleted: 0, __v: 0, createdOn: 0 }, (error, job) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!job) {
                    response.send(utils.createError('project not found'))
                } else {

                    job.deleted = true;

                    job.save((error, job) => {
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!job) {
                            response.send(utils.createError('job not saved!'))
                        } else {
                            Project.findOne({ _id: job.project }, async (err, project) => {
                                if (err) {
                                    response.send(utils.createError(err))
                                } else if (!project) {
                                    response.send(utils.createError('project not found!'))
                                } else {
                                    let jobindex = project['jobs'].indexOf(job._id);
                                    project['jobs'].splice(jobindex, 1);
                                    await project.save();
                                    response.send(utils.createResult(error, job));
                                }
                            })

                        }
                    })
                }
            })

        } else {
            response.send(utils.createError('invalid request'))
        }
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Something went wrong!'))
    }
})

/* admin */
router.post('/job/task/create/:jobId', (request, response) => {
    try {
        const { jobId } = request.params;
        const { tasks } = request.body;
        if (jobId) {
            Job.findOne({ _id: jobId }, { deleted: 0, __v: 0, createdOn: 0 }, (error, job) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!job) {
                    response.send(utils.createError('project not found'))
                } else {
                    let tasksArr = tasks.map(t => {
                        return { title: t.title, taskDescription: t.description, job: jobId, createdBy: request.userId }
                    })
                    console.log({
                        tasksArr
                    })
                    Task.insertMany(tasksArr, (error, tasks) => {
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!tasks) {
                            response.send(utils.createError('tasks not saved!'))
                        } else {
                            job.tasks.push(...tasks)
                            job.save((error, job) => {
                                if (error) {
                                    response.send(utils.createError(error))
                                } else if (!job) {
                                    response.send(utils.createError('job not found'))
                                } else {
                                    response.send(utils.createResult(error, tasks));
                                }
                            })
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

/* admin */
router.post('/job/task/update/:taskId', (request, response) => {
    try {
        const { taskId } = request.params;
        const { title, description } = request.body

        if (taskId) {
            Task.findOne({ _id: taskId }, { deleted: 0, __v: 0, createdOn: 0 }, (error, task) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!task) {
                    response.send(utils.createError('task not found'))
                } else {

                    if (title) task.title = title;
                    if (description) task.taskDescription = description;

                    task.save((error, task) => {
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!task) {
                            response.send(utils.createError('task not saved!'))
                        } else {
                            Job.findOne({ _id: task.job }, async (err, job) => {
                                if (err) {
                                    response.send(utils.createError(err))
                                } else if (!job) {
                                    response.send(utils.createError('job not found!'))
                                } else {
                                    response.send(utils.createResult(error, job));
                                }
                            })

                        }
                    })
                }
            })

        } else {
            response.send(utils.createError('invalid request'))
        }
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Something went wrong!'))
    }
})

/* admin */
router.delete('/job/task/delete/:taskId', (request, response) => {
    try {
        const { taskId } = request.params;

        if (taskId) {
            Task.findOne({ _id: taskId }, { deleted: 0, __v: 0, createdOn: 0 }, (error, task) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!task) {
                    response.send(utils.createError('task not found'))
                } else {

                    task.deleted = true;

                    task.save((error, task) => {
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!task) {
                            response.send(utils.createError('task not saved!'))
                        } else {
                            Job.findOne({ _id: task.job }, async (err, job) => {
                                if (err) {
                                    response.send(utils.createError(err))
                                } else if (!job) {
                                    response.send(utils.createError('job not found!'))
                                } else {
                                    let taskindex = job['tasks'].indexOf(task._id);
                                    job['jobs'].splice(taskindex, 1);
                                    await job.save();
                                    response.send(utils.createResult(error, job));
                                }
                            })

                        }
                    })
                }
            })

        } else {
            response.send(utils.createError('invalid request'))
        }
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Something went wrong!'))
    }
})


/* dono */
router.delete('/job/task/complete/:taskId', (request, response) => {
    try {
        const { taskId } = request.params;
        const { role } = request.body;
        if (taskId) {
            Task.findOne({ _id: taskId }, { deleted: 0, __v: 0, createdOn: 0 }, (error, task) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!task) {
                    response.send(utils.createError('task not found'))
                } else {

                    if (role == "construction" || role == "admin") {
                        task.managerComplete = true;
                    } else
                        task.contractorComplete = true;

                    task.isComplete = true;
                    task.save((error, task) => {
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!task) {
                            response.send(utils.createError('task not saved!'))
                        } else {
                            response.send(utils.createSuccess(task))
                        }
                    })
                }
            })

        } else {
            response.send(utils.createError('invalid request'))
        }
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Something went wrong!'))
    }
})


/* For Both Admin and Contractor to mark job completed */
router.delete('/job/mark-complete/:jobId', (request, response) => {
    try {
        const { jobId } = request.params;
        const { role, punctuality,
            communication,
            workQuality,
            finishedJobonSchedule,
            professionalism } = request.role;
        if (jobId) {
            Job.findOne({ _id: jobId }, { deleted: 0, __v: 0, createdOn: 0 }, (error, job) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!job) {
                    response.send(utils.createError('job not found'))
                } else {
                    console.log('job', job);
                    if (role == 'admin' || role == 'construction') {
                        if (job.contractorComplete) {
                            job.managerComplete = true
                            job.punctuality = punctuality
                            job.communication = communication
                            job.workQuality = workQuality
                            job.finishedJobonSchedule = finishedJobonSchedule
                            job.professionalism = professionalism
                            job.status = 'completed'
                        } else {
                            return response.send(utils.createError('You cannot mark this task complete until the contractor complete it first'));
                        }
                    } else {
                        job.contractorComplete = true;
                        job.status = 'completed'
                    }

                    job.save(async (error, job) => {
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!job) {
                            response.send(utils.createError('task not saved!'))
                        } else {
                            job = await Job.findById(job._id).populate('project')
                            let user = await User.findById(request.userId);
                            let title = `${user.role} ${user.fullName} Completed a job`;
                            let message = `${user.role} ${user.fullName}  has completed the job ${job.title} in project ${job.project.name}.`

                            mailer.createNotification(job.project._id, title, message, 'admin', 'job', (err, data) => {
                                mailer.createNotification(job.contractor._id, 'Completed a job', 'Job has been Completed', 'contractor', 'job', (err, data) => {
                                    mailer.createNotification(job.createdBy._id, 'Completed a job', 'Job has been Completed', 'buyer', 'job', (err, data) => {
                                        mailer.sendNotificationByUserId('Completed a job', 'Job has been Completed', '', job.contractor._id, (e, data) => {
                                            console.log("createNotification", err, data);
                                            message = `<h3>Hello!</h3><p>${user.role} ${user.fullName}  has completed the job ${job.title} in project ${job.project.name}.</p><p>US Housing Exchange</p>`
                                            mailer.sendEmail('admin@ushousingexchange.com', title, message, (err, data) => {
                                                console.log("Admin Email", err, data);
                                                title = `You have completed a job`;
                                                message = `<h3>Hello ${user.fullName}!</h3><p>You marked completed the job ${job.title} in project ${job.project.name}. The job has been sent for approval.</p><p>US Housing Exchange</p>`
                                                mailer.sendEmail(user.email, title, message, (err, data) => {
                                                    console.log("User Email", err, data);
                                                    response.send(utils.createSuccess(job))
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                            response.send(utils.createSuccess(job))
                        }
                    })
                }
            })

        } else {
            response.send(utils.createError('invalid request'))
        }
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Something went wrong!'))
    }
})

/* For Both Admin and Contractor to mark job completed */
router.post('/job/mark-complete/:jobId', (request, response) => {
    try {
        const { jobId } = request.params;
        const { role, punctuality,
            communication,
            workQuality,
            finishedJobonSchedule,
            professionalism } = request.body;
        if (jobId) {
            Job.findOne({ _id: jobId }, { deleted: 0, __v: 0, createdOn: 0 }, (error, job) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!job) {
                    response.send(utils.createError('job not found'))
                } else {
                    console.log('job', job);
                    if (role == 'admin' || role == 'construction') {
                        if (job.contractorComplete) {
                            job.managerComplete = true
                            job.punctuality = punctuality
                            job.communication = communication
                            job.workQuality = workQuality
                            job.finishedJobonSchedule = finishedJobonSchedule
                            job.professionalism = professionalism
                            job.status = 'completed'
                        } else {
                            return response.send(utils.createError('You cannot mark this task complete until the contractor complete it first'));
                        }
                    } else {
                        job.contractorComplete = true;
                        job.status = 'completed'
                    }

                    job.save(async (error, job) => {
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!job) {
                            response.send(utils.createError('task not saved!'))
                        } else {
                            job = await Job.findById(job._id).populate('project')
                            let user = await User.findById(request.userId);
                            console.log(role, role == 'admin' || role == 'construction')
                            if (role == 'admin' || role == 'construction') {
                                user = await Admin.findById(request.userId);
                            }
                            let title = `${user.role} ${user.fullName} Completed a job`;
                            let message = `${user.role} ${user.fullName}  has completed the job ${job.title} in project ${job.project.name}.`

                            mailer.createNotification(job.project._id, title, message, 'admin', 'job', (err, data) => {
                                console.log("createNotification", err, data);
                                message = `<h3>Hello!</h3><p>${user.role} ${user.fullName}  has completed the job ${job.title} in project ${job.project.name}.</p><p>US Housing Exchange</p>`
                                mailer.sendEmail('admin@ushousingexchange.com', title, message, (err, data) => {
                                    console.log("Admin Email", err, data);
                                    title = `You have completed a job`;
                                    message = `<h3>Hello ${user.fullName}!</h3><p>You marked completed the job ${job.title} in project ${job.project.name}. The job has been sent for approval.</p><p>US Housing Exchange</p>`
                                    mailer.sendEmail(user.email, title, message, (err, data) => {
                                        console.log("User Email", err, data);
                                        response.send(utils.createSuccess(job))
                                    })
                                })
                            })
                            response.send(utils.createSuccess(job))
                        }
                    })
                }
            })

        } else {
            response.send(utils.createError('invalid request'))
        }
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Something went wrong!'))
    }
})

/* To get all the jobs completed by contractor (can be used by both admin and contractor) */
router.get('/job/completed-list/:contractorId', (request, response) => {
    const { contractorId } = request.params
    try {
        if (contractorId) {
            // 
            Job.find({ contractor: contractorId, status: 'completed' }, { deleted: 0, __v: 0, createdOn: 0 })
                .populate("comments")
                .populate({ path: 'tasks', populate: { path: 'createdBy completedBy', select: 'fullName email phone role image' } })
                .sort({ createdAt: -1 })
                .exec((error, jobs) => {

                    if (error) {
                        response.send(utils.createError(error))
                    } else if (!jobs) {
                        response.send(utils.createError('job not found'))
                    } else {
                        response.send(utils.createResult(error, jobs));
                    }
                })

        } else {
            response.send(utils.createError('Please put contractor'))
        }
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Something went wrong!'))
    }
})

/* Contractor side api */
router.delete('/job/contractor/acceptdecline/:jobId/:acceptedType?', validateUserApproved, (request, response) => {
    try {
        const { jobId, acceptedType } = request.params;
        const { accepted } = request.body;
        if (jobId) {
            Job.findOne({ _id: jobId }, { deleted: 0, __v: 0, createdOn: 0 }, (error, job) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!job) {
                    response.send(utils.createError('job not found'))
                } else {
                    console.log({
                        acceptedType
                    })

                    if (job.applied.indexOf(request.userId) > -1) {
                        return response.send(utils.createError('You have applied to this Job'))
                    } else {
                        if (job.declined.indexOf(request.userId) > -1) {
                            return response.send(utils.createError('You have declined to this Job'))
                        }
                    }
                    if (accepted || acceptedType == 'true') {
                        console.log('akshay');
                        // job.contractor = request.userId;
                        // job.status = "accepted";
                        job.applied.push(request.userId);


                    }
                    else {
                        console.log('hey');
                        job.declined.push(request.userId);
                        //job.status = "declined";
                    }

                    job.save(async (error, job) => {
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!job) {
                            response.send(utils.createError('task not saved!'))
                        } else {
                            job = await Job.findById(job._id).populate('project')
                            let user = await User.findById(request.userId);
                            let title = `${user.role} ${user.fullName} Applied to a job`;
                            let message = `${user.role} ${user.fullName}  has applied to the job ${job.title} in project ${job.project.name}.`

                            mailer.createNotification(job.project._id, title, message, 'admin', 'job', (err, data) => {
                                console.log("createNotification", err, data);
                                message = `<h3>Hello!</h3><p>${user.role} ${user.fullName}  has applied to the job ${job.title} in project ${job.project.name}.</p><p>US Housing Exchange</p>`
                                mailer.sendEmail('admin@ushousingexchange.com', title, message, (err, data) => {
                                    console.log("Admin Email", err, data);
                                    title = `Your job application has been sent for approval`;
                                    message = `<h3>Hello ${user.fullName}!</h3><p>You applied to the job ${job.title} in project ${job.project.name}. The job has been sent for approval.</p><p>US Housing Exchange</p>`
                                    mailer.sendEmail(user.email, title, message, (err, data) => {
                                        console.log("User Email", err, data);
                                        response.send(utils.createSuccess(job))
                                    })
                                })
                            })

                        }
                    })
                }
            })

        } else {
            response.send(utils.createError('invalid request'))
        }
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Something went wrong!'))
    }
})


/* SCA side api */
router.post('/job/sca/assign/:jobId/:contractorId', (request, response) => {
    try {
        const { jobId, contractorId } = request.params;

        if (jobId && contractorId) {
            Job.findOne({ _id: jobId }, { deleted: 0, __v: 0, createdOn: 0 }, (error, job) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!job) {
                    response.send(utils.createError('job not found'))
                } else {
                    job.contractor = contractorId;
                    job.status = "accepted";

                    job.save(async (error, job) => {
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!job) {
                            response.send(utils.createError('task not saved!'))
                        } else {
                            let user = await User.findById(contractorId)
                            let title = `New Job Assigned`;
                            let message = `A new job (${job.title}) has been assigned by Senior Construction Advisor`

                            // mailer.createNotification(title,message,'admin',(err,data)=>{
                            //   console.log("createNotification",err,data);

                            //   message = `<h3>Hello!</h3><p>A new job (${job.title}) has been assigned.</p><p>US Housing Exchange</p>`          
                            //   mailer.sendEmail('admin@ushousingexchange.com',title,message,(err,data)=>{
                            //     console.log("Admin Email",err,data);
                            utils.sendWebNotifications(title, message, "", [user._id], response.connectedClients, response.io)
                            mailer.sendNotificationByUserId(title, message, '', contractorId, (e, data) => {
                                console.log("Send Notification", e, data);
                                mailer.sendSMSByUserId(user._id, message, (err, data) => {
                                    console.log("Send SMSByUserId", err, data);
                                    message = `<h3>Hello ${user.fullName}!</h3><p>A new job (${job.title}) has been assigned to you by Senior Construction Advisor.</p><p>Thanks</br>US Housing Exchange</p>`
                                    mailer.sendEmail(user.email, title, message, (err, data) => {
                                        console.log("User Email", err, data);

                                        response.send(utils.createSuccess(job))
                                    })
                                })

                            })
                            //   })
                            // })  
                            response.send(utils.createSuccess(job))
                        }
                    })
                }
            })

        } else {
            response.send(utils.createError('invalid request'))
        }
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Something went wrong!'))
    }
})

/* For creating a job ADMIN */
router.post('/job/comment/create/:jobId', upload.array('image', 5), (request, response) => {
    try {
        const { jobId } = request.params;
        const { text } = request.body;
        if (jobId) {
            Job.findOne({ _id: jobId }, { deleted: 0, __v: 0, createdOn: 0 }, async (error, job) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!job) {
                    response.send(utils.createError('project not found'))
                } else {
                    let comment = new Comment();

                    if (request.files && request.files.length > 0) {

                        console.log('Files uploaded successfully.');
                        console.log(request.files)
                        for (let i = 0; i < request.files.length; i++) {
                            const file = request.files[i];
                            await s3ImageUpload(file, 'uploads/comments');
                            console.log("extracted", file);
                            comment.text = text.length > 0 ? text : "";
                            comment.image = `uploads/comments/${file.filename}`;
                            comment.type = "image"
                        }
                    } else {
                        comment.text = text;
                        comment.type = "string"
                    }
                    comment.user = request.userId
                    comment.admin = request.userId
                    comment.job = jobId
                    comment.timelog = new Date().getTime()

                    comment.save((error, comment) => {
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!comment) {
                            response.send(utils.createError('comment not saved!'))
                        } else {
                            job.comments.push(comment)
                            job.save((error, job) => {
                                if (error) {
                                    response.send(utils.createError(error))
                                } else if (!job) {
                                    response.send(utils.createError('job not found'))
                                } else {
                                    response.send(utils.createResult(error, job));
                                }
                            })
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


/* Comment delete for both admin and contractor*/
router.delete('/job/comment/delete/:commentId', validateUserApproved, (request, response) => {
    try {
        const { commentId } = request.params;

        if (commentId) {
            Comment.findOne({ _id: commentId }, { deleted: 0, __v: 0, createdOn: 0 }, (error, comment) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!comment) {
                    response.send(utils.createError('comment not found'))
                } else {

                    comment.deleted = true;

                    comment.save((error, comment) => {
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!comment) {
                            response.send(utils.createError('comment not saved!'))
                        } else {
                            Job.findOne({ _id: comment.job }, async (err, job) => {
                                if (err) {
                                    response.send(utils.createError(err))
                                } else if (!job) {
                                    response.send(utils.createError('job not found!'))
                                } else {
                                    let commentindex = job['comments'].indexOf(comment._id);
                                    job['comments'].splice(commentindex, 1);
                                    await job.save();
                                    response.send(utils.createResult(error, job));
                                }
                            })

                        }
                    })
                }
            })

        } else {
            response.send(utils.createError('invalid request'))
        }
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Something went wrong!'))
    }
})


/* get all the accepted job of contractor */
router.get('/job/getAll/accepted', (request, response) => {
    try {

        if (request.userId) {
            Job.find({ contractor: request.userId, status: 'accepted' }, { deleted: 0, __v: 0, createdOn: 0 })
                .populate("comments")
                .populate({ path: 'property', select: 'address photo_gallery city country' })
                .populate({ path: 'tasks', populate: { path: 'createdBy completedBy', select: 'fullName email phone role image' } })
                .sort({ createdAt: -1 })
                .exec((error, jobs) => {
                    if (error) {
                        response.send(utils.createError(error))
                    } else if (!jobs) {
                        response.send(utils.createError('job not found'))
                    } else {
                        response.send(utils.createResult(error, jobs));
                    }
                })

        } else {
            response.send(utils.createError('invalid request'))
        }
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Something went wrong!'))
    }
})

/* All the jobs that matches the contractors trades */
router.get('/job/getAll/pending/:tradeType?', validateUserApproved, (request, response) => {
    console.log({
        a: request.userId,
        type: typeof request.userId,
        role: request.role
    })
    const { tradeType } = request.params;
    try {
        User.findOne({ _id: request.userId, deleted: false })
            .populate({ path: "contractorProfile" })
            .exec(async (error, user) => {
                console.log({
                    user, error
                })
                if (error) {
                    response.send(utils.createError(error))
                } else if (!user) {
                    response.send(utils.createError('user not found'))
                } else if (!user.approved) {
                    response.send(utils.createError('Your application is still pending'))
                } else {
                    console.log("hey")
                    // {trade:{$in:user.contractorProfile.trades}}, condition for checking trades according to contractor trades
                    let condition = [{ status: 'new' }, { deleted: false }, { declined: { $nin: user._id } }, { applied: { $nin: user._id } }]
                    if (tradeType) {
                        condition.push({ trade: tradeType })
                    } else {
                        condition.push({ trade: { $in: user.contractorProfile.trades.split(',') } })
                        //UNCOMMENT condition for checking trades according to contractor trades
                    }
                    console.log("conditions", condition)
                    Job.find({ $and: condition }, { deleted: 0, __v: 0, createdOn: 0 })
                        .populate("project")
                        .populate("comments")
                        .populate({ path: 'property', select: 'address photo_gallery city country' })
                        .populate({ path: 'tasks', populate: { path: 'createdBy completedBy', select: 'fullName email phone role image contractorComplete managerComplete' } })
                        .sort({ createdAt: -1 })
                        .exec((error, jobs) => {
                            if (error) {
                                response.send(utils.createError(error))
                            } else if (!jobs) {
                                response.send(utils.createError('job not found'))
                            } else {
                                let jobsPending = jobs.filter(j => !j.project.deleted)
                                response.send(utils.createResult(error, jobsPending));
                            }
                        })
                }
            })

    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Something went wrong!'))
    }
})


/* Getting the job details */
router.get('/job/get/:jobId', (request, response) => {
    try {
        const { jobId } = request.params;

        if (jobId) {
            Job.findOne({ _id: jobId }, { deleted: 0, __v: 0, createdOn: 0 })
                .populate({ path: "comments", populate: { path: 'user admin', select: 'fullName email phone role image' } })
                .populate({ path: 'tasks', populate: { path: 'createdBy completedBy', select: 'fullName email phone role image' } })
                .populate({ path: 'contractor', select: 'fullName email phone role image' })
                .populate({ path: 'applied', select: 'fullName email phone role image' })
                .populate({ path: 'denied', select: 'fullName email phone role image' })
                .populate('property')
                .sort({ createdAt: -1 })
                .exec((error, job) => {
                    console.log("error,job", error, job)
                    if (error) {
                        response.send(utils.createError(error))
                    } else if (!job) {
                        response.send(utils.createError('job not found'))
                    } else {
                        response.send(utils.createResult(error, job));
                    }
                })

        } else {
            response.send(utils.createError('invalid request'))
        }
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Something went wrong!'))
    }
})


/* a and c */
router.get('/job/comment/get/:jobId', validateUserApproved, (request, response) => {
    try {
        const { jobId } = request.params;

        if (jobId) {
            Comment.find({ job: jobId }, { deleted: 0, __v: 0, createdOn: 0 })
                .populate('user')
                .populate('admin')
                // .sort({timelog:-1})
                .exec((error, comments) => {
                    console.log("error,comments", error, comments);
                    if (error) {
                        response.send(utils.createError(error))
                    } else if (!comments) {
                        response.send(utils.createError('comment not found'))
                    } else {
                        response.send(utils.createResult(error, comments));
                    }
                })
        } else {
            response.send(utils.createError('invalid request'))
        }
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Something went wrong!'))
    }
})


/* For creating a Chat Message */
router.post('/chat/create', upload.array('image', 5), (request, response) => {
    try {
        const { text, projectId } = request.body;
        if (projectId) {
            Project.findOne({ _id: projectId }, { deleted: 0, __v: 0, createdOn: 0 }, async (error, project) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!project) {
                    response.send(utils.createError('project not found'))
                } else {
                    let message = new Message();

                    if (request.files && request.files.length > 0) {

                        console.log('Files uploaded successfully.');
                        console.log(request.files)
                        for (let i = 0; i < request.files.length; i++) {
                            const file = request.files[i];
                            await s3ImageUpload(file, 'uploads/comments');
                            console.log("extracted", file);
                            message.content = `uploads/comments/${file.filename}`;
                            message.content_type = MessageType.PICTURE
                        }
                    } else {
                        message.content = text;
                        message.content_type = MessageType.TEXT
                    }
                    message.from = request.userId
                    message.admin = request.userId
                    message.project = project._id

                    message.save((error, message) => {
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!message) {
                            response.send(utils.createError('message not saved!'))
                        } else {
                            project.messages.push(message)
                            project.save(async (error, project) => {
                                if (error) {
                                    response.send(utils.createError(error))
                                } else if (!project) {
                                    response.send(utils.createError('project not found!'))
                                } else {
                                    Message.findById(message._id).populate({ path: 'from admin', select: '_id fullName email image last_seen' })
                                        .populate({ path: 'project', select: '_id name' })
                                        .exec(async (er, message) => {
                                            let tokens = "";
                                            let members = await User.find({ _id: { $in: project.members } }, { device_token: 1 })
                                            tokens = members.map(m => m.device_token || "test");
                                            let userIds = members.map(m => m._id + "");
                                            console.dir({ tokens, userIds, clients: response.connectedClients }, { depth: null })
                                            utils.sendWebNotifications(`New Message`, `You have got new message in  ${project.name}`, project._id, userIds, response.connectedClients, response.io);
                                            mailer.sendMultiCast(`New Message in  ${project.name}`, text, "activitiesMyChat", tokens, (err, resp) => {
                                                console.log("Notification: ", err, resp)
                                                response.send(utils.createResult(error, message));
                                            })
                                        })
                                }
                            })
                        }
                    })
                }
            })

        } else {
            response.send(utils.createError('invalid request'))
        }
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError("Something went wrong!"))
    }
})


/* Comment delete for both admin and contractor*/
router.get('/chat/getAll/:projectId', validateUserApproved, (request, response) => {
    try {
        const { projectId } = request.params;

        if (projectId) {
            Message.find({ project: projectId, deleted: false }, { deleted: 0, __v: 0 }, request.pagination)
                .populate({ path: 'from admin', select: '_id fullName email image last_seen' })
                .populate({ path: 'project', select: '_id name' })
                .sort({ createdAt: -1 })
                .exec(async (error, messages) => {
                    if (error) {
                        response.send(utils.createError(error))
                    } else if (!messages || messages.length === 0) {
                        response.send(utils.createError('No messages yet!'))
                    } else {
                        let messageIds = messages.map(m => m._id)
                        console.log({ messageIds });
                        let user = await User.findById(request.userId)
                        if (!user) user = await Admin.findById(request.userId)

                        console.log({ error, user })
                        Message.updateMany({ _id: { $in: messageIds } }, {
                            $addToSet: {
                                read_by: {
                                    fullName: user.fullName,
                                    image: user.image,
                                    _id: user._id
                                }
                            }
                        }).exec((error, data) => {
                            console.log({ error, data })
                            response.send(utils.createSuccess(messages))
                        })



                    }
                })

        } else {
            response.send(utils.createError('invalid request'))
        }
    } catch (ex) {
        console.log(ex)
        response.send(utils.createError('Something went wrong!'))
    }
})


/* For creating a cehckin log Contractor */
router.post('/job/checkin/checkout/:jobId', validateUserApproved, (request, response) => {
    try {
        const { jobId } = request.params;

        if (jobId) {
            Job.findOne({ _id: jobId }, { deleted: 0, __v: 0, createdOn: 0 }, async (error, job) => {
                if (error) {
                    response.send(utils.createError(error))
                } else if (!job) {
                    response.send(utils.createError('project not found'))
                } else {
                    let checkin = new CheckinLog();

                    if (job.isCheckedIn) {
                        checkin = await CheckinLog.findById(job.checkinId)
                        checkin.checkOut = new Date().getTime();
                    } else {
                        checkin.checkIn = new Date().getTime();
                    }

                    checkin.user = request.userId
                    checkin.project = job.project
                    checkin.job = jobId

                    if (job.isCheckedIn) {
                        checkin.isCheckedIn = false;
                        job.isCheckedIn = false;
                        job.checkinId = null;
                    } else {
                        checkin.isCheckedIn = true;
                        job.isCheckedIn = true;
                        job.checkinId = checkin._id
                    }
                    checkin.save((error, checkin) => {
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!checkin) {
                            response.send(utils.createError('checkin not saved!'))
                        } else {
                            job.save((error, job) => {
                                if (error) {
                                    response.send(utils.createError(error))
                                } else if (!job) {
                                    response.send(utils.createError('job not found'))
                                } else {
                                    response.send(utils.createResult(error, job));
                                }
                            })
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

/* For creating a cehckin log Contractor */
router.get('/job/checkin/getAll/:jobId', (request, response) => {
    try {
        const { jobId } = request.params;

        if (jobId) {
            CheckinLog.find({ job: jobId }, { deleted: 0, __v: 0, createdOn: 0 })
                .populate({ path: 'job', select: 'title trade' })
                .populate({ path: 'project', select: 'name' })
                .populate({ path: 'user', select: '_id fullName email image last_seen' })
                .sort({ createdAt: -1 })
                .exec(async (error, logs) => {
                    if (error) {
                        response.send(utils.createError(error))
                    } else if (!logs || logs.length === 0) {
                        response.send(utils.createError('No checkin logs found!'))
                    } else {
                        response.send(utils.createSuccess(logs))
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
    if (!user && (request.role == 'admin' || request.role == 'construction'))
        next();
    else if (user && user.approved)
        next();
    else return response.send(utils.createError('Application Not Approved'))
}

module.exports = router;
