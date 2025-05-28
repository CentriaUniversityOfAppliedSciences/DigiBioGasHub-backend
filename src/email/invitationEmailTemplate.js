export default function invitationEmailTemplate(invitedByName, companyName, invitationLink, expiryDate) {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>You're Invited!</h2>
        <p>Hello,</p>
        <p>You have been invited to join the company <strong>${companyName}</strong> by <strong>${invitedByName}</strong>.</p>
        <p>Please click the link below to accept the invitation:</p>
        <a href="${invitationLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #007BFF; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
        <p>This invitation will expire on <strong>${expiryDate.toDateString()}</strong>.</p>
        <p>Best regards,<br>DigiBioGasHub Team</p>
      </div>
    `;
  }