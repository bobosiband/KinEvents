import { JobResult, ScheduledJob } from './ScheduledJob'

export class ScheduledJobRunner {
  public constructor(private readonly jobs: readonly ScheduledJob[]) {}

  public async runAll(): Promise<readonly JobResult[]> {
    const results: JobResult[] = []
    for (const job of this.jobs) {
      const result = await job.run()
      if (!result.success) {
        console.error(`[SCHEDULER] Job '${job.name}' failed: ${result.error}`)
      } else {
        console.log(`[SCHEDULER] Job '${job.name}' ok in ${result.durationMs}ms`, result.counts)
      }
      results.push(result)
    }
    return results
  }
}
