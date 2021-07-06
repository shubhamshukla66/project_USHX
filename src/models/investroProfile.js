const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvestorSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    allStepsCompleted: { type: String, default: true, required: true, trim: true },

    investorType: { type: String, default: '', trim: true },
    flippedProperty: { type: String, default: '', trim: true },
    flipsCompleted: { type: String, default: '', trim: true },
    lastDateFlipped: { type: String, default: '', trim: true },
    avgFlipPrice: { type: String, default: '', trim: true },
    avgConstructionCost: { type: String, default: '', trim: true },
    ownCrew: { type: String, default: '', trim: true },
    usingContractor: { type: String, default: '', trim: true },
    moneyToFlip: { type: String, default: '', trim: true },
    rateYourCredit: { type: String, default: '', trim: true },
    moneyToInvest: { type: String, default: '', trim: true },
    grossIncome: { type: String, default: '', trim: true },

    firstName: { type: String, required: false, trim: true },
    email: { type: String, required: false, trim: true, index: { unique: true } },
    phone: { type: String, required: false, trim: true },
    address: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    zipcode: { type: String, default: '', trim: true },
    dealMoney: { type: String, default: '', trim: true },
    moneyAllocatedTime: { type: String, default: '', trim: true },
    dealType: { type: String, default: '', trim: true },



}, { timestamps: true })

let investorModel = mongoose.model('Investor', InvestorSchema)
module.exports = investorModel