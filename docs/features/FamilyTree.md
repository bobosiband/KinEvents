# Family tree

## Goal

Render the family's relationships as a graph. Users can see "my parents", "my siblings", "my grandparents". Relationships are the source of truth for things like inheriting access from a deceased member's account.

## Data model

Users-to-users through a new collection `familyEdges`:

```ts
interface IFamilyEdge {
  id: string
  fromUserId: string
  toUserId: string
  relationship: 'parent' | 'spouse' | 'sibling' | 'child' | 'grandparent' | 'grandchild' | 'in-law' | 'other'
  since?: string              // ISO date for marriage/birth
  until?: string              // ISO date for divorce / deceased
  notes?: string
  deletedAt?: string
}
```

Rules:

- `parent` edges go one direction; the reverse `child` edge is derived.
- `spouse` edges are symmetric and stored once with `fromUserId < toUserId` by string compare.
- `until` closes a relationship without deleting the edge — divorced spouses still see tree history.

## Endpoints

| Method | Path | Who |
| ------ | ---- | --- |
| `POST /api/family-edges` | create | admin / manager |
| `DELETE /api/family-edges/:id` | soft-delete | admin / manager |
| `GET /api/users/:id/tree?depth=2` | compute subgraph | any approved user |

## Admin controls

- Draft edges before approving (useful for new families joining).
- Merge two user profiles that turn out to be the same person (soft-delete one, rewrite edges, record in `auditLogs`).

## Verdict

**Integration** into the main backend. The graph is tiny (≤ a few hundred edges), authorization is plain role, and rendering is the frontend's job.
