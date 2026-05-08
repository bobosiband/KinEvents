import serverless from 'serverless-http'
import { app } from './local/server'
import { initData } from './config/db'

const appHandler = serverless(app)
let initialized = false

export const handler = async (...args: Parameters<typeof appHandler>) => {
	if (!initialized) {
		await initData()
		initialized = true
	}
	return appHandler(...args)
}
