# Database Migration Guide

This project exclusively uses **Prisma** for all database access and schema management.

## Overview

**Prisma** is the single source of truth for:
- All application models (User, InsurancePolicy, Claim, InsurancePool, Project, Notification, etc.)
- Schema definition via `prisma/schema.prisma`
- Schema migrations via `prisma/migrations/`

## Prisma Migrations

### Baseline

The project now includes an initial baseline migration in `prisma/migrations/00000000000000_init/`.
Committed migration directories are the single source of truth for Prisma schema changes.

### Development

Create a new migration:
```bash
npm run prisma:migrate:generate -- add_user_email
```

This will:
1. Detect changes in `prisma/schema.prisma`
2. Generate SQL migration file in `prisma/migrations/`
3. Apply migration to your local database

Reset database (WARNING: Deletes all data):
```bash
npm run prisma:migrate:reset
```

Open Prisma Studio to view/edit data:
```bash
npm run prisma:studio
```

### Production

Deploy pending migrations:
```bash
npm run prisma:migrate:deploy
```

This applies migrations without modifying the migration history.

## Migration Workflow

### Making Schema Changes

1. **Update schema file**:
   - Edit `prisma/schema.prisma` with your model changes

2. **Generate migration**:
   ```bash
   npm run prisma:migrate:generate -- describe_change
   ```

3. **Review generated SQL**:
   - Check `prisma/migrations/[timestamp]_describe_change/migration.sql`

4. **Test locally**:
   ```bash
   npm run prisma:migrate:dev
   ```

5. **Commit migration files**:
   ```bash
   git add prisma/migrations/
   git commit -m "feat: add database migration for feature X"
   ```

6. **Deploy to production**:
   ```bash
   npm run prisma:migrate:deploy
   ```

### Best Practices

1. **Always review migrations before applying** - Especially in production
2. **Never edit migration files** after they've been applied
3. **Test migrations on a staging database** before production
4. **Backup database** before running production migrations
5. **Use descriptive names** for migrations (e.g., `add_user_email`, not `update`)
6. **One logical change per migration** - Don't bundle unrelated changes
7. **Test rollbacks** - Ensure `npm run prisma:migrate:resolve` works correctly
8. **Monitor migration logs** - Watch for errors or warnings

### Handling Migration Conflicts

When multiple developers create migrations:

1. Pull latest changes
2. Run existing migrations: `npm run db:migrate:dev`
3. Generate your migration
4. Test the complete migration chain
5. Commit and push

### Emergency Rollback

If a migration causes issues:

Prisma does not support automatic rollback. You must:
1. Manually write a reverse migration SQL
2. Apply it using `prisma db execute`
3. Or restore from a backup

### Important Notes

- **NEVER** use `prisma db push` in production - it doesn't create migration files
- **ALWAYS** commit migration files to version control
- **ALWAYS** test migrations with production-like data volumes
- **ALWAYS** backup production database before migrations

## Troubleshooting

### Migration fails halfway through
- Prisma migrations are atomic
- Database should rollback automatically
- Check logs for specific error

### "Migration already applied" error
- Migration history is out of sync
- Run `prisma migrate resolve --applied [migration_name]`
- Check `_prisma_migrations` table for history

### Schema doesn't match database
- Generate new migration to sync: `npm run prisma:migrate:generate -- sync_schema`
- Or reset database (dev only): `npm run prisma:migrate:reset`

## Environment Variables

Required for migrations:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/stellar_insured
```

For production, ensure:
- Database user has ALTER TABLE permissions
- Connection pool is configured correctly
- SSL is enabled if required
