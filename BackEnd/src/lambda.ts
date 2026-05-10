import serverless from 'serverless-http'
import { app } from './app'
import { initData } from './config/db'

const appHandler = serverless(app)
let initPromise: Promise<void> | null = null

export const handler = async (...args: Parameters<typeof appHandler>) => {
	if (!initPromise) {
		initPromise = initData().catch((err) => {
			initPromise = null
			throw err
		})
	}
	await initPromise
	return appHandler(...args)
}
