const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { genUuid } = require('../../utils');

const UserSchema = new Schema({
    device_token: { type: String, required: false, trim: true },
    fullName: { type: String, required: false, trim: true },
    origin: { type: String, default: 'USHX', required: false, trim: true },
    phone: { type: String, required: false, trim: true },
    isdCode: { type: String, required: false, trim: true },
    email: { type: String, required: true, trim: true, index: { unique: true } },
    password: { type: String, required: false, trim: true },
    birthdate: { type: Date, required: false, trim: true },
    role: { type: String, default: 'user', trim: true },
    image: { type: String, default: 'user.png', trim: true }, /* affiliate, contractor, seller, buyer */
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },

    consent: { type: String, required: false, trim: true },

    access_token: { type: String, required: false, trim: true },
    referalCode: { type: String, required: false, trim: true },
    referredBy: { type: String, required: false, trim: true },
    isCoBorrower: { type: Boolean, default: false, trim: true },

    borrowerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' },
    coBorrowerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' },
    sellerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
    contractorProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor' },

    about_me: { type: String, required: false, trim: true },

    location: {
        type: { type: String, default: "Point" },
        coordinates: [{ type: Number }]
    },

    gender: { type: String, default: 'male', trim: true },


    emailVerified: { type: Boolean, default: false, trim: true },
    phoneVerified: { type: Boolean, default: false, trim: true },

    favoriteProperty: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
    rehabPackage: { type: mongoose.Schema.Types.ObjectId, ref: 'RehabPackage' },

    provider: { type: String, default: "WEB", trim: true },

    // a key for encrypt and generate public key
    secret_key: { type: String, trim: true },
    otp: { type: String, default: "", trim: true },
    otpVerified: { type: Boolean, default: false, trim: true },
    status: { type: String, default: 'pending', trim: true },
    deleted: { type: Boolean, default: false, trim: true },
    last_seen: { type: Number, required: true, default: new Date().getTime() },
    createdOn: { type: Date, default: new Date(), trim: true },
    isProfileComplete: { type: Boolean, default: false, trim: true },

    isPrequalifyDone: { type: Boolean, default: false, trim: true },
    // referredByUser: {
    //     type: Object,
    //     ref: 'User',
    //     localField: 'referredBy',
    //     foreignField: 'referalCode',
    //     justOne: true // for many-to-1 relationships
    //   },
    /* For application */
    approved: { type: Boolean, default: false, trim: true, required: false },
    max_mortgage: { type: Number, trim: true, required: false },
    reject_reason: { type: String, required: false, trim: true },
    allStepsCompleted: { type: Boolean, required: false, trim: true },
    leftAtStep: { type: Number, default: 0, trim: true },
    reject_reason: { type: String, required: false, trim: true },
    affiliate_type: { type: String, required: false, trim: true },

    projectCreated: { type: Boolean, default: false, trim: true },


}, { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } })

//
// Return a safe user JSON
//

UserSchema.methods.safeUser = function () {
    return {
        _id: this._id,
        fullName: this.fullName,
        phone: this.phone,
        isdCode: this.isdCode,
        phoneVerified: this.phoneVerified,
        email: this.email,
        emailVerified: this.emailVerified,
        role: this.role,
        image: this.image,
        referredBy: this.referredBy,
        referalCode: this.referalCode,
        rehabPackage: this.rehabPackage,
        borrowerProfile: this.borrowerProfile,
        coBorrowerProfile: this.coBorrowerProfile,
        sellerProfile: this.sellerProfile,
        contractorProfile: this.contractorProfile,
        isProfileComplete: this.isProfileComplete,
        allStepsCompleted: this.allStepsCompleted,
        leftAtStep: this.leftAtStep,
        isPrequalifyDone: this.isPrequalifyDone,
        approved: this.approved,
        status: this.status,
        max_mortgage: this.max_mortgage,
        reject_reason: this.reject_reason,
        access_token: this.access_token,
        referredByUser: this.referredByUser,
        updatedAt: this.updatedAt,
        createdAt: this.createdAt,
        projectCreated: this.projectCreated
    };
};



UserSchema.pre('validate', async function (next) {
    console.log("pre", this)
    // Only increment when the document is new
    //create secret key , u can access this function in Utils.js
    this.secret_key = await genUuid();
    // use the secret key for encrypt the custom token and generate public key , u can access this function in Utils.js

    this.last_seen = new Date().getTime();

    next();
    // if (!this.email) {
    //     userModel.countDocuments().then(res => {
    //         let rand = Math.floor(Math.random() * 9);
    //         this.referalCode = `RF${211110+rand+res*10}`; // Increment count
    //         next();
    //     });
    // } else {
    //     next();
    // }
});


UserSchema.virtual('referredByUser', {
    ref: 'User',
    localField: 'referredBy',
    foreignField: 'referalCode',
    justOne: true // for many-to-1 relationships
});


// UserSchema.post('find', async function(docs) {
//     for (let doc of docs) {
//         console.log("doc.referredBy",doc.referredBy)
//         if (doc.referredBy) {
//             await doc.populate('referredByUser').execPopulate();
//         }
//     }
//   });

UserSchema.pre('find', function () {
    this.populate({ path: 'referredByUser', select: 'fullName phone isdCode email role image referredBy referalCode' });
});


UserSchema.set('toObject', { getters: true, setters: true, virtuals: true });
UserSchema.set('toJSON', { getters: true, setters: true, virtuals: true });

let userModel = mongoose.model('User', UserSchema)
module.exports = userModel
