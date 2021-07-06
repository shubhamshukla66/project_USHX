const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContractorSchema = new Schema({
    /* Step 1 details */
    device_token: { type: String, required: false, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    allStepsCompleted: { type: String, default: false, trim: true },
    leftAtStep: { type: String, required: false, trim: true },

    firstName: { type: String, required: false, trim: true },
    lastName: { type: String, required: false, trim: true },
    email: { type: String, required: false, trim: true, index: { unique: true } },
    phone: { type: String, required: false, trim: true },
    street_address: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    zip: { type: String, default: '', trim: true },
    governmentId: { type: String, default: '', trim: true },

    /* Step 2 details */
    trades: { type: String, required: false, trim: true },
    yrsExp: { type: String, required: false, trim: true },
    tradeLiscence: { type: String, required: false, trim: true },
    deleted: { type: Boolean, default: false, trim: true }

}, { timestamps: true })


ContractorSchema.methods.stepOne = function () {
    return {
        _id: this._id,
        userId: this.userId,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        phone: this.phone,
        street_address: this.street_address,
        city: this.city,
        state: this.state,
        zip: this.zip,
        governmentId: this.governmentId
    };
}


ContractorSchema.methods.stepTwo = function () {
    return {
        skills: this.skills,
        yrsExp: this.yrsExp,
        tradeLiscence: this.tradeLiscence,
        allStepsCompleted: this.allStepsCompleted,
        leftAtStep: this.leftAtStep
    }
}

let contractorModel = mongoose.model('Contractor', ContractorSchema)
module.exports = contractorModel