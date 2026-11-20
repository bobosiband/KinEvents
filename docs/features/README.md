# Phase 2 — Feature design docs

Each feature doc below is a one-pager covering:

- **Goal** — what success looks like for families using KinEvents.
- **Data model** — new or extended collections and the fields that matter.
- **Endpoints** — the HTTP surface, admin and member.
- **Admin controls** — what the admin UI needs.
- **Verdict** — *separate service* or *integration into the main system*, with the reason.

The verdict recommendations assume the Phase 1 extracted `EmailService` is the model: a feature earns its own SAM stack when it has a distinct lifecycle, external-vendor credential surface, or cold-start cost profile from the main backend. Otherwise it integrates.

| # | Feature |
| - | ------- |
| 1 | [OccasionTributes.md](./OccasionTributes.md) |
| 2 | [Animations.md](./Animations.md) |
| 3 | [AnimatedEmails.md](./AnimatedEmails.md) |
| 4 | [CelebrationPage.md](./CelebrationPage.md) |
| 5 | [Photos.md](./Photos.md) |
| 6 | [Records.md](./Records.md) |
| 7 | [FamilyTree.md](./FamilyTree.md) |
| 8 | [YearInReview.md](./YearInReview.md) |
| 9 | [CalendarSync.md](./CalendarSync.md) |
| 10 | [EventComments.md](./EventComments.md) |
| 11 | [GuestEventCards.md](./GuestEventCards.md) |
| 12 | [SharedListsAndPotluck.md](./SharedListsAndPotluck.md) |
| 13 | [AdminAnalytics.md](./AdminAnalytics.md) |
| 14 | [AdminParity.md](./AdminParity.md) |
| 15 | [AdminHandover.md](./AdminHandover.md) |
