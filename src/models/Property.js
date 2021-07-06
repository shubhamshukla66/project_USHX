const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const PropertySchema = new Schema({

    /* Seller */
    seller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    /* Title and Description */
    title: { type: String, required: false, trim: true },
    description: { type: String, required: false, trim: true },
    property_approved_status: { type: String, required: false, trim: true, default: 'pending' },

    /* Location */
    address: { type: String, required: false, trim: true },
    country: { type: String, required: false, trim: true },
    state: { type: String, required: false, trim: true },
    city: { type: String, required: false, trim: true },
    neighbourhood: { type: String, required: false, trim: true },
    zip: { type: String, required: false, trim: true },
    latitude: { type: String, required: false, trim: true },
    longitude: { type: String, required: false, trim: true },

    /* Property Type */
    property_type: { type: String, required: false, default: 'single_family', trim: true },
    property_status: { type: String, required: false, trim: true }, // Available or not aavailable
    rehab_needed: { type: String, required: false, trim: true }, //renovation neeeded or not


    /* Price */
    sales_price: { type: String, required: false, trim: true },
    rehab_price_est: { type: String, required: false, trim: true },
    after_rehab_value: { type: String, default: function () { return +this.sales_price + (+this.rehab_price_est) }, trim: true },
    rehab_work_details: { type: String, required: false, trim: true },

    /* calculated fields for monthly_payment */

    loan_term_years: { type: Number, default: 30, trim: true },
    down_payment: { type: Number, default: 3.5, trim: true },
    total_loan_amount: { type: Number, default: 0, trim: true },
    basic_monthly_payment: { type: Number, default: 0, trim: true },
    monthly_payment: { type: Number, default: 0, trim: true },
    monthly_payment_wo_pmi: { type: Number, default: 0, trim: true },
    yearly_payment: { type: Number, default: 0, trim: true },
    interest_rate: { type: Number, default: 6.0, trim: true },
    yearly_taxes: { type: Number, default: 2400, trim: true },
    monthly_taxes: { type: Number, default: 0, trim: true },
    pmi_amount_yearly: { type: Number, default: 0, trim: true },
    monthly_pmi: { type: Number, default: 0, trim: true },
    total_interest: { type: Number, default: 0, trim: true },
    total_payment: { type: Number, default: 0, trim: true },

    /** Investor fields */
    investor_flip_amount: { type: Number, default: 0, trim: true },
    investor_profit: { type: Number, default: 0, trim: true },

    /* features */
    features: { type: String, required: false, trim: true },


    /* Details */
    property_size: { type: String, required: false, trim: true },
    land_area: { type: String, required: false, trim: true },
    rooms: { type: String, required: false, trim: true },
    bedrooms: { type: String, required: false, trim: true },
    bathrooms: { type: String, required: false, trim: true },
    garage: { type: String, required: false, trim: true },
    garage_size: { type: String, required: false, trim: true },
    year_built: { type: String, required: false, trim: true },
    property_id: { type: String, required: false, trim: true },
    additional_title: { type: String, required: false, trim: true },
    additional_value: { type: String, required: false, trim: true },


    /* Media */
    photo_gallery: [{ type: String, required: false, trim: true }],
    file_attachments: [{ type: String, required: false, trim: true }],
    video_url: { type: String, required: false, trim: true },


    /* Contact */
    other_contact_name: { type: String, required: false, trim: true },
    other_contact_email: { type: String, required: false, trim: true },
    other_contact_phone: { type: String, required: false, trim: true },
    other_contact_info: { type: String, required: false, trim: true },

    /*  Private note  */
    private_note: { type: String, required: false, trim: true },
    deleted: { type: Boolean, default: false, trim: true },
    expireOn: { type: Number, default: new Date(new Date().setMonth(new Date().getMonth() + 1)).getTime(), trim: true },
    isExpired: { type: Boolean, default: false, trim: true },

    projectCreated: { type: Boolean, default: false, trim: true },

}, { timestamps: true })
    .plugin(function (schema, options) {
        schema.pre('save', function (next) {
            this.isExpired = this.expireOn <= Date.now()
            // let r =  this.interest_rate/100/12;
            // let N = this.loan_term_years*12;
            // let P = (this.after_rehab_value*(100-this.down_payment))/100
            // this.total_loan_amount = P;
            // this.pmi_amount_yearly = P/100;
            // let monthly_pmi = this.pmi_amount_yearly/12
            // let monthly_taxes = this.yearly_taxes/12

            // let c = c = Number(((r*P)/(1-(Math.pow((1+r),(-N))))).toFixed(2))

            // let actual_c = c+monthly_pmi+monthly_taxes;
            // this.monthly_payment = actual_c;

            if (!this.property_id) {
                propertyModel.countDocuments().then(res => {
                    let rand = Math.floor(Math.random() * 9);
                    this.property_id = `P${211110 + rand + res * 10}`; // Increment count
                    next();
                });
            } else {
                next();
            }
            next();
        })
    });;


PropertySchema.pre('validate', async function (next) {

    if (!this.property_id) {
        propertyModel.countDocuments().then(res => {
            let rand = Math.floor(Math.random() * 9);
            this.property_id = `P${211110 + rand + res * 10}`; // Increment count
            next();
        });
    } else {
        next();
    }
});

let propertyModel = mongoose.model('Property', PropertySchema)
module.exports = propertyModel