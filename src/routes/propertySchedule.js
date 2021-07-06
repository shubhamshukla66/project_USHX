const express = require('express')
const router = express.Router()
const path = require('path')
const PropertyVisit = require('../models/PropertyVisit')
const Property = require('../models/Property')
const utils = require('../../utils')

router.get('/list/buyer',async (request,response,next)=>{    
    let conditions = [{buyer:request.userId},{deleted:false}]
    
    PropertyVisit.find({$and:conditions})
    .populate({path:'seller buyer',select:'fullName email role image'})
    .populate({path:'property',select:'title state city address zip'})
    .sort({createdAt:-1})
    .exec(async (error,schedules)=>{
        console.log(error,schedules && schedules.length);
        if(error){
            return response.send(utils.createError(error))
        }else if(!schedules || schedules.length===0){
            return response.send(utils.createError("No schedule found !"))
        }else{
            response.send(utils.createSuccess(schedules))
        }
    })
})

router.get('/list/seller',async (request,response,next)=>{    
    let conditions = [{seller:request.userId},{deleted:false}]
        
    PropertyVisit.find({$and:conditions})
    .populate({path:'buyer seller',select:'fullName email role image'})
    .populate({path:'property',select:'title state city address zip'})
    .sort({createdAt:-1})
    .exec(async (error,schedules)=>{
        console.log(error,schedules && schedules.length);
        if(error){
            return response.send(utils.createError(error))
        }else if(!schedules || schedules.length===0){
            return response.send(utils.createError("No schedule found !"))
        }else{
            response.send(utils.createSuccess(schedules))
        }
    })
})

router.get('/property/list/:propertyId',async (request,response,next)=>{    
    const {propertyId} = request.params;
    let conditions = [{property:propertyId},{seller:request.userId},{deleted:false}];
        
    PropertyVisit.find({$and:conditions})
    .populate({path:'buyer',select:'fullName email role image'})
    .populate({path:'property',select:'title state city address zip'})
    .sort({createdAt:-1})
    .exec(async (error,schedules)=>{
        console.log(error,schedules && schedules.length);
        if(error){
            return response.send(utils.createError(error))
        }else if(!schedules || schedules.length===0){
            return response.send(utils.createError("No schedule found !"))
        }else{
            response.send(utils.createSuccess(schedules))
        }
    })
})

router.get('/detail/:visitId',async (request,response)=>{
    const {visitId} = request.params;    
    
    PropertyVisit.findById(visitId)
    .populate({path:'seller buyer',select:'fullName email role image'})
    .populate({path:'property',select:'title state city address zip'})
    .exec(async (error,visit)=>{
        console.log(error,visit);

        if(error){
            response.send(utils.createError(error));
        }else if(!visit){
            response.send(utils.createError('No schedule found'));
        }else{            
            response.send(utils.createSuccess(visit));            
        }
    })
    
})

router.post('/buyer/add',async (request,response)=>{
    const {date,time,property} = request.body;
    let errors = {}
    if(!property){
        errors['property'] = 'Property required to schedule a visit'
    }
    if(!date){
        errors['date'] = 'Date required to schedule a visit'
    }
    else{
        if(new Date(date)=='Invalid Date')
            errors['date'] = 'Date should be in YYYY-MM-DD format'
        else if(new Date(date).getTime()<Date.now()){
            errors['date'] = 'Can not schedule in past date'
        }
    }
    if(!time){
        errors['time'] = 'Time required to schedule a visit'
    }
    else{
        let regex = new RegExp(/((1[0-2]|0?[1-9]):([0-5][0-9]) ?([AaPp][Mm]))/);
        if(!regex.test(time))
            errors['time'] = 'Time should be in HH:MM AM/PM format'        
    }
    console.log({errors})
    if(errors['property'] || errors['date'] || errors['time']){
        return response.send(utils.createError(Object.values(errors).join(", ")));
    }

    Property.findById(property).exec(async (error,result)=>{
        console.log(error,result);

        if(error){
            response.send(utils.createError(error));
        }else if(!result){
            response.send(utils.createError('Property not found'));
        }else if(result.deleted || result.isExpired){
            response.send(utils.createError('Property not available'));
        }else if(request.userId == result.seller_id){
            response.send(utils.createError('This is your property!'));
        }else{
            try{
                let visit = new PropertyVisit({date,time,property,buyer:request.userId,seller:result.seller_id});

                visit = await visit.save();
                response.send(utils.createSuccess(visit));
            }catch(ex){
                console.log("Exception",ex)
                response.send(utils.createError('Something went wrong!'));
            }
        }
    })
    
})

router.post('/seller/reschedule/:visitId',async (request,response)=>{
    const {visitId} = request.params;
    const {date,time,notAvailable} = request.body;
    let errors = {}
    
    if(!notAvailable && !date){
        errors['date'] = 'Date required to schedule a visit'
    }
    else{
        if(new Date(date)==='Invalid Date')
            errors['date'] = 'Date should be in YYYY-MM-DD format'
        else if(new Date(date).getTime()<Date.now()){
            errors['date'] = 'Can not schedule in past date'
        }
    }
    if(!time){
        errors['time'] = 'Time required to schedule a visit'
    }
    else{
        let regex = new RegExp(/((1[0-2]|0?[1-9]):([0-5][0-9]) ?([AaPp][Mm]))/);
        if(!regex.test(time))
            errors['time'] = 'Time should be in HH:MM AM/PM format'        
    }
    if(errors['property'] || errors['date']){
        return response.send(utils.createError(errors));
    }

    PropertyVisit.findById(visitId).exec(async (error,visit)=>{
        console.log(error,visit);

        if(error){
            response.send(utils.createError(error));
        }else if(!visit){
            response.send(utils.createError('No schedule found'));
        }else if(visit.status === "accepted"){
            response.send(utils.createError('Visit is already confirmed'));
        }else if(visit.status === "rejected"){
            response.send(utils.createError('Visit is already rejected'));
        }else{
            try{
                //let visit = new PropertyVisit({date,time,property,buyer:request.userId,seller:property.seller_id});
                if(notAvailable) visit.isPropertyNotAvailable = notAvailable
                else{
                    visit.date = date
                    visit.time = time;
                    visit.isRescheduled = true;   
                    visit.isBuyerConfirmed = false;
                    visit.isSellerConfirmed = true;
                }
                visit = await visit.save();
                response.send(utils.createSuccess(visit));
            }catch(ex){
                console.log("Exception",ex)
                response.send(utils.createError('Something went wrong!'));
            }
        }
    })
    
})

router.post('/buyer/reschedule/:visitId',async (request,response)=>{
    const {visitId} = request.params;
    const {date,time} = request.body;
    let errors = {}
    
    if(!date){
        errors['date'] = 'Date required to schedule a visit'
    }
    else{
        if(new Date(date)==='Invalid Date')
            errors['date'] = 'Date should be in YYYY-MM-DD format'
        else if(new Date(date).getTime()<Date.now()){
            errors['date'] = 'Can not schedule in past date'
        }
    }
    if(!time){
        errors['time'] = 'Time required to schedule a visit'
    }
    else{
        let regex = new RegExp(/((1[0-2]|0?[1-9]):([0-5][0-9]) ?([AaPp][Mm]))/);
        if(!regex.test(time))
            errors['time'] = 'Time should be in HH:MM AM/PM format'        
    }
    if(errors['property'] || errors['date']){
        return response.send(utils.createError(errors));
    }

    PropertyVisit.findById(visitId).exec(async (error,visit)=>{
        console.log(error,visit);

        if(error){
            response.send(utils.createError(error));
        }else if(!visit){
            response.send(utils.createError('No schedule found'));
        }else{
            try{
                //let visit = new PropertyVisit({date,time,property,buyer:request.userId,seller:property.seller_id});
                
                visit.date = date
                visit.time = time;
                visit.isRescheduled = true;   
                visit.isBuyerConfirmed = true;
                visit.isSellerConfirmed = false;
                
                visit = await visit.save();
                response.send(utils.createSuccess(visit));
            }catch(ex){
                console.log("Exception",ex)
                response.send(utils.createError('Something went wrong!'));
            }
        }
    })
    
})

router.post('/seller/accept/:visitId',async (request,response)=>{
    const {visitId} = request.params;
    
    let errors = {}
    
    PropertyVisit.findById(visitId).exec(async (error,visit)=>{
        console.log(error,visit);

        if(error){
            response.send(utils.createError(error));
        }else if(!visit){
            response.send(utils.createError('No schedule found'));
        }else if(!visit.isBuyerConfirmed){
            response.send(utils.createError('You can not accept this visit'));
        }else{
            try{                
                visit.isSellerConfirmed = true;
                visit.isBuyerConfirmed = true;
                visit.isRescheduled = false;
                visit.status = 'accepted'
                visit = await visit.save();
                response.send(utils.createSuccess(visit));
            }catch(ex){
                console.log("Exception",ex)
                response.send(utils.createError('Something went wrong!'));
            }
        }
    })
    
})

router.post('/buyer/accept/:visitId',async (request,response)=>{
    const {visitId} = request.params;
    
    let errors = {}
    
    PropertyVisit.findById(visitId).exec(async (error,visit)=>{
        console.log(error,visit);

        if(error){
            response.send(utils.createError(error));
        }else if(!visit){
            response.send(utils.createError('No schedule found'));
        }else if(!visit.isSellerConfirmed){
            response.send(utils.createError('You can not accept this visit'));
        }else{
            try{                
                visit.isBuyerConfirmed = true;
                visit.isSellerConfirmed = true;
                visit.isRescheduled = false;
                visit.status = 'accepted'
                visit = await visit.save();
                response.send(utils.createSuccess(visit));
            }catch(ex){
                console.log("Exception",ex)
                response.send(utils.createError('Something went wrong!'));
            }
        }
    })
    
})

router.post('/seller/reject/:visitId',async (request,response)=>{
    const {visitId} = request.params;
    
    let errors = {}
    
    PropertyVisit.findById(visitId).exec(async (error,visit)=>{
        console.log(error,visit);

        if(error){
            response.send(utils.createError(error));
        }else if(!visit){
            response.send(utils.createError('No schedule found'));
        }else if(!visit.isBuyerConfirmed){
            response.send(utils.createError('You can not reject this visit'));
        }else{
            try{                
                visit.isSellerConfirmed = false;
                visit.isRescheduled = false;
                visit.status = 'rejected'
                visit = await visit.save();
                response.send(utils.createSuccess(visit));
            }catch(ex){
                console.log("Exception",ex)
                response.send(utils.createError('Something went wrong!'));
            }
        }
    })
    
})

router.post('/buyer/reject/:visitId',async (request,response)=>{
    const {visitId} = request.params;
    
    let errors = {}
    
    PropertyVisit.findById(visitId).exec(async (error,visit)=>{
        console.log(error,visit);

        if(error){
            response.send(utils.createError(error));
        }else if(!visit){
            response.send(utils.createError('No schedule found'));
        }else if(!visit.isSellerConfirmed){
            response.send(utils.createError('You can not reject this visit'));
        }else{
            try{                
                visit.isBuyerConfirmed = false;
                visit.isRescheduled = false;
                visit.status = 'rejected'
                visit = await visit.save();
                response.send(utils.createSuccess(visit));
            }catch(ex){
                console.log("Exception",ex)
                response.send(utils.createError('Something went wrong!'));
            }
        }
    })
    
})


module.exports = router;