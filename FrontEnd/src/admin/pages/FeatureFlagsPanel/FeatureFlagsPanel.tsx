import { Card } from '@/components/ui/Card/Card'
import { Badge } from '@/components/ui/Badge/Badge'
// Badge uses `variant` for tone; default is "primary" — pass "neutral" when off
import { FEATURE_FLAG_LABELS, useFeatureFlags } from '@/features/featureFlags'
import type { IFeatureFlags } from '@/features/featureFlags'

export function FeatureFlagsPanel() {
  const flags = useFeatureFlags()
  const keys = Object.keys(FEATURE_FLAG_LABELS) as readonly (keyof IFeatureFlags)[]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Feature flags</h1>
        <p className="text-sm text-muted-foreground">
          Read-only view. Flags are set as backend environment variables and applied on deploy.
        </p>
      </div>
      <Card className="space-y-3">
        {keys.map((key) => {
          const enabled = Boolean(flags[key])
          return (
            <div key={key} className="flex items-center justify-between gap-4 py-2">
              <div>
                <div className="font-medium">{FEATURE_FLAG_LABELS[key]}</div>
                <div className="text-xs text-muted-foreground font-mono">{key}</div>
              </div>
              <Badge variant={enabled ? 'success' : 'neutral'}>{enabled ? 'On' : 'Off'}</Badge>
            </div>
          )
        })}
      </Card>
    </div>
  )
}
