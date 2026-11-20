# Cutover runbook — legacy datastore → kinevents_v2 collections

**Owner execution only.** Follow these steps in order. The whole dance is
reversible by one line: set `FEATURE_USE_COLLECTIONS=false` in Lambda env
and redeploy.

## 1. Backup the legacy database

```bash
mkdir -p backups
mongodump --uri="$MONGODB_URI" --db=kinevents \
  --archive=backups/pre-cutover-$(date -u +%Y%m%dT%H%M%SZ).gz --gzip
```

Copy the archive to S3 (replace bucket as applicable):

```bash
aws s3 cp backups/pre-cutover-*.gz s3://kinevents-backups/db/
```

Confirm the archive size is non-zero and the file exists in S3 before
continuing.

## 2. Dry-run the migration

```bash
cd BackEnd
npm run migrate:split -- --dry-run
```

Expected output: a per-collection report with `source=N target=0 OK` for
every row. No writes occur.

## 3. Execute the migration (resync)

`--resync` upserts into the `kinevents_v2` database by `id`. It never
touches the legacy database and is safe to re-run.

```bash
npm run migrate:split -- --resync
```

## 4. Verify

```bash
npm run migrate:split -- --verify
```

The script fails loudly if any legacy `user.id` is missing from the new
`users` collection — the "never delete a user" invariant.

## 5. Flip the flag

Only after `--verify` prints a clean report, set the flag on the
Lambda env and redeploy:

```bash
export FEATURE_USE_COLLECTIONS=true
bash scripts/deploy.sh
```

## 6. Smoke test

- Member login still works (email-only)
- Admin login works (PIN flag still off tonight)
- RSVP saves on an existing event
- Gift pool loads
- Chat sends a message
- EmailService /health is 200

## Rollback

Set `FEATURE_USE_COLLECTIONS=false` and redeploy. The legacy datastore
was never modified; the service switches back instantly.
