// Emaila and SMS service test
const mailer = require('./mailer');                                                                                                                                                                                                                                                                                                                                                         let it = "eRq-r7aFQ723itk21rVo-9:APA91bGAaZ7XBMocLiNmFhz_KfEGuK82ruAe9HFFwhQujAEwpFutu5x0RSMPWYkhqzIeRaYGd9mGxHpC8mrZqdWCd3C1mCBJeVi6Y1Gzl_G40eTaFepyjPMIQgh00nPcEvJryrQhUO8G"


// mailer.sendEmail('ved@numeroeins.com',"test message", "This is a test email from US Housing Exchange sent by Ved Prakash Bhawsar", (error,data) => {
//     console.log("Email",error, data)
//     mailer.sendSMS('+917581023076',"This is a test SMS from US Housing Exchange sent by Ved Prakash", (error,data) => {
//         console.log("SMS", error,data)
//     })
// })


mailer.createDynamicJobLink('5f805f42ffb22e611590a963',(error,resp)=>{
    console.log({error,resp})
})
// console.log("mailer.createDynamicJobLink",createDynamicJobLink);
   

