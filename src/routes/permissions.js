const express = require('express')
const router = express.Router()
const path = require('path')
const Permission = require('../models/Permission')
const utils = require('../../utils')

router.get('/list', (request, response) => {
    console.log(request.file)
    try {        
        Permission.find({deleted:false},{deleted:0,__v:0,createdOn:0},(error,permissions)=>{
            if (error) {
                response.send(utils.createError(error))
            } else if (!permissions) {
                response.send(utils.createError('permissions not found'))
            } else {                                    
                response.send(utils.createResult(error,permissions));
            }
        })        
    } catch(ex) {
        console.log(ex)
        response.send(utils.createError('Unauthorized: invalid token'))
    }
})

router.post('/add', (request, response) => {    
    try {         
        const {name} = request.body;
        if(name){
            let permission = new Permission();
            permission.name = name;            

            permission.save((error,permission)=>{
                if (error) {
                    response.send(utils.createError(error))
                } else if (!permission) {
                    response.send(utils.createError('permission not found'))
                } else {                                    
                    response.send(utils.createResult(error,permission));
                }
            })
        }else{
            response.send(utils.createError('name is required'))
        }
    } catch(ex) {
        console.log(ex)
        response.send(utils.createError('Unauthorized: invalid token'))
    }
})

router.post('/update/:id', (request, response) => {    
    try {         
        const {id} = request.params;
        const {name} = request.body
        if(id){
            Permission.findOne({_id:id},{deleted:0,__v:0,createdOn:0},(error,permission)=>{
                if (error) {
                    response.send(utils.createError(error))
                } else if (!permission) {
                    response.send(utils.createError('permission not found'))
                } else {  

                    if(name) permission.name = name;
                    permission.save((error,permission)=>{
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!permission) {
                            response.send(utils.createError('permission not found'))
                        } else {                                    
                            response.send(utils.createResult(error,permission));
                        }
                    })
                }
            }) 
        }else{
            response.send(utils.createError('invalid request'))
        }
    } catch(ex) {
        console.log(ex)
        response.send(utils.createError('Unauthorized: invalid token'))
    }
})

router.delete('/delete/:id', (request, response) => {    
    try {         
        const {id} = request.params;        
        if(id){
            Permission.findOne({_id:id},{deleted:0,__v:0,createdOn:0},(error,permission)=>{
                if (error) {
                    response.send(utils.createError(error))
                } else if (!permission) {
                    response.send(utils.createError('permission not found'))
                } else {  

                    permission.deleted = true;                   

                    permission.save((error,permission)=>{
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!permission) {
                            response.send(utils.createError('permission not found'))
                        } else {                                    
                            response.send(utils.createSuccess(permission));
                        }
                    })
                }
            }) 
        }else{
            response.send(utils.createError('invalid request'))
        }
    } catch(ex) {
        console.log(ex)
        response.send(utils.createError('Unauthorized: invalid token'))
    }
})

module.exports = router;
