const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const RoleSchema = new Schema({
    name: { type: String, required: true, trim: true },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
    deleted: { type: Boolean, default: false, trim: true }
}, { timestamps: true })

module.exports = mongoose.model('Role', RoleSchema);