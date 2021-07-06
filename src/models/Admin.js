const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AdminSchema = new Schema({    
    device_token: { type: String, required: false, trim: true},
    firstName: { type: String, required: false, trim: true},
    lastName: { type: String, required: false, trim: true },
    fullName: { type: String, required: false, trim: true},    
    phone: { type: String, required:false, trim: true},
    isdCode: { type: String, required:false, trim: true},
    email: { type: String, required: true, trim: true, index: {unique: true} },
    password: { type: String, required: true, trim: true },                  
    birthdate: { type: Date, required: false, trim: true },
    gender: { type: String, default: 'male', trim: true },
    role: { type: String, default: 'admin', trim: true  },  
    image: { type: String, default: 'user.png', trim: true  },  
    
    deleted: { type: Boolean, default: false, trim: true },
},{timestamps:true})
.plugin(function(schema, options) {
    schema.pre('save', function(next) {
        this.fullName = (this.firstName +" "+ this.lastName);

        next();
    })
})

function getfullName(){
    // console.log({"getfullName":this})
    return (this.firstName +" "+ this.lastName)
}


AdminSchema.set('toObject', {getters: true, setters: true, virtuals: true });
AdminSchema.set('toJSON', { getters: true, setters: true, virtuals: true });

module.exports = mongoose.model('Admin', AdminSchema);