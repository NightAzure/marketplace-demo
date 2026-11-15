import nodemailer from "nodemailer";
import { Resend } from "resend";
import { formatPrice } from "@/lib/format";

export interface SendSellerNotificationParams {
  sellerEmail: string;
  buyerEmail: string;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  message: string;
}

export interface SendSellerNotificationResult {
  sent: boolean;
  provider?: "resend" | "smtp";
  error?: string;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildEmailContent(params: SendSellerNotificationParams) {
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000"
  ).replace(/\/+$/, "");
  const listingUrl = `${baseUrl}/item/${params.listingId}`;
  const formattedPrice = formatPrice(params.listingPrice);
  const subject = `[Mini-Marketplace] New inquiry about "${params.listingTitle}"`;

  const text = [
    `You received a new inquiry on Mini-Marketplace!`,
    ``,
    `Listing: ${params.listingTitle} (${formattedPrice})`,
    `From buyer: ${params.buyerEmail}`,
    ``,
    `Message:`,
    params.message,
    ``,
    `View listing: ${listingUrl}`,
    `Reply directly to this email to respond to ${params.buyerEmail}.`,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;background-color:#F0F2F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1C1E21;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:12px;border:1px solid #DADDE1;overflow:hidden;">
      <tr>
        <td style="background:#1877F2;padding:18px 24px;color:#FFFFFF;">
          <h1 style="margin:0;font-size:18px;font-weight:700;">Mini-Marketplace</h1>
          <p style="margin:4px 0 0;font-size:13px;opacity:0.9;">New buyer inquiry</p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 12px;font-size:15px;">
            Someone is interested in your listing:
          </p>
          <div style="padding:14px 16px;background:#F7F8FA;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:18px;">
            <div style="font-size:16px;font-weight:700;color:#1C1E21;">${escapeHtml(params.listingTitle)}</div>
            <div style="font-size:15px;font-weight:700;color:#1877F2;margin-top:4px;">${escapeHtml(formattedPrice)}</div>
          </div>
          <p style="margin:0 0 8px;font-size:13px;color:#65676B;">
            <strong>Buyer email:</strong> ${escapeHtml(params.buyerEmail)}
          </p>
          <div style="padding:14px 16px;background:#FFFFFF;border:1px solid #DADDE1;border-radius:8px;margin-bottom:20px;white-space:pre-wrap;font-size:14px;line-height:1.5;">${escapeHtml(params.message)}</div>
          <a href="${escapeHtml(listingUrl)}" style="display:inline-block;background:#1877F2;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:8px;">
            View Listing
          </a>
          <p style="margin:18px 0 0;font-size:12px;color:#65676B;">
            You can reply directly to this email to respond to ${escapeHtml(params.buyerEmail)}.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  return { subject, text, html };
}

/**
 * Sends a transactional email notification to the seller when a buyer submits
 * a message. Uses Resend as primary provider and Nodemailer SMTP as fallback.
 */
export async function sendSellerNotificationEmail(
  params: SendSellerNotificationParams
): Promise<SendSellerNotificationResult> {
  const { subject, text, html } = buildEmailContent(params);

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const from =
        process.env.EMAIL_FROM?.trim() ||
        "Mini-Marketplace <onboarding@resend.dev>";

      const { error } = await resend.emails.send({
        from,
        to: params.sellerEmail,
        replyTo: params.buyerEmail,
        subject,
        text,
        html,
      });

      if (error) {
        return {
          sent: false,
          provider: "resend",
          error: error.message || "Resend failed to send email.",
        };
      }

      return { sent: true, provider: "resend" };
    } catch (err) {
      return {
        sent: false,
        provider: "resend",
        error: err instanceof Error ? err.message : "Resend request failed.",
      };
    }
  }

  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT?.trim() || "587");
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number.isFinite(smtpPort) ? smtpPort : 587,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const from = process.env.EMAIL_FROM?.trim() || smtpUser;

      await transporter.sendMail({
        from,
        to: params.sellerEmail,
        replyTo: params.buyerEmail,
        subject,
        text,
        html,
      });

      return { sent: true, provider: "smtp" };
    } catch (err) {
      return {
        sent: false,
        provider: "smtp",
        error: err instanceof Error ? err.message : "SMTP delivery failed.",
      };
    }
  }

  return {
    sent: false,
    error:
      "Email provider is not configured (set RESEND_API_KEY or SMTP_* in .env.local).",
  };
}
