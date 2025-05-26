export default function buyerEmailTemplate({ amount, price, offer, material, isSoldOut, company }) {
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

  return `
    <div style="${styles.container}">
      <div style="${styles.header}">
        <h1 style="margin: 0;">Purchase Confirmation</h1>
      </div>

      <div style="${styles.sectionPadding}">
        <p style="${styles.thankYou}">Thank you for your purchase!</p>
        <p style="${styles.purchaseInfo}">
          You have bought <strong>${amount}</strong> ${offer.unit} at <strong>${price} €</strong> each from DigiBioGasHub.
        </p>
        <p style="${styles.total}">
          <strong>Total:</strong> ${(amount * price).toFixed(2)}€
        </p>

        <h2 style="${styles.offerDetailsHeader}">Offer Details</h2>

        <table style="${styles.table}">
          <tbody>
            <tr style="${styles.rowAlternate}">
              <td style="${styles.tableCellHeader}">Offer Description</td>
              <td style="${styles.tableCell}">${offer.description}</td>
            </tr>
            <tr>
              <td style="${styles.tableCellHeader}">Cargo Type</td>
              <td style="${styles.tableCell}">${offer.cargoType}</td>
            </tr>
            <tr style="${styles.rowAlternate}">
              <td style="${styles.tableCellHeader}">Unit</td>
              <td style="${styles.tableCell}">${offer.unit}</td>
            </tr>
            <tr>
              <td style="${styles.tableCellHeader}">Material</td>
              <td style="${styles.tableCell}">${material.name}</td>
            </tr>
            <tr style="${styles.rowAlternate}">
              <td style="${styles.tableCellHeader}">Material Description</td>
              <td style="${styles.tableCell}">${material.description}</td>
            </tr>
            <tr>
              <td style="${styles.tableCellHeader}">Material Type</td>
              <td style="${styles.tableCell}">${material.type}</td>
            </tr>
            <tr style="${styles.rowAlternate}">
              <td style="${styles.tableCellHeader}">Material Quality</td>
              <td style="${styles.tableCell}">${material.quality}</td>
            </tr>
          </tbody>
        </table>

        ${
          isSoldOut
            ? `<p style="${styles.soldOutText}"><strong>The offer is now sold out!</strong></p>`
            : `<p style="${styles.availableText}">Remaining stock is still available.</p>`
        }

        <hr style="${styles.hr}" />

        <h3>Seller Information</h3>
        <p><strong>Name:</strong> ${company.name}</p>
        <p><strong>Email:</strong> ${company.email}</p>
        <p><strong>Phone:</strong> ${company.phone}</p>
        <p><strong>Address:</strong> ${company.address}</p>
        <p><strong>Location:</strong> ${company.city}, ${company.zipcode}</p>

        <div style="${styles.buttonContainer}">
          <a href="#" style="${styles.button}">View Offer Details</a>
        </div>
      </div>

      <div style="${styles.footer}">
        <p>&copy; ${new Date().getFullYear()} DigiBioGasHub. All rights reserved.</p>
      </div>
    </div>
  `;
}
