const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Meiersbook team <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      secure: process.env.EMAIL_PORT == 465, // If port is 465, use SSL
    });
  }

  // Sends the email
  async send(template, subject) {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html: template, // The HTML content for the email
      text: htmlToText.convert(template), // Converts HTML to plain text for fallback
    };

    // Send the email
    await this.newTransport().sendMail(mailOptions);
  }

  // Send the welcome email
  async sendWelcome() {
    const template = `<h1>Welcome, ${this.firstName}!</h1>
                      <p>Thanks for signing up to MeiersBook. We're glad to have you!</p>
                      <p>Check your profile here: <a href="${this.url}">${this.url}</a></p>`;
    await this.send(template, 'Welcome to MeiersBook!');
  }

  // Send password reset email
  async sendPasswordReset() {
    const template = `<h1>Password Reset Request</h1>
                      <p>Hello ${this.firstName}!,</p>
                      <p>You requested a password reset. Please click on the following link to reset your password:</p>
                      <p><a href="${this.url}">Reset Password</a></p>
                      <p>If you didn't request a password reset, please ignore this email.</p>`;
    await this.send(
      template,
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};
