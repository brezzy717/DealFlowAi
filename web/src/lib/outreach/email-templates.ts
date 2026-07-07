interface EmailVars {
  ownerFirstName: string;
  businessName: string;
  industry: string;
  brokerName: string;
  brokerSignature: string;
  bookingLink: string;
  dncLink: string;
}

/** Day-1 warm intro — sent via Resend with vault attachments + AI video link. */
export function warmIntroEmail(v: EmailVars): { subject: string; html: string } {
  return {
    subject: `A confidential valuation for ${v.businessName}`,
    html: `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#222;line-height:1.6">
  <p>${v.ownerFirstName},</p>
  <p>Most owners in ${v.industry} have no idea what their business is actually worth in today's market —
  and the ones who find out early keep every option open.</p>
  <p>I've attached a short guide covering what buyers are paying right now for businesses like
  ${v.businessName}, along with a personal introduction video.</p>
  <p>If it's ever useful, my calendar is below for a <strong>confidential, no-obligation</strong>
  conversation. No pressure — the guide is yours either way.</p>
  <p><a href="${v.bookingLink}" style="display:inline-block;background:#c25e40;color:#fff;padding:12px 22px;
  border-radius:8px;text-decoration:none">Pick a time that works</a></p>
  <p>${v.brokerSignature}</p>
  <hr style="border:none;border-top:1px solid #ddd;margin-top:32px" />
  <p style="font-size:12px;color:#888">Prefer not to hear from us? <a href="${v.dncLink}">One click and you never will again.</a></p>
</div>`,
  };
}

/** Day-7 follow-up (after 3rd unanswered call). */
export function followUpEmail(v: EmailVars): { subject: string; html: string } {
  return {
    subject: `Still here when you're ready, ${v.ownerFirstName}`,
    html: `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#222;line-height:1.6">
  <p>${v.ownerFirstName} — I tried reaching you by phone this week and didn't want to be a pest.</p>
  <p>The market for ${v.industry} businesses is unusually strong right now, and a confidential valuation
  costs nothing but twenty minutes. Even owners with no plans to sell use it for insurance, estate,
  and retirement planning.</p>
  <p><a href="${v.bookingLink}" style="display:inline-block;background:#c25e40;color:#fff;padding:12px 22px;
  border-radius:8px;text-decoration:none">Grab twenty minutes</a></p>
  <p>${v.brokerSignature}</p>
  <hr style="border:none;border-top:1px solid #ddd;margin-top:32px" />
  <p style="font-size:12px;color:#888"><a href="${v.dncLink}">Unsubscribe from all contact</a></p>
</div>`,
  };
}
