import nodemailer from "nodemailer";
import pug from "pug";
import path from "path";
import { getRootPath } from "../helpers/common";


/**
 * Sends an email using supplied template file
 * Or error if fails
 * @param {string} emailTo The email to send to
 * @param {string} subject Subject of email
 * @param {pug.LocalsObject} payload Data object to template
 * @param {string} template Use this template file to render
 * @returns {Promise<boolean | Error>} Returns true if successful,
 *   the error otherwise
 *
 * @example
 *  sendEmail(
 *    "user@domain.se",
 *    "Please read my email",
 *    {name:"Fredrik Johansson"},
 *    "urgent.pug"  <- in templates folder
 *  )
 */
export async function sendEmail(
  emailTo: string,
  subject: string,
  payload: pug.LocalsObject,
  template: string,
  emailFrom: string = process.env.EMAIL_FROM_DEFAULT+"",
): Promise<Error | boolean> {
  try {
    // create transport for email
    const credentials = {
      host: process.env.EMAIL_HOST+"",
      port: Number(process.env.EMAIL_HOST_PORT) || 465,
      secure: Boolean(process.env.EMAIL_SECURE || true),
      tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' },
      auth: {
        user: process.env.EMAIL_USERNAME+"",
        pass: process.env.EMAIL_PASSWORD+"",
      }
    };
    const transport = nodemailer.createTransport(credentials);

    const html = pug.renderFile(
      path.join(getRootPath(),
      'src/templates/layouts',
      template),
      payload
    );

    await transport.sendMail({
      from: emailFrom,
      to: emailTo,
      subject,
      html
    })

    return true;
  } catch (err: any) {
    return err;
  }
}

