---
name: seerr-migration
description: Use ONLY when creating or updating TypeORM database migrations for Seerr. Covers the dual SQLite+Postgres migration requirement, migration naming conventions, how to auto-generate vs. hand-write them, and the recommended workflow from CONTRIBUTING.md.
---

# Seerr Database Migrations

## Critical rule

**Every migration must be created twice** — once for SQLite and once for Postgres. Never create only one.

```
server/migration/
  sqlite/     ← SQLite-specific DDL (integer PRIMARY KEY AUTOINCREMENT, datetime, etc.)
  postgres/   ← Postgres-specific DDL (SERIAL, TIMESTAMP, etc.)
```

Both files share the same timestamp prefix (e.g., `1779514079354-AddRemoteLibraries.ts`).

## Naming

Migrations are named with a Unix millisecond timestamp prefix:

```
<TimestampMs>-<PascalCaseDescription>.ts
```

Generate the timestamp:
```bash
node -e "console.log(Date.now())"
```

## SQLite DDL conventions

- Primary key: `integer PRIMARY KEY AUTOINCREMENT NOT NULL`
- Booleans: `boolean NOT NULL DEFAULT (0)` or `boolean NOT NULL DEFAULT (1)`
- Timestamps: `datetime NOT NULL DEFAULT (datetime('now'))`
- Unique constraints: embedded in CREATE TABLE with `CONSTRAINT "..." UNIQUE (...)`
- Foreign keys: embedded in CREATE TABLE with `CONSTRAINT "..." FOREIGN KEY (...) REFERENCES ...`
- Indexes: separate `CREATE INDEX "..." ON "..." ("col")` statements

## Postgres DDL conventions

- Primary key: `SERIAL NOT NULL` with separate `CONSTRAINT "PK_..." PRIMARY KEY ("id")`
- Booleans: `boolean NOT NULL DEFAULT false` / `boolean NOT NULL DEFAULT true`
- Timestamps: `TIMESTAMP NOT NULL DEFAULT now()`
- Timestamps with timezone: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
- Foreign keys: added via `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ...` after the CREATE TABLE
- Indexes: separate `CREATE INDEX "..." ON "..." ("col")` statements

## Migration file structure

```typescript
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSomething1234567890123 implements MigrationInterface {
  name = 'AddSomething1234567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // CREATE TABLE, CREATE INDEX, ALTER TABLE
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // DROP in reverse order of up()
  }
}
```

## Auto-generation vs hand-writing

Use `pnpm migration:generate` to let TypeORM auto-detect entity changes and generate the SQL. Then manually inspect and fix the output — the generator often needs manual corrections for index renaming or constraint changes.

**Postgres** auto-generation:
```bash
DB_TYPE="postgres" DB_USER=postgres DB_PASS=postgres pnpm migration:generate server/migration/postgres/<Name>
```

**SQLite** auto-generation:
```bash
pnpm migration:generate server/migration/sqlite/<Name>
```

For simple new tables (like adding an entity), hand-writing both migrations following the conventions above is faster and less error-prone.

## Running migrations

```bash
pnpm migration:run          # SQLite default
DB_TYPE=postgres DB_USER=... DB_PASS=... pnpm migration:run
```

In production, migrations run automatically on startup. In development, `synchronize: true` handles schema sync without migrations.

## When adding a new entity

1. Create the entity file in `server/entity/`
2. Add any new relationships to existing entities (e.g., `@OneToMany`)
3. Create both SQLite and Postgres migration files
4. Run migrations to verify

## Foreign key indexes

Postgres does not auto-index foreign key columns. Always create explicit indexes on FK columns in Postgres migrations. SQLite indexes FK columns automatically.
