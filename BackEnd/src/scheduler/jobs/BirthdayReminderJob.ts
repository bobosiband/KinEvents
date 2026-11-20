import { birthdayService } from '../../services/birthday.service'
import { ScheduledJob } from '../ScheduledJob'

export class BirthdayReminderJob extends ScheduledJob {
  public readonly name: string = 'BirthdayReminderJob'

  protected async runInternal(): Promise<Record<string, number>> {
    const now = new Date()
    const sevenDayReminders = await birthdayService.generateBirthdayReminders(7, now)
    const sameDayReminders = await birthdayService.generateBirthdayReminders(0, now)
    return {
      sevenDay: sevenDayReminders.length,
      today: sameDayReminders.length,
    }
  }
}
