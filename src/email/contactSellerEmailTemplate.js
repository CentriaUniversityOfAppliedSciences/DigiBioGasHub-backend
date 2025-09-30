export default async function contactSellerEmailTemplate({ companyName, contact, message, offerId }) {
  const subject = `New message regarding your offer (ID: ${offerId})`;

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

  const contactSellerHTMLTemplate = `
    <div style="${styles.body}">
      <div style="${styles.container}">
        <h2 style="${styles.title}">You have a new message about your offer</h2>
        <p>Hello <b>${companyName}</b>,</p>
        <p>You have received a new message regarding your offer (ID: <b>${offerId}</b>):</p>
        <div style="${styles.messageBox}">
          <p><b>Contact Info:</b> ${contact}</p>
          <p><b>Message:</b><br>${message}</p>
        </div>
        <p style="${styles.footer}">This is an automated message from DigiBioGasHub.</p>
      </div>
    </div>
  `;

  return { subject, html: contactSellerHTMLTemplate };
}
