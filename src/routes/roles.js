const express = require('express')
const router = express.Router()
const path = require('path')
const Role = require('../models/Role')
const utils = require('../../utils')

router.get('/list', (request, response) => {
    console.log(request.file)
    try {        
        Role.find({deleted:false},{deleted:0,__v:0,createdOn:0})
        .populate({path:'permissions',select:'name'})
        .exec((error,roles)=>{
            if (error) {
                response.send(utils.createError(error))
            } else if (!roles) {
                response.send(utils.createError('roles not found'))
            } else {                                    
                response.send(utils.createResult(error,roles));
            }
        })        
    } catch(ex) {
        console.log(ex)
        response.send(utils.createError('Unauthorized: invalid token'))
    }
})


router.post('/add', (request, response) => {    
    try {         
        const {name,permissions} = request.body;
        if(name){
            let role = new Role();
            role.name = name;            
            if(permissions) role.permissions = permissions //.split(',');

            role.save((error,role)=>{
                if (error) {
                    response.send(utils.createError(error))
                } else if (!role) {
                    response.send(utils.createError('role not found'))
                } else {                                    
                    response.send(utils.createResult(error,role));
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
        const {name,permissions} = request.body
        if(id){
            Role.findOne({_id:id},{deleted:0,__v:0,createdOn:0},(error,role)=>{
                if (error) {
                    response.send(utils.createError(error))
                } else if (!role) {
                    response.send(utils.createError('role not found'))
                } else {  

                    if(name) role.name = name;
                    if(permissions) role.permissions = permissions //.split(',');                    

                    role.save((error,role)=>{
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!role) {
                            response.send(utils.createError('role not found'))
                        } else {                                    
                            response.send(utils.createResult(error,role));
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


router.get('/detail/:id', (request, response) => {    
    try {         
        const {id} = request.params;        
        if(id){
            Role.findOne({_id:id},{deleted:0,__v:0,createdOn:0})
            .populate('permissions')
            .exec((error,role)=>{
                if (error) {
                    response.send(utils.createError(error))
                } else if (!role) {
                    response.send(utils.createError('role not found'))
                } else {  

                    if(name) role.name = name;
                    if(permissions) role.permissions = permissions.split(',');                    

                    role.save((error,role)=>{
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!role) {
                            response.send(utils.createError('role not found'))
                        } else {                                    
                            response.send(utils.createResult(error,role));
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
            Role.findOne({_id:id},{deleted:0,__v:0,createdOn:0},(error,role)=>{
                if (error) {
                    response.send(utils.createError(error))
                } else if (!role) {
                    response.send(utils.createError('role not found'))
                } else {  

                    role.deleted = true;                   

                    role.save((error,role)=>{
                        if (error) {
                            response.send(utils.createError(error))
                        } else if (!role) {
                            response.send(utils.createError('role not found'))
                        } else {                                    
                            response.send(utils.createSuccess(role));
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
