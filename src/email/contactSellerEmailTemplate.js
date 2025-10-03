import i18n from "../i18n/config.js";
import { User } from "../models/index.js";

export default async function contactSellerEmailTemplate({ companyName, contact, message, offerId, userId }) {

    const user = await User.findOne({
        where: { id: userId },
        attributes: ['language'],
    });

    const userLanguage = user.language || 'en';
    i18n.setLocale(userLanguage);

    const styles = {
        body: `
      font-family: Arial, sans-serif;
      background: #f9f9f9;
      padding: 32px;
    `,
        container: `
      max-width: 600px;
      margin: auto;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      padding: 24px;
    `,
        title: `
      color: #2a7ae2;
    `,
        messageBox: `
      margin: 16px 0;
      padding: 16px;
      background: #f1f7ff;
      border-left: 4px solid #2a7ae2;
    `,
        footer: `
      color: #888;
      font-size: 13px;
    `
    };

    const subject = i18n.__('contactSeller.subject', { offerId });

    const contactSellerHTMLTemplate = `
    <div style="${styles.body}">
      <div style="${styles.container}">
        <h2 style="${styles.title}">${i18n.__('contactSeller.title')}</h2>
        <p>${i18n.__('contactSeller.greeting', { companyName })}</p>
        <p>${i18n.__('contactSeller.receivedMessage', { offerId })}</p>
        <div style="${styles.messageBox}">
          <p><b>${i18n.__('contactSeller.contactInfo')}:</b> ${contact}</p>
          <p><b>${i18n.__('contactSeller.messageLabel')}:</b><br>${message}</p>
        </div>
        <p style="${styles.footer}">${i18n.__('contactSeller.footer')}</p>
      </div>
    </div>
  `;

    return { subject, html: contactSellerHTMLTemplate };
}
