const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API)

module.exports = resend;



