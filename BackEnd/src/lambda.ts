import serverless from 'serverless-http'
import { app } from './app'
import { initData } from './config/db'

const appHandler = serverless(app)
export const handler = async (...args: Parameters<typeof appHandler>) => {
  await initData()
  return appHandler(...args)
}
