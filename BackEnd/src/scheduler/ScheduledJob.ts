export interface JobResult {
  readonly jobName: string
  readonly startedAt: string
  readonly finishedAt: string
  readonly durationMs: number
  readonly success: boolean
  readonly counts: Record<string, number>
  readonly error?: string
}

export abstract class ScheduledJob {
  public abstract readonly name: string
  protected abstract runInternal(): Promise<Record<string, number>>

  public async run(): Promise<JobResult> {
    const startedAt = new Date()
    try {
      const counts = await this.runInternal()
      const finishedAt = new Date()
      return {
        jobName: this.name,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        success: true,
        counts,
      }
    } catch (error) {
      const finishedAt = new Date()
      return {
        jobName: this.name,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        success: false,
        counts: {},
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
}
