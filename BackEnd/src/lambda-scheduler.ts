import { initData } from './config/db'
import { ScheduledJobRunner } from './scheduler/ScheduledJobRunner'
import { buildDefaultJobs } from './scheduler/defaultJobs'

export const handler = async (): Promise<{ results: unknown[] }> => {
  await initData()
  const runner = new ScheduledJobRunner(buildDefaultJobs())
  const results = await runner.runAll()
  return { results: [...results] }
}
