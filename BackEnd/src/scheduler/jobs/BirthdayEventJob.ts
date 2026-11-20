import { birthdayService } from '../../services/birthday.service'
import { ScheduledJob } from '../ScheduledJob'

export class BirthdayEventJob extends ScheduledJob {
  public readonly name: string = 'BirthdayEventJob'
  private static readonly HorizonDays: number = 30

  protected async runInternal(): Promise<Record<string, number>> {
    const result = await birthdayService.generateUpcomingBirthdayEvents(BirthdayEventJob.HorizonDays, new Date())
    return {
      created: result.events.length,
      skipped: result.skipped,
    }
  }
}
