# Resolved: ORM Architecture

## Summary

✅ **This repository now exclusively uses Prisma** for all database access.

TypeORM and @nestjs/typeorm have been removed from the codebase. All services—including insurance, user management, indexing, notifications, and reputation—now use Prisma exclusively.

## Architecture Decision

**Prisma is the single source of truth** for database access across the entire application:
- Schema management via `prisma/schema.prisma`
- Migrations via `prisma/migrations/`
- All services use `PrismaService` injected from `DatabaseModule`

## Benefits

- ✅ Consistent data access patterns
- ✅ Simplified onboarding and maintenance
- ✅ Unified transaction and schema management
- ✅ Eliminated ORM conflict risk
- ✅ Single migration toolchain

## References

- **Database Configuration**: See [src/prisma.service.ts](src/prisma.service.ts)
- **Schema**: See [prisma/schema.prisma](prisma/schema.prisma)
- **Migrations**: See [prisma/migrations/](prisma/migrations/)
- **Migration Guide**: See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
