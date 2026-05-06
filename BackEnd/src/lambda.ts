import serverless from 'serverless-http'
import { app } from './local/server'

export const handler = serverless(app)
