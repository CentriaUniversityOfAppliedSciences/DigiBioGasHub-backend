import i18n from "../i18n/config.js";
import { User, UserCompany } from "../models/index.js";

export default async function sellerEmailTemplate({ buyer, amount, price, offer, material, company }) {
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
      background-color: #28a745; 
      color: white; 
      padding: 20px; 
      text-align: center;
    `,
    sectionPadding: 'padding: 20px;',
    title: 'margin: 0;',
    buyerName: 'font-size: 18px; font-weight: bold; color: #333; margin-bottom: 8px;',
    amountPrice: 'font-size: 20px; font-weight: bold; color: #28a745; margin: 8px 0;',
    total: 'font-size: 18px; font-weight: bold; color: #007bff; margin-bottom: 24px;',
    offerDetailsHeader: `
      border-bottom: 2px solid #28a745; 
      padding-bottom: 8px; 
      color: #28a745; 
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
    rowAlternate: 'background-color: #e6f4ea;',
    hr: 'margin: 30px 0;',
    buttonContainer: 'margin-top: 30px; text-align: center;',
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
      background-color: #f8f9fa; 
      padding: 20px; 
      text-align: center; 
      font-size: 12px; 
      color: #666;
    `
  };

  const userCompany = await UserCompany.findOne({
    where: {
      companyID: company.id,
      userlevel: 23,
    },
    include: [{
      model: User,
      attributes: ['language'],
    }],
  });

  const user = userCompany.User;
  const userLanguage = user.language || 'en';

  i18n.setLocale(userLanguage);

  const sellerSubject = i18n.__('seller.emailSubject');

  const total = (amount * price).toFixed(2);

  const sellerHTMLTemplate = `
    <div style="${styles.container}">
      <div style="${styles.header}">
        <h1 style="${styles.title}">${i18n.__('seller.title')}</h1>
      </div>

      <div style="${styles.sectionPadding}">
        <p style="${styles.buyerName}">${i18n.__('seller.buyerBought', { name: buyer.name })}</p>
        <p style="${styles.amountPrice}">
          <strong>${amount}</strong> ${offer.unit} ${i18n.__('seller.atEach')} <strong>${price}</strong> €
        </p>
        <p style="${styles.total}">
          <strong>${i18n.__('seller.total')}:</strong> ${total}€
        </p>

        <h2 style="${styles.offerDetailsHeader}">${i18n.__('seller.offerDetails')}</h2>

        <table style="${styles.table}">
          <tbody>
            <tr style="${styles.rowAlternate}">
              <td style="${styles.tableCellHeader}">${i18n.__('seller.offerDescription')}</td>
              <td style="${styles.tableCell}">${offer.description}</td>
            </tr>
            <tr>
              <td style="${styles.tableCellHeader}">${i18n.__('seller.cargoType')}</td>
              <td style="${styles.tableCell}">${offer.cargoType}</td>
            </tr>
            <tr style="${styles.rowAlternate}">
              <td style="${styles.tableCellHeader}">${i18n.__('seller.unit')}</td>
              <td style="${styles.tableCell}">${offer.unit}</td>
            </tr>
            <tr>
              <td style="${styles.tableCellHeader}">${i18n.__('seller.material')}</td>
              <td style="${styles.tableCell}">${material.name}</td>
            </tr>
            <tr style="${styles.rowAlternate}">
              <td style="${styles.tableCellHeader}">${i18n.__('seller.materialDescription')}</td>
              <td style="${styles.tableCell}">${material.description}</td>
            </tr>
            <tr>
              <td style="${styles.tableCellHeader}">${i18n.__('seller.materialType')}</td>
              <td style="${styles.tableCell}">${material.type}</td>
            </tr>
            <tr style="${styles.rowAlternate}">
              <td style="${styles.tableCellHeader}">${i18n.__('seller.materialQuality')}</td>
              <td style="${styles.tableCell}">${material.quality}</td>
            </tr>
          </tbody>
        </table>

        <hr style="${styles.hr}" />

        <h3>${i18n.__('seller.buyerInfo')}</h3>
        <p><strong>${i18n.__('seller.name')}:</strong> ${buyer.name}</p>
        <p><strong>${i18n.__('seller.email')}:</strong> ${buyer.email}</p>
        <p><strong>${i18n.__('seller.phone')}:</strong> ${buyer.phone}</p>

        <div style="${styles.buttonContainer}">
          <a href="#" style="${styles.button}">${i18n.__('seller.viewDetails')}</a>
        </div>
      </div>

      <div style="${styles.footer}">
        <p>&copy; ${new Date().getFullYear()} DigiBioGasHub. ${i18n.__('seller.rights')}</p>
      </div>
    </div>
  `;

  return { html: sellerHTMLTemplate, sellerSubject }
}
