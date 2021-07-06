const mongoose = require('mongoose')
const Schema = mongoose.Schema


const BuyerSchema = new Schema({    
    device_token: { type: String, required: false, trim: true},
    userId:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isCoBorrowerProfile:{ type: Boolean, default: false, trim: true},
    allStepsCompleted: {type: String, default: false, required: true, trim: true},
    leftAtStep: {type: String, required: false, trim: true},
    
    firstName: { type: String, required: false, trim: true},    
    lastName: { type: String, required: false, trim: true}, 
    isCoBorrower: { type: Boolean, required: false, trim: true}, 
    coBorrowerProfile:{ type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' },
    
    email: { type: String, required: false, trim: true},
    birthdate: { type: Date, required: false, trim: true },
    street_address: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    zip: { type: String, default: '', trim: true },
    phone: { type: String, required:false, trim: true},
    areaCode: {type: String, required:false, trim: true},
    homePhone: { type: String, required:false, trim: true},
    
    currently_living: { type: String, required:false, trim: true},
    monthlyfee: { type: String, required:false, trim: true},
    leaseEndDate: { type: Date, required: false, trim: true },
    available_savings: { type: String, required:false, trim: true},
    marital_status: { type: String, required:false, trim: true},    
    
    employment_status: { type: String, required:false, trim: true},
    employer: { type: String, required:false, trim: true},
    No_of_years_Employed : { type: String, required:false, trim: true},
    net_income: { type: String, required:false, trim: true},
    FICOScore: { type: String, required:false, trim: true},
    incomeFreq: {type: String, required: false, trim: true},
    former_employer: {type: String, required: false, trim: true},
    
    bills_current: { type: Boolean, required:false, trim: true},
    financial_status: { type: String, required:false, trim: true},
    bankruptcy: { type: String, required: false, trim: true, default: "discharged" },
    dichargeDate: { type: String, required: false, trim: true},
    judgementSettled: { type: Boolean, required: false, trim: true,  default: true },
    foreClosureDate: { type: String, required: false, trim: true},
    studentLoanDate: { type: String, required: false, trim: true},
    rePosDate: { type: String, required: false, trim: true},
    studentLoanAmount: {type: String, required: false, trim: true},

    
    federal_employee: { type: Boolean, required:false, trim: true},    
    federal_department: { type: String, required:false, trim: true}, 
    other_department: { type: String, required:false, trim: true},    
    veteran: { type: Boolean, required:false, trim: true},
    honorably_discharged: { type: Boolean, required:false, trim: true},


    listened_about_us: { type: String, required:false, trim: true},

    /* Step 8 */
    maxMortgagePayment: {type: String, required: false, trim: true},
    zipCodes: {type: String, required: false, trim: true},
    bedrooms: {type: String, required: false, trim: true},
    bathrooms: {type: String, required: false, trim: true},


    /*prequalify*/

    driverLicense:{type: String, required: false, trim: true},
    recentPaycheck:{type: String, required: false, trim: true},
    twoYearW2:[{type: String, required: false, trim: true}],
    twoYearReturn:[{type: String, required: false, trim: true}],
    bankStatement:{type: String, required: false, trim: true},
    /*credit documents*/
    experianCD:{type: String, required: false, trim: true},
    transunionCD:{type: String, required: false, trim: true},
    equifaxCD:{type: String, required: false, trim: true},

    /** Idendity IQ Information */

    iiqUsername:{type: String, required: false, trim: true},
    iiqPassword:{type: String, required: false, trim: true},
    iiqSSN4Digit:{type: String, required: false, trim: true},
    iiqSecurityQuestion:{type: String, required: false, trim: true},
    iiqSecurityAnswer:{type: String, required: false, trim: true}

    },{timestamps:true})

    
    BuyerSchema.methods.prequalify = function () {
        return {
            _id: this._id,
            userId: this.userId,  
            driverLicense: this.driverLicense,
            recentPaycheck: this.recentPaycheck,
            twoYearW2: this.twoYearW2,
            twoYearReturn: this.twoYearReturn,
            bankStatement: this.bankStatement,
            experianCD: this.experianCD,
            transunionCD: this.transunionCD,
            equifaxCD: this.equifaxCD,
            iiqUsername: this.iiqUsername,
            iiqPassword: this.iiqPassword,
            iiqSSN4Digit: this.iiqSSN4Digit,
            iiqSecurityQuestion: this.iiqSecurityQuestion,
            iiqSecurityAnswer: this.iiqSecurityAnswer               
        };
    };

    BuyerSchema.methods.stepOne = function () {
        return {
            _id: this._id,
            userId: this.userId,            
            firstName: this.firstName,     
            lastName: this.lastName,     
            isCoBorrower: this.isCoBorrower,     
        };
    };

    BuyerSchema.methods.stepTwo = function () {
        return {
            _id: this._id,
            userId: this.userId,            
            email: this.email,     
            birthdate: this.birthdate,     
            street_address: this.street_address,     
            city: this.city,
            state: this.state,
            zip: this.zip,
            phone: this.phone,
            areaCode: this.areaCode,
            homePhone: this.homePhone
        };
    };
    
    BuyerSchema.methods.stepThree = function () {
        return {
            _id: this._id,
            userId: this.userId,            
            currently_living: this.currently_living,     
            monthlyfee: this.monthlyfee,     
            available_savings: this.available_savings,
            leaseEndDate: this.leaseEndDate,     
            marital_status: this.marital_status,            
        };
    };

    BuyerSchema.methods.stepFour = function () {
        return {
            _id: this._id,
            userId: this.userId,            
            employment_status: this.employment_status,     
            employer: this.employer,     
            No_of_years_Employed: this.No_of_years_Employed,     
            net_income: this.net_income,
            former_employer: this.former_employer,
            FICOScore: this.FICOScore,
            rePosDate: this.rePosDate,
            incomeFreq: this.incomeFreq
        };
    };

    BuyerSchema.methods.stepFive = function () {
        return {
            _id: this._id,
            userId: this.userId,            
            bills_current: this.bills_current,     
            financial_status: this.financial_status,
            rePosDate: this.rePosDate,
            bankruptcy: this.bankruptcy,
            judgementSettled: this.judgementSettled,
            dichargeDate: this.dichargeDate,
            foreClosureDate: this.foreClosureDate,
            studentLoanDate:this.studentLoanDate,
            studentLoanAmount:this.studentLoanAmount
        };
    };

    BuyerSchema.methods.stepSix = function () {
        return {
            _id: this._id,
            userId: this.userId,            
            federal_employee: this.federal_employee,     
            federal_department: this.federal_department,
            other_department: this.other_department,
            veteran: this.veteran,
            honorably_discharged: this.honorably_discharged
        };
    };
    
    BuyerSchema.methods.stepSeven = function () {
        return {
            _id: this._id,
            userId: this.userId,            
            listened_about_us: this.listened_about_us
        };
    };


    BuyerSchema.methods.stepEight = function () {
        return {

           maxMortgagePayment: this.maxMortgagePayment,
            zipCodes: this.zipCodes,
            bedrooms: this.bedrooms,
            bathrooms: this.bathrooms,
            allStepsCompleted: this.allStepsCompleted,
            leftAtStep: this.leftAtStep
        };
    };
    
    
let buyerModel = mongoose.model('Buyer', BuyerSchema)
module.exports = buyerModel
