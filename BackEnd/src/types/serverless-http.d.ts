declare module 'serverless-http' {
  import type { RequestHandler } from 'express'

  type ServerlessHandler = (...args: any[]) => any

  function serverless(app: RequestHandler, options?: Record<string, unknown>): ServerlessHandler

  export default serverless
}
