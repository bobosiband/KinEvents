# Shared animations package (Remotion)

A `packages/animations/` workspace shared by the React frontend (plays live on `/home`) and the EmailService (renders to GIF for the `animated-birthday` email).

## Goal

One codebase for the on-site animation and the GIF embedded in birthday emails. An admin override lets the organizer pin a particular animation to a specific occasion; otherwise the system cycles through them year-over-year.

## Data model

Extend `content` collection with a row keyed `animations.default` holding the ordered list of animation IDs. An admin override lives on the occasion tribute (see [OccasionTributes](./OccasionTributes.md)): `animationOverride?: string`.

Animations live as `.tsx` files under `packages/animations/src/clips/`:

```
clips/
  BalloonBurst.tsx
  SparklerText.tsx
  CakeWithCandles.tsx
  ConfettiFall.tsx
```

Each exports `{ id, title, durationFrames, Composition }` using Remotion. New animations are PRs to this package.

## Rotation

`AnimationChooser.ts`:

```ts
export class AnimationChooser {
  public static for(year: number, override: string | null, clips: readonly Clip[]): Clip {
    if (override) {
      const found = clips.find((c) => c.id === override)
      if (found) return found
    }
    return clips[year % clips.length]
  }
}
```

## Where it runs

- Frontend: `<Player component={Composition} />` from `@remotion/player` on `/home` for the current month's birthdays.
- EmailService: on request for the `animated-birthday` template, the service runs `@remotion/renderer` → GIF (max 2 MB) → uploads to Cloudinary → embeds `<img src="https://res.cloudinary.com/.../birthday-2026-abc123.gif" />` in the email.

## Verdict

**Integration via a shared package** — not a separate service. The renderer itself is heavy; keep it off the backend hot path by letting `EmailService` call Remotion only when it needs a GIF (background Lambda, 1 GB memory). No new credentials.
