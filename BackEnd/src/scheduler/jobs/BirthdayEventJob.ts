import { birthdayService } from '../../services/birthday.service'
import { ScheduledJob } from '../ScheduledJob'

export class BirthdayEventJob extends ScheduledJob {
  public readonly name: string = 'BirthdayEventJob'
  private static readonly HorizonDays: number = 30

  protected async runInternal(): Promise<Record<string, number>> {
    const now = new Date()
    const thisYear = await birthdayService.generateBirthdayEvents(now.getFullYear(), now, BirthdayEventJob.HorizonDays)

    // On year-boundary dates, also look at the following calendar year so a
    // birthday on Jan 2 isn't missed by a run on Dec 20.
    const horizonMs = BirthdayEventJob.HorizonDays * 24 * 60 * 60 * 1000
    const horizonEnd = new Date(now.getTime() + horizonMs)
    let nextYearCreated = 0
    if (horizonEnd.getFullYear() !== now.getFullYear()) {
      const next = await birthdayService.generateBirthdayEvents(horizonEnd.getFullYear(), now, BirthdayEventJob.HorizonDays)
      nextYearCreated = next.events.length
    }

    return {
      created: thisYear.events.length + nextYearCreated,
      skipped: thisYear.skipped,
    }
  }
}
