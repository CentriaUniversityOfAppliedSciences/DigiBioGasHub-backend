import i18n from "../i18n/config.js";
import { User } from "../models/index.js";

export default async function buyerEmailTemplate({ buyer, amount, price, offer, material, isSoldOut, company }) {
  const styles = {
    container: `
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: auto;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    `,
    header: `
      background-color: #007bff;
      color: white;
      padding: 20px;
      text-align: center;
    `,
    sectionPadding: 'padding: 20px;',
    thankYou: 'font-size: 18px; font-weight: bold; color: #333;',
    purchaseInfo: 'font-size: 20px; font-weight: bold; color: #007bff; margin: 8px 0;',
    total: 'font-size: 18px; font-weight: bold; color: #28a745; margin-bottom: 24px;',
    offerDetailsHeader: `
      border-bottom: 2px solid #007bff;
      padding-bottom: 8px;
      color: #007bff;
      margin-bottom: 16px;
    `,
    table: `
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 14px;
      color: #444;
    `,
    tableCellHeader: `
      padding: 10px;
      font-weight: 600;
      border: 1px solid #ddd;
    `,
    tableCell: `
      padding: 10px;
      border: 1px solid #ddd;
    `,
    rowAlternate: 'background-color: #f1f8ff;',
    soldOutText: 'color: #dc3545;',
    availableText: 'color: #28a745;',
    hr: 'margin: 30px 0;',
    footer: `
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    `,
    buttonContainer: 'margin-top: 30px; text-align: center;',
    button: `
      background-color: #007bff;
      color: white;
      padding: 12px 24px;
      border-radius: 5px;
      text-decoration: none;
      font-weight: bold;
      display: inline-block;
    `
  };

  const user = await User.findOne({
    where: { email: buyer.email },
    attributes: ['language'],
  });

  const userLanguage = user.language || 'en';
  i18n.setLocale(userLanguage);

  const buyerSubject = i18n.__('buyer.emailSubject');

  const buyerHTMLTemplate = `
   <div style="${styles.container}">
      <div style="${styles.header}">
        <h1 style="margin: 0;">${i18n.__('buyer.title')}</h1>
      </div>

      <div style="${styles.sectionPadding}">
        <p style="${styles.thankYou}">${i18n.__('buyer.thankYou')}</p>
        <p style="${styles.purchaseInfo}">
          ${i18n.__('buyer.bought')} <strong>${amount}</strong> ${offer.unit} ${i18n.__('buyer.atEach')} <strong>${price} €</strong> ${i18n.__('buyer.from')}
        </p>
        <p style="${styles.total}">
          <strong>${i18n.__('buyer.total')}:</strong> ${(amount * price).toFixed(2)}€
        </p>

        <h2 style="${styles.offerDetailsHeader}">${i18n.__('buyer.offerDetails')}</h2>

        <table style="${styles.table}">
          <tbody>
            <tr style="${styles.rowAlternate}">
              <td style="${styles.tableCellHeader}">${i18n.__('buyer.offerDescription')}</td>
              <td style="${styles.tableCell}">${offer.description}</td>
            </tr>
            <tr>
              <td style="${styles.tableCellHeader}">${i18n.__('buyer.cargoType')}</td>
              <td style="${styles.tableCell}">${offer.cargoType}</td>
            </tr>
            <tr style="${styles.rowAlternate}">
              <td style="${styles.tableCellHeader}">${i18n.__('buyer.unit')}</td>
              <td style="${styles.tableCell}">${offer.unit}</td>
            </tr>
            <tr>
              <td style="${styles.tableCellHeader}">${i18n.__('buyer.material')}</td>
              <td style="${styles.tableCell}">${material.name}</td>
            </tr>
            <tr style="${styles.rowAlternate}">
              <td style="${styles.tableCellHeader}">${i18n.__('buyer.materialDescription')}</td>
              <td style="${styles.tableCell}">${material.description}</td>
            </tr>
            <tr>
              <td style="${styles.tableCellHeader}">${i18n.__('buyer.materialType')}</td>
              <td style="${styles.tableCell}">${material.type}</td>
            </tr>
            <tr style="${styles.rowAlternate}">
              <td style="${styles.tableCellHeader}">${i18n.__('buyer.materialQuality')}</td>
              <td style="${styles.tableCell}">${material.quality}</td>
            </tr>
          </tbody>
        </table>

        ${
          isSoldOut
            ? `<p style="${styles.soldOutText}"><strong>${i18n.__('buyer.soldOut')}</strong></p>`
            : `<p style="${styles.availableText}">${i18n.__('buyer.available')}</p>`
          }

        <hr style="${styles.hr}" />

        <h3>${i18n.__('buyer.sellerInfo')}</h3>
        <p><strong>${i18n.__('buyer.name')}:</strong> ${company.name}</p>
        <p><strong>${i18n.__('buyer.email')}:</strong> ${company.email}</p>
        <p><strong>${i18n.__('buyer.phone')}:</strong> ${company.phone}</p>
        <p><strong>${i18n.__('buyer.address')}:</strong> ${company.address}</p>
        <p><strong>${i18n.__('buyer.location')}:</strong> ${company.city}, ${company.zipcode}</p>

        <div style="${styles.buttonContainer}">
          <a href="#" style="${styles.button}">${i18n.__('buyer.viewDetails')}</a>
        </div>
      </div>

      <div style="${styles.footer}">
        <p>&copy; ${new Date().getFullYear()} DigiBioGasHub. ${i18n.__('buyer.rights')}</p>
      </div>
    </div>
  `;

  return { html: buyerHTMLTemplate, buyerSubject };

}
