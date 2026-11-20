import { routes } from '../src/app'
import { ROUTE_POLICIES } from '../src/auth/routePolicies'

/**
 * Invariant: every route declared in app.ts must appear in the policy
 * registry. New handlers that ship without an entry fail the build.
 */
describe('Route policy coverage', () => {
  it('every app.ts route has a declared policy', () => {
    const uncovered: string[] = []
    const policyPaths = new Set<string>(Object.keys(ROUTE_POLICIES))
    for (const route of routes) {
      if (!policyPaths.has(route.path)) {
        uncovered.push(route.path)
      }
    }
    expect(uncovered).toEqual([])
  })

  it('every policy entry points at a real route', () => {
    const registeredPaths = new Set<string>(routes.map((r) => r.path))
    const orphans: string[] = []
    for (const path of Object.keys(ROUTE_POLICIES)) {
      if (!registeredPaths.has(path)) {
        orphans.push(path)
      }
    }
    expect(orphans).toEqual([])
  })
})
