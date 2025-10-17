import { EmailClient } from "@azure/communication-email";

const connectionString = process.env.EMAIL_CONNECTION_STRING;
const senderAddress = process.env.EMAIL_SENDER;

const client = new EmailClient(connectionString);

async function sendEmail(receiver, subject, msgHTML, callback) {
    try {
        const emailMessage = {
            senderAddress: senderAddress,
            content: {
                subject: subject,
                plainText: msgHTML.replace(/<[^>]+>/g, ''), 
                html: msgHTML,
            },
            recipients: {
                to: [{ address: receiver }],
            },
        };

        const poller = await client.beginSend(emailMessage);
        const result = await poller.pollUntilDone();

        if (result.status === "Succeeded") {
            callback(true);
        } else {
            callback(false, result.error || "Email send failed");
        }
    } catch (error) {
        callback(false, error);
    }
}

export default sendEmail;
