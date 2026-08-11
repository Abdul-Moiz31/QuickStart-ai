const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    console.log(process.env.SMPT_SERVICE);

    const transporter = nodemailer.createTransport({
        service: process.env.SMPT_SERVICE || "gmail", // Ensure Gmail is set here
        auth: {
            user: process.env.SMPT_MAIL, // Your Gmail address
            pass: process.env.SMPT_PASSWORD // Your Gmail App Password
        }
    });

    const mailOptions = {
        from: `"Quickstart-AI" <${process.env.SMPT_MAIL}>`, // Use your email for sending
        replyTo: options.from, // This allows replies to go to the user's email
        to: ['sheikhzulkifal05@gmail.com','ahsan1617k@gmail.com','abdulmoiz3140@gmail.com','aqibnawab1100@gmail.com'], // Your email to receive the message
        subject: options.subject,
        html: options.html,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
