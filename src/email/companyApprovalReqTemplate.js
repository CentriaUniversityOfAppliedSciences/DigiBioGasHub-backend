import i18n from "../i18n/config.js";

export default function companyApprovalReqTemplate({ language, company, url }) {
    const styles = {
        container: `
            font-family: Arial, sans-serif;
        `,
        message: 'font-size: 16px; margin-bottom: 20px;',
        button: `
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            display: inline-block;
        `,
        footer: `
            padding: 20px;
            font-size: 12px;
            color: #666666;
        `
    };

    i18n.setLocale(language);

    const subject = i18n.__('companyApproval.subject');
    const companyLink = url;

    const html = `
    <div style="${styles.container}">
        <p style="${styles.message}">${i18n.__('companyApproval.message', { companyName: company.name })}</p>
        <a href="${companyLink}" style="${styles.button}">${i18n.__('companyApproval.button')}</a>
      <div style="${styles.footer}">
        <p>&copy; ${new Date().getFullYear()} DigiBioGasHub. ${i18n.__('companyApproval.rights')}</p>
      </div>
    </div>
  `;

  return { subject, html };
}
