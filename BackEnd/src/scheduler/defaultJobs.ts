import { BirthdayEventJob } from './jobs/BirthdayEventJob'
import { BirthdayReminderJob } from './jobs/BirthdayReminderJob'
import { CleanupJob } from './jobs/CleanupJob'
import { EventReminderJob } from './jobs/EventReminderJob'
import type { ScheduledJob } from './ScheduledJob'

export function buildDefaultJobs(): readonly ScheduledJob[] {
  return [
    new BirthdayEventJob(),
    new BirthdayReminderJob(),
    new EventReminderJob(),
    new CleanupJob(),
  ]
}
