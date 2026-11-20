export interface ISendMailOptions {
  readonly from: string
  readonly to: string
  readonly subject: string
  readonly html: string
  readonly text: string
  readonly replyTo?: string
}

export interface ITransport {
  send(options: ISendMailOptions): Promise<void>
  verify(): Promise<void>
}
