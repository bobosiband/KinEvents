import { cleanupService } from '../../services/cleanup.service'
import { ScheduledJob } from '../ScheduledJob'

export class CleanupJob extends ScheduledJob {
  public readonly name: string = 'CleanupJob'

  protected async runInternal(): Promise<Record<string, number>> {
    const [readNotifications, emailLogs, accessHistory] = await Promise.all([
      cleanupService.deleteOldReadNotifications(),
      cleanupService.deleteOldEmailLogs(),
      cleanupService.deleteOldAccessRequestHistory(),
    ])
    return { readNotifications, emailLogs, accessHistory }
  }
}
