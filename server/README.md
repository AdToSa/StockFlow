# StockFlow Server

NestJS backend for the StockFlow multi-tenant inventory and invoicing platform.

For complete documentation, see the main [README](../README.md).

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server (port 3000)
npm run start:dev
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Development server with hot reload |
| `npm run build` | Compile TypeScript to dist/ |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Generate test coverage report |
| `npm run test:cov:watch` | Coverage report with watch mode |
| `npm run test:cov:open` | Generate and open HTML coverage report |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |
| `npm run prisma:studio` | Open Prisma Studio |

## Test Coverage

### Running Coverage Reports

```bash
# Generate coverage report (terminal output)
npm run test:cov

# Generate coverage and open HTML report in browser
npm run test:cov:open

# Run coverage in watch mode during development
npm run test:cov:watch
```

### Viewing Coverage Reports

After running `npm run test:cov`, reports are generated in the `coverage/` directory:

| Report | Location | Description |
|--------|----------|-------------|
| Terminal | stdout | Line-by-line coverage displayed in terminal |
| HTML | `coverage/index.html` | Interactive browser report |
| LCOV | `coverage/lcov.info` | For CI/CD integration (Codecov, SonarQube) |
| JSON | `coverage/coverage-final.json` | Programmatic access |

To view the HTML report manually:
```bash
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

### Coverage Thresholds

The project enforces minimum coverage thresholds:

| Scope | Branches | Functions | Lines | Statements |
|-------|----------|-----------|-------|------------|
| Global | 80% | 80% | 80% | 80% |
| Auth module | 85% | 85% | 85% | 85% |
| Users module | 85% | 85% | 85% | 85% |
| Tenants module | 85% | 85% | 85% | 85% |

Tests will fail if coverage drops below these thresholds.

### What's Covered

Coverage is collected for:
- Services (`*.service.ts`)
- Controllers (`*.controller.ts`)
- Guards (`*.guard.ts`)
- Strategies (`*.strategy.ts`)
- Interceptors (`*.interceptor.ts`)
- Filters (`*.filter.ts`)
- Middleware (`*.middleware.ts`)
- Pipes (`*.pipe.ts`)

Excluded from coverage:
- Module definitions (`*.module.ts`)
- Entry point (`main.ts`)
- Interfaces (`*.interface.ts`)
- Enums (`*.enum.ts`)
- DTOs (`*.dto.ts`)
- Entities (`*.entity.ts`)

## Directory Structure

```
src/
├── auth/           # Authentication module (JWT, guards, strategies)
├── common/         # Shared utilities (decorators, filters, guards, pipes)
├── config/         # Environment configuration
├── prisma/         # Database service and multi-tenant helpers
├── app.module.ts   # Root application module
└── main.ts         # Application entry point

prisma/
├── schema.prisma   # Database schema
├── migrations/     # Database migrations
└── seed.ts         # Seed script

test/
└── *.e2e-spec.ts   # End-to-end tests
```

## Environment Variables

See `.env.example` for required configuration. Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for signing access tokens
- `JWT_REFRESH_SECRET` - Secret for signing refresh tokens
- `PORT` - Server port (default: 3000)