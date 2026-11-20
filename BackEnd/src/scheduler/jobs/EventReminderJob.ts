import { eventService } from '../../services/event.service'
import { ScheduledJob } from '../ScheduledJob'

export class EventReminderJob extends ScheduledJob {
  public readonly name: string = 'EventReminderJob'
  private static readonly DaysAhead: number = 3

  protected async runInternal(): Promise<Record<string, number>> {
    const reminders = await eventService.generateEventReminders(EventReminderJob.DaysAhead)
    return { reminders: reminders.length }
  }
}
