const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SellerSchema = new Schema({
    /* Step 1 details */
    device_token: { type: String, required: false, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    allStepsCompleted: { type: String, default: false, required: true, trim: true },
    leftAtStep: { type: String, required: false, trim: true },

    firstName: { type: String, required: false, trim: true },
    lastName: { type: String, required: false, trim: true },
    email: { type: String, required: false, trim: true, index: { unique: true } },
    areaCode: { type: String, default: '', trim: true },
    phone: { type: String, required: false, trim: true },
    street_address: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    zip: { type: String, default: '', trim: true },

    /* Step 2 details */
    isForeclose: { type: Boolean, default: false, required: false },
    mortgagePayments: { type: String, default: 'Less than 12 Months', required: false, trim: true },
    mortgageProperty: { type: String, default: '1st Mortgage Only', required: false, trim: true },

    /* Step 3 */
    askingPrice: { type: String, default: '', required: false, trim: true },
    knowPropertyVal: { type: Boolean, default: true, required: false },
    propertyValue: { type: String, default: '', required: false, trim: true },
    propertyAppraisal: { type: Boolean, default: false, required: false },
    appraisalFile: { type: String },
    propertyDetails: { type: String, default: '', required: false, trim: true },

    /* Step 4 */
    shortTrmRntl: { type: Boolean, default: true, required: false },
    judgements: { type: Boolean, default: true, required: false },
    comments: { type: String, default: '', required: false, trim: true },

    /* Step 5 */
    listened_about_us: { type: String, required: false, trim: true },
    deleted: { type: Boolean, default: false, trim: true }

}, { timestamps: true })


SellerSchema.methods.stepOne = function () {
    return {
        _id: this._id,
        userId: this.userId,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        areaCode: this.areaCode,
        phone: this.phone,
        street_address: this.street_address,
        city: this.city,
        state: this.state,
        zip: this.zip,
    };
}


SellerSchema.methods.stepTwo = function () {
    return {
        isForeclose: this.isForeclose,
        mortgagePayments: this.mortgagePayments,
        mortgageProperty: this.mortgageProperty
    }
}

SellerSchema.methods.stepThree = function () {
    return {
        askingPrice: this.askingPrice,
        knowPropertyVal: this.knowPropertyVal,
        propertyValue: this.propertyValue,
        propertyAppraisal: this.propertyAppraisal,
        appraisalFile: this.appraisalFile,
        propertyDetails: this.propertyDetails,
    }
}


SellerSchema.methods.stepFour = function () {
    return {
        shortTrmRntl: this.shortTrmRntl,
        judgements: this.judgements,
        comments: this.comments,
        allStepsCompleted: this.allStepsCompleted,
        leftAtStep: this.leftAtStep
    }
}

let sellerModel = mongoose.model('Seller', SellerSchema)
module.exports = sellerModel