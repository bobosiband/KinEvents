# KinEvents Code Style

All new or touched code in this repo follows these rules. Older code is migrated opportunistically as it is touched — do not rewrite untouched code for style alone.

## 1. Principles

- **SOLID.** One responsibility per class. Depend on interfaces, not concretions.
- **Java-style OOP in TypeScript.** Classes, interfaces, abstract base classes, constructor-injected dependencies.
- **Thin handlers → services → repositories.** Lambda / Express handlers only translate HTTP ↔ domain and delegate to a service. Services hold business rules. Repositories hold persistence.
- **Open/closed via subclasses.** Prefer adding a new subclass (e.g. a new `ScheduledJob`, `EmailTemplate`, `PermissionPolicy`, `OccasionType`) over editing a switch statement.
- **No fallbacks or compatibility shims** unless there is a live migration in progress. Delete dead code.

## 2. Naming

| Kind                                   | Case                               | Example                                            |
| -------------------------------------- | ---------------------------------- | -------------------------------------------------- |
| Classes                                | `PascalCase`                       | `EmailService`, `BirthdayEventJob`                 |
| Interfaces                             | `IPascalCase`                      | `IEmailSender`, `IUserRepository`                  |
| Enums + members                        | `PascalCase`                       | `UserRole.Admin`                                   |
| Class file names                       | `PascalCase.ts`                    | `EmailService.ts`, `UserRepository.ts`             |
| Variables / parameters / properties    | `camelCase`                        | `recipientEmail`, `maxRetries`                     |
| Methods / functions                    | `camelCase`                        | `sendEmail()`, `findActiveUsers()`                 |
| Constants (class-level)                | `static readonly PascalCase`       | `EmailConfig.MaxRetries = 3`                       |
| DB fields                              | `camelCase`                        | `createdAt`, `deletedAt`, `giftPoolId`             |
| Environment variable keys (in `.env`)  | `UPPER_SNAKE_CASE`                 | `GMAIL_USER`, `MONGODB_URI`                        |

**`snake_case` and `SCREAMING_SNAKE_CASE` are not permitted anywhere in TypeScript code.** The only exception is `.env` / AWS environment-variable keys, which are read exactly once inside `AppConfig` and re-exposed as `camelCase` getters.

```ts
// src/config/AppConfig.ts
export class AppConfig {
  public static readonly gmailUser: string = process.env.GMAIL_USER ?? ''
  public static readonly maxRetries: number = Number(process.env.EMAIL_MAX_RETRIES ?? 3)
}
```

## 3. TypeScript

- **No `any`.** Use `unknown` and narrow. Use generics.
- **Explicit return types on public methods and exported functions.** Inferred is fine for local helpers and arrow callbacks.
- **Explicit access modifiers** on class members: `public`, `protected`, `private`. Prefer `private` by default.
- **`readonly`** on every property that is not reassigned after the constructor. On method signatures, `readonly` arrays and tuples by default.
- **`strict: true`** in `tsconfig.json`. No `// @ts-ignore`; use `// @ts-expect-error <reason>` and fix soon.
- **Enums** for small closed sets of string constants. No string unions for role / status types.
- **Zod** at the boundary (request body, env parsing). Infer the TS type from the schema; do not duplicate it.

## 4. Class shape

```ts
export interface IEmailSender {
  send(message: EmailMessage): Promise<EmailResult>
}

export class EmailService implements IEmailSender {
  private static readonly MaxRetries: number = 3

  public constructor(
    private readonly transport: INodemailerTransport,
    private readonly logger: ILogger,
  ) {}

  public async send(message: EmailMessage): Promise<EmailResult> {
    // ...
  }

  private async sendWithRetry(message: EmailMessage, attempt: number): Promise<EmailResult> {
    // ...
  }
}
```

- Dependencies come through the constructor and are `private readonly`.
- No `new X()` inside business classes — compose at the edge (handler / `main`).
- One public class per file. Name the file after the class.

## 5. Layering

```
Handler (api/**/index.ts)
  └─ parses + validates HTTP, injects request context
     └─ Service (src/services/*.ts)
        └─ pure business rules, no HTTP, no raw Mongo
           └─ Repository (src/repositories/*.ts)
              └─ wraps MongoDB collection, extends BaseRepository<T>
```

A handler must not import `mongodb` or `nodemailer`. A service must not import `express`. A repository must not contain business logic beyond "query / write this shape".

## 6. Repositories

Every entity has its own repository class extending `BaseRepository<T>`. `BaseRepository`:

- Takes a `Collection<T>` through its constructor.
- Exposes `findById`, `findOne`, `findMany`, `insertOne`, `updateOne`, `softDelete`, `restore`.
- Applies `{ deletedAt: null }` to every read by default; callers must opt in to include soft-deleted rows.
- Uses targeted `$set` / `$push` / `$inc`. **Never** `replaceOne` the whole document.

## 7. Errors

- Throw `DomainError` subclasses (`ValidationError`, `NotFoundError`, `ForbiddenError`, `ConflictError`, `RateLimitError`) — never raw `Error`.
- A single middleware maps `DomainError` subclasses to HTTP responses. Handlers do not build error JSON by hand.
- Do not swallow errors. If an error can be ignored, assert that in a one-line comment with the reason.

## 8. Tests

- Jest, `*.test.ts` next-to or under `tests/`.
- Use `jest.useFakeTimers({ doNotFake: ['nextTick'] })` and `jest.setSystemTime(...)` for any date-dependent test. **No hardcoded calendar years.** Dates are computed relative to the fake "now".
- Repositories are integration-tested against a real Mongo (via `mongodb-memory-server` or the deployed dev DB). Services are unit-tested with repository interfaces mocked.
- Each new public class ships with a test.

## 9. Comments

Default: **no comments**. Only add one when the *why* is non-obvious: a hidden constraint, a subtle invariant, a known workaround. Don't comment *what* the code does — well-named identifiers already do that.

## 10. Imports

- Use the `@/` alias (frontend) or relative paths that do not climb more than two levels (backend). No deep `../../../` chains.
- Order: node builtins → external packages → `@/…` / repo packages → relative. One blank line between groups.
- No default exports in library code. Default exports are allowed for route handler files that a framework imports by path.

## 11. Git and commits

- Branch per fix: `bongani/<short-kebab>`.
- Conventional commits (`fix:`, `feat:`, `refactor:`, `chore:`, `docs:`, `test:`). Small, focused.
- One logical change per PR. Squash-merge to `main`.
- No AI attribution anywhere.
