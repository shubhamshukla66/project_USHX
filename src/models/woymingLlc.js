const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WoymingLlcSchema = new Schema({
    llcName: { type: String, required: false, trim: true },
    alternateName: { type: String, required: false, trim: true },
    fullName: { type: String, required: false, trim: true },
    birthdate: { type: String, required: false, trim: true },
    phone: { type: String, required: false, trim: true },
    address: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    zipcode: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    origin: { type: String, default: 'USHX', required: false, trim: true },
}, { timestamps: true })

let investorModel = mongoose.model('woymingllc', WoymingLlcSchema)
module.exports = investorModel