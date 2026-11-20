# 1.9 — Mobile and polish

**Branch:** `bongani/mobile-fixes`

## Playwright at 390 × 844

Add `FrontEnd/tests-e2e/mobile.spec.ts` and a workflow.

```ts
import { test, expect } from '@playwright/test'

const routes = [
  '/login', '/home', '/events', '/events/new', '/birthdays',
  '/notifications', '/profile', '/admin', '/admin/users',
  '/admin/events', '/admin/access-requests', '/chat',
]

test.use({ viewport: { width: 390, height: 844 } })

for (const route of routes) {
  test(`${route} fits mobile viewport`, async ({ page }) => {
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)

    // Every interactive element is at least 44 x 44
    const small = await page.$$eval('button, a, [role=button], input', (els) =>
      els.filter((el) => {
        const r = (el as HTMLElement).getBoundingClientRect()
        return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44)
      }).map((el) => ({ tag: el.tagName, text: (el as HTMLElement).innerText?.slice(0, 40) })),
    )
    expect(small, `small tap targets on ${route}: ${JSON.stringify(small, null, 2)}`).toEqual([])
  })
}
```

Then fix each failure by widening tap targets to `min-h-11 min-w-11` and setting `overflow-x-hidden` on container cards. Common offenders: the notification bell, small text-link buttons in cards, the dense table rows on `/admin/users`.

Add the workflow:

```yaml
# .github/workflows/frontend-e2e.yml
name: FrontEnd E2E
on:
  pull_request:
    paths: ['FrontEnd/**', '.github/workflows/frontend-e2e.yml']
  push: { branches: [main] }
jobs:
  mobile:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: FrontEnd } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: FrontEnd/package-lock.json }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
```

## Toast deduplication

Replace direct `toast.error(msg)` calls with a shared helper:

```ts
// FrontEnd/src/utils/toast.ts
import { toast } from 'react-hot-toast'
const recent = new Map<string, number>()
const DedupMs = 3000

export function showToast(kind: 'error' | 'success' | 'info', message: string): void {
  const key = `${kind}:${message}`
  const now = Date.now()
  if ((recent.get(key) ?? 0) > now - DedupMs) return
  recent.set(key, now)
  toast[kind === 'info' ? 'success' : kind](message)
}
```

Codemod: `grep -rln "toast.error\|toast.success"` in `FrontEnd/src` and replace with `showToast`.

## Pause polling when the tab is hidden

Replace `useInterval`-style fetches in chat / unread-count hooks with a small hook:

```ts
// FrontEnd/src/hooks/useVisibilityAwarePolling.ts
import { useEffect, useRef } from 'react'

export function useVisibilityAwarePolling(
  fn: () => Promise<void>,
  intervalMs: number,
): void {
  const errorBackoff = useRef(0)
  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const tick = async () => {
      if (cancelled) return
      if (document.visibilityState === 'hidden') {
        timer = setTimeout(tick, 30_000)
        return
      }
      try {
        await fn()
        errorBackoff.current = 0
      } catch {
        errorBackoff.current = Math.min(errorBackoff.current + 1, 5)
      }
      const nextIn = intervalMs * Math.pow(2, errorBackoff.current)
      timer = setTimeout(tick, nextIn)
    }
    tick()
    const onVis = () => { if (document.visibilityState === 'visible') { clearTimeout(timer); tick() } }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelled = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [fn, intervalMs])
}
```

Use it for `useChatPolling` and `useUnreadCount`.
