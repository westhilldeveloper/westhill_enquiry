import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false, // true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendEnquiryEmail(enquiry, userEmail) {
  try {
    const totalPax = enquiry.adults + enquiry.kids;
    const dmcSummary = enquiry.dmcQuotations.map((dmc, idx) => {
      const finalTotal = dmc.finalPrice * totalPax;
      return `<li><strong>${dmc.dmcName || `DMC ${idx+1}`}</strong>: ₹${finalTotal.toFixed(2)} (Final total)</li>`;
    }).join('');

    await transporter.sendMail({
      from: `"Travel Agency" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `New Enquiry Created - #${enquiry.enqNo}`,
      html: `
        <h2>Enquiry #${enquiry.enqNo}</h2>
        <p><strong>Destination:</strong> ${enquiry.destination}</p>
        <p><strong>Travel Dates:</strong> ${new Date(enquiry.travelStart).toLocaleDateString()} - ${new Date(enquiry.travelEnd).toLocaleDateString()}</p>
        <p><strong>Total PAX:</strong> ${totalPax} (Adults: ${enquiry.adults}, Kids: ${enquiry.kids})</p>
        <h3>DMC Quotations:</h3>
        <ul>${dmcSummary}</ul>
        <p><a href="${process.env.NEXTAUTH_URL}/history">View in Dashboard</a></p>
      `,
    });
  } catch (error) {
    console.error('Email send error:', error);
    // Don't throw – email failure shouldn't break the flow
  }
}