# Admin analytics

## Goal

The admin opens `/admin/analytics` and sees one page per theme. Each chart answers a question the admin asked themselves last month and had to go find out manually.

## Themes

### Email health
- Sent / failed / skipped per day, last 30 days — read from EmailService DynamoDB `EmailLogs`.
- Top failing templates.
- Current `/health` status of EmailService.

### Engagement
- WAU / MAU over last 90 days (defined as any authenticated request).
- Comment count per week.
- Wishes count per week.

### Attendance
- RSVP yes rate per event type.
- No-shows (attendance marked on the day minus RSVP yes).
- Repeat attenders over the last year.

### Events
- Events per month.
- Average time between creation and event date.
- Reminder deliverability (reminder sent → event attended).

### Money
- Total raised per gift pool.
- Pending contributions older than 7 days.
- Running family-wide total this year.

### Housekeeping
- Users without a birthday set.
- Users with invalid phone numbers (Phase 1.8 list).
- Oldest soft-deleted rows pending `SoftDeletePurgeJob`.

## Data model

No new persistent entities. Each chart is a computed query behind a dedicated endpoint under `/api/admin/analytics/<theme>/<chart>` so caching can live at the HTTP layer.

## Admin controls

- Date range picker on each theme.
- CSV export link per chart.

## Verdict

**Integration** into the main backend. The analytics endpoints can be a separate Lambda function in the same stack if the hot path cold-starts become a concern.
