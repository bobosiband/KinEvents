# Animated / 3D birthday emails

## Goal

The birthday email feels like a card, not a form letter. Apple Mail subscribers see live CSS confetti; every other client sees a hand-rendered GIF produced by the shared [animations](./Animations.md) package.

## Rendered variants

Each birthday email produces three artefacts:

- `html.applemail` — CSS-only confetti using Apple Mail's support for `animation`, `keyframes`, `transform`. Falls back gracefully if a rule is unsupported.
- `html.other` — static hero image plus `<img>` pointing at the Cloudinary-hosted GIF produced by `@remotion/renderer`.
- `text` — plain text with a link.

Email clients are detected by inspecting request headers / user agent is unreliable in email. Instead ship both and rely on `media query` + `@supports` to gate the CSS variant:

```css
@media screen and (-apple-system-font) { .confetti { animation: ...; } }
```

## Data model

No new collections. Reuses `EmailService` with template `animated-birthday`:

```json
{
  "templateName": "animated-birthday",
  "recipient": { "name": "Alex", "email": "alex@..." },
  "recipientId": "user-123",
  "data": {
    "recipientName": "Alex",
    "birthdayPersonName": "Taylor",
    "gifUrl": "https://res.cloudinary.com/.../birthday-2026-abc.gif",
    "wishesPageUrl": "https://kinevents.vercel.app/celebrate/evt-456"
  }
}
```

## Verdict

**Integration** into the existing `EmailService` as a new `AnimatedBirthdayTemplate` subclass. No new stack. The GIF production is the same path as [Animations](./Animations.md) and belongs to EmailService, not the backend.
