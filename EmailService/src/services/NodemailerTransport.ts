import nodemailer, { type Transporter } from 'nodemailer'
import { AppConfig } from '../config/AppConfig'
import type { ISendMailOptions, ITransport } from './ITransport'

export class NodemailerTransport implements ITransport {
  private readonly transporter: Transporter

  public constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: AppConfig.gmailUser,
        pass: AppConfig.gmailAppPassword,
      },
    })
  }

  public async send(options: ISendMailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    })
  }

  public async verify(): Promise<void> {
    await this.transporter.verify()
  }
}
