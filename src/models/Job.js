const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const JobSchema = new Schema({    
    title: { type: String, required: true, trim: true},
    description: { type: String, required: false, trim: true},
    trade: { type: String, required: false, trim: true},
    estCost: { type: Number, required: false, trim: true},
    tasks: [{type: mongoose.Schema.Types.ObjectId, ref: 'Task'}],
    comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}],    
    contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    declined: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    applied: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    phase: { type: mongoose.Schema.Types.ObjectId, ref: 'Phase' },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },

    isWorker:{type: Boolean, default: false, trim: true},
    worker: {         
        name:{type: String, required: false, trim: true},
        phone:{type: String, required: false, trim: true},
    },
    shortUrl: {type: String, default: '', trim: true},

    beforeImage: [{ type: String, required: true, trim: true}],
    duringImage: [{ type: String, required: true, trim: true}],
    afterImage: [{ type: String, required: true, trim: true}],    

    punctuality : { type: Number, required: false, default:0, trim: true},    
    communication : { type: Number, required: false, default:0, trim: true},    
    workQuality : { type: Number, required: false, default:0, trim: true},    
    finishedJobonSchedule : { type: Number, required: false, default:0, trim: true},    
    professionalism : { type: Number, required: false, default:0, trim: true},    

    averageRating : { type: Number, required: false, default:0, trim: true},
     
    contractorComplete: { type: Boolean, default: false, trim: true },
    managerComplete: { type: Boolean, default: false, trim: true },
    status: {type:String, default:"new", trim:true},
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isCheckedIn: { type: Boolean, default: false, trim: true },
    checkinId: { type: mongoose.Schema.Types.ObjectId, require:false, ref: 'CheckinLog' },
    deleted: { type: Boolean, default: false, trim: true }        
},{timestamps:true})
.plugin(function(schema, options) {
    schema.pre('save', function(next) {
        this.applied = [...new Set(this.applied)]
        this.declined = [...new Set(this.declined)]
        this.averageRating = ((this.punctuality + this.workQuality + this.communication + this.finishedJobonSchedule + this.professionalism)/5);

        next();
    })
  });

  get3days = ()=>{

  }

  
  JobSchema.virtual('isOver3Days').get(function() {
      let td = new Date()
      let pd = td.setDate(td.getDate()-3)
    return new Date(this.createdAt).getTime()<pd;
  });;

  JobSchema.set('toObject', {getters: true, setters: true, virtuals: true });
  JobSchema.set('toJSON', { getters: true, setters: true, virtuals: true });

module.exports = mongoose.model('Job', JobSchema);