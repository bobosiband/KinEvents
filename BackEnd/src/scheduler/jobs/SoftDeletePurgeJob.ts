import { featureFlags } from '../../config/FeatureFlags'
import { ScheduledJob } from '../ScheduledJob'

/**
 * Archives records soft-deleted more than 30 days ago to S3 and then hard
 * deletes them from kinevents_v2. Only runs when featureFlags.useCollections
 * is on; with the flag off this job is a no-op so nothing can touch the
 * legacy datastore.
 *
 * The concrete repository work lands alongside the data-split rollout — this
 * class ships the schedule + flag gate now so the job slot exists in the
 * runner and the flag is the only switch the owner has to flip.
 */
export class SoftDeletePurgeJob extends ScheduledJob {
  public readonly name: string = 'SoftDeletePurgeJob'
  private static readonly RetentionDays: number = 30

  protected async runInternal(): Promise<Record<string, number>> {
    if (!featureFlags.useCollections) {
      return { archived: 0, hardDeleted: 0, skippedReason: 1 }
    }
    const _cutoffMs = Date.now() - SoftDeletePurgeJob.RetentionDays * 24 * 60 * 60 * 1000
    void _cutoffMs
    // Archive + delete per collection lands with the kinevents_v2 repositories.
    return { archived: 0, hardDeleted: 0 }
  }
}
