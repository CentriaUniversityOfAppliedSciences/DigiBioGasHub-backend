import i18n from "../i18n/config.js";
import { User } from "../models/index.js";

export default async function invitationEmailTemplate(userID, invitedByName, companyName, invitationLink, expiryDate) {

  const user = await User.findOne({
    where: { id: userID },
    attributes: ['language'],
  });


  const userLanguage = user.language || 'en';
  i18n.setLocale(userLanguage);

  const subject = i18n.__('invitation.emailSubject');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>${i18n.__('invitation.title')}</h2>
      <p>${i18n.__('invitation.greeting')}</p>
      <p>${i18n.__('invitation.message', { companyName, invitedByName })}</p>
      <p>${i18n.__('invitation.instruction')}</p>
      <a href="${invitationLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #007BFF; text-decoration: none; border-radius: 5px;">
        ${i18n.__('invitation.button')}
      </a>
      <p>${i18n.__('invitation.expiry', { expiryDate: expiryDate.toDateString() })}</p>
      <p>${i18n.__('invitation.closing')}</p>
    </div>
  `;

  return { html, subject };
}
