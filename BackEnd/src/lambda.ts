import serverless from 'serverless-http'
import { app } from './local/server'
import { dbReady } from './config/db'

const appHandler = serverless(app)

export const handler = async (...args: Parameters<typeof appHandler>) => {
	await dbReady
	return appHandler(...args)
}
