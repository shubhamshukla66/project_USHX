const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const PropertyVisitSchema = new Schema({
    date:{ type: String, required: false, trim: true},
    time:{ type: String, required: false, trim: true},        
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },    
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    status:{ type: String, default: "pending", trim: true},    
    deleted: {type: Boolean,  default: false, trim: true},
    isRescheduled: {type: Boolean,  default: false, trim: true},
    isPropertyNotAvailable: {type: Boolean,  default: false, trim: true},
    isConfirmed: {type: Boolean,  default: false, trim: true},
    isBuyerConfirmed:{type: Boolean,  default: true, trim: true},
    isSellerConfirmed:{type: Boolean,  default: false, trim: true},
    timelog: {type: Number, required: true, default: new Date().getTime()},

},{timestamps:true})
.plugin(function(schema, options) {
    schema.pre('save', function(next) {
        this.isConfirmed = this.isBuyerConfirmed && this.isSellerConfirmed     
        if(this.isConfirmed) this.status = "accepted"
        // else if(this.isBuyerConfirmed || this.isSellerConfirmed) this.status = "pending"
        // else this.status = "rejected"
        next();
    })
  });

module.exports = mongoose.model('PropertyVisit', PropertyVisitSchema);