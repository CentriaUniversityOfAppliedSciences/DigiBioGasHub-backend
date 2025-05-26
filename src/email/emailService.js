import { createTransport } from 'nodemailer';
function sendEmail(receiver, subject, msgHTML, callback)
{
    // Create the transporter with the required configuration for Outlook
    // change the user and pass !
    var transporter = createTransport({
        host: "smtp-mail.outlook.com", // hostname
        secureConnection: false, // TLS requires secureConnection to be false
        port: 587, // port for secure SMTP
        tls: {
           ciphers:'SSLv3'
        },
        auth: {
            user: process.env.EMAIL_SENDER, // sender address (who sends)
            pass: process.env.EMAIL_PASS
        }
    });
    // setup e-mail data, even with unicode symbols
    var mailOptions = {
        from: process.env.EMAIL_SENDER, // sender address (who sends)
        to: receiver, // list of receivers (who receives)
        subject: subject, // Subject line
        text: '', // plaintext body
        html: msgHTML // html body
    };
    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            callback(false, error);
        } else {
            callback(true);
        }
    });
}

export default sendEmail;
