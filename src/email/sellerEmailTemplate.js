export default function sellerEmailTemplate({ buyer, amount, price, offer, material }) {
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

  return `
    <div style="${styles.container}">
      <div style="${styles.header}">
        <h1 style="${styles.title}">Your Offer Has Been Purchased!</h1>
      </div>

      <div style="${styles.sectionPadding}">
        <p style="${styles.buyerName}">${buyer.name} bought</p>
        <p style="${styles.amountPrice}">
          <strong>${amount}</strong> ${offer.unit} at <strong>${price}</strong> € each
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

        <hr style="${styles.hr}" />

        <h3>Buyer Information</h3>
        <p><strong>Name:</strong> ${buyer.name}</p>
        <p><strong>Email:</strong> ${buyer.email}</p>
        <p><strong>Phone:</strong> ${buyer.phone}</p>

        <div style="${styles.buttonContainer}">
          <a href="#" style="${styles.button}">View Details</a>
        </div>
      </div>

      <div style="${styles.footer}">
        <p>&copy; ${new Date().getFullYear()} DigiBioGasHub. All rights reserved.</p>
      </div>
    </div>
  `;
}
