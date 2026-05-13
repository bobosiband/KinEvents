# Deploying Backend and Running Integration Tests

Local quick deploy (requires AWS CLI configured or .env with creds):

```bash
cd BackEnd
./scripts/deploy_staging.sh
```

Run integration tests against a deployed API:

```bash
cd BackEnd
export API_BASE_URL=https://your-deployed-api.example.com
./scripts/run_integration_tests.sh
```

CI: A GitHub Actions workflow `.github/workflows/backend-deploy-and-integration.yml` is included. Add the following repository secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `DEPLOYED_API_URL` (used by integration test job)
- `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` (if running real-user tests)
