const express = require('express')
const router = express.Router()
const path = require('path')
const Notification = require('../models/Notification')
const utils = require('../../utils')

router.post('/list', async (request, response, next) => {
    const { start, end, venue, service, action } = request.body
    let conditions = [{ deleted: false }]

    if (start && end) {
        conditions.push({ createdAt: { $lte: end } })
        conditions.push({ createdAt: { $gte: end } })
    }
    if (start) conditions.push({ createdAt: { $gte: start } })
    if (venue) conditions.push({ venue })
    if (service) conditions.push({ service })
    if (action) conditions.push({ action })
    Notification.find({ $and: conditions }).exec((error, notifications) => {
        console.log(error, notifications && notifications.length);
        if (error) {
            return response.send(utils.createError(error))
        } else if (!notifications || notifications.length === 0) {
            return response.send(utils.createError("No logs found for the criteria!"))
        } else {
            response.send(utils.createSuccess(notifications))
        }
    })
})

router.post('/userlist', async (request, response, next) => {
    let conditions = [{ for: request.role }, { actionId: request.userId }]
    Notification.find({ $and: conditions })
        .sort({ createdAt: -1 })
        .exec(async (error, notifications) => {
            console.log(error, notifications && notifications.length);
            if (error) {
                return response.send(utils.createError(error))
            } else if (!notifications || notifications.length === 0) {
                return response.send(utils.createError("No new notifications found !"))
            } else {
                response.send(utils.createSuccess(notifications))
                await Notification.updateMany({}, { viewed: true });
            }
        })
})

router.post('/list/:userId/:all?', async (request, response, next) => {
    const { userId, all } = request.params
    let conditions = [{ for: userId }, { deleted: false }]
    if (!all) {
        conditions.push({ viewed: false })
    }

    Notification.find({ $and: conditions })
        .sort({ createdAt: -1 })
        .exec(async (error, notifications) => {
            console.log(error, notifications && notifications.length);
            if (error) {
                return response.send(utils.createError(error))
            } else if (!notifications || notifications.length === 0) {
                return response.send(utils.createError("No new notifications found !"))
            } else {
                response.send(utils.createSuccess(notifications))
                await Notification.updateMany({}, { viewed: true });

            }
        })
})

/* For marking all notification read */
// router.post('/list/:userId/:all')

module.exports = router;