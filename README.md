# StockFlow

<div align="center">

![StockFlow](https://img.shields.io/badge/StockFlow-Inventory%20%26%20Invoicing-blue?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma&logoColor=white)
![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)

**A modern, multi-tenant SaaS platform for inventory management and electronic invoicing.**

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Architecture](#architecture) • [API Reference](#api-reference) • [Contributing](#contributing)

</div>

---

## Overview

StockFlow is a comprehensive full-stack solution designed for businesses that need robust inventory management combined with electronic invoicing capabilities. Built with a multi-tenant architecture, it enables multiple organizations to operate independently on a single platform while maintaining complete data isolation and security.

### Key Highlights

- **Multi-Tenant Architecture**: Complete data isolation between organizations with tenant-scoped operations
- **Role-Based Access Control**: Four-tier permission system (Super Admin, Admin, Manager, Employee)
- **Real-Time Inventory**: Track stock across multiple warehouses with movement history
- **Electronic Invoicing**: DIAN-compatible invoicing system for Colombian businesses
- **Subscription Management**: Flexible plans with configurable usage limits
- **Modern Stack**: Built with the latest versions of NestJS, React, and PostgreSQL

---

## Features

### Inventory Management
- **Product Catalog**: Complete product management with SKU, barcode, pricing, and tax configuration
- **Category Organization**: Hierarchical product categorization with custom colors
- **Multi-Warehouse Support**: Manage inventory across multiple storage locations
- **Stock Movements**: Full traceability of inventory changes (purchases, sales, transfers, adjustments)
- **Low Stock Alerts**: Automated alerts when products fall below minimum thresholds
- **Batch Operations**: Bulk import/export and mass updates

### Invoicing & Billing
- **Invoice Generation**: Create professional invoices with automatic numbering
- **Multiple Payment Methods**: Cash, credit/debit cards, bank transfers, PSE, Nequi, Daviplata
- **Payment Tracking**: Partial payments and payment history
- **Invoice Status Management**: Draft, pending, sent, paid, overdue, cancelled states
- **DIAN Integration**: Colombian electronic invoicing compliance (CUFE, XML, PDF)

### Customer Management
- **Customer Registry**: Complete customer database with contact information
- **Document Types**: Support for CC, NIT, and other identification types
- **Purchase History**: Track customer transactions and preferences
- **Business Customers**: Support for B2B with tax ID and business name

### Multi-Tenancy
- **Organization Isolation**: Complete data separation between tenants
- **Subscription Plans**: FREE, BASIC, PRO, and ENTERPRISE tiers
- **Usage Limits**: Configurable limits for users, products, warehouses, and invoices
- **Stripe Integration**: Subscription billing and payment processing

### Security & Access Control
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Role-Based Permissions**: Granular access control based on user roles
- **Password Security**: Bcrypt hashing with configurable salt rounds
- **Session Management**: Token expiration and renewal mechanisms

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI Framework |
| React Router | 7.x | Full-stack routing with SSR |
| Vite | 7.x | Build tool and dev server |
| TailwindCSS | 4.x | Utility-first CSS framework |
| TypeScript | 5.x | Static typing |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 11.x | Progressive Node.js framework |
| Express | 5.x | HTTP server |
| Prisma | 7.x | ORM and database toolkit |
| PostgreSQL | 16.x | Relational database |
| Jest | 30.x | Testing framework |
| TypeScript | 5.x | Static typing |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| GitHub Actions | CI/CD pipelines |
| Stripe | Payment processing |

---

## Getting Started

### Prerequisites

- **Node.js** >= 20.x
- **npm** >= 10.x
- **PostgreSQL** >= 16.x
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DanielEsLoH/StockFlow.git
   cd StockFlow
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Server configuration
   cd server
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stockflow_dev?schema=public"

   # JWT Configuration
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   JWT_EXPIRATION="7d"

   # Application
   NODE_ENV=development
   PORT=3000

   # Optional: Query Logging
   PRISMA_QUERY_LOGGING=true
   PRISMA_SLOW_QUERY_THRESHOLD=1000
   ```

4. **Set up the database**
   ```bash
   cd server

   # Generate Prisma Client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate

   # Seed with test data (optional)
   npm run prisma:seed
   ```

5. **Start the development servers**
   ```bash
   # Terminal 1: Start backend
   cd server
   npm run start:dev

   # Terminal 2: Start frontend
   cd client
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Prisma Studio: `npm run prisma:studio` (http://localhost:5555)

---

## Project Structure

```
StockFlow/
├── client/                      # React Frontend
│   ├── app/
│   │   ├── routes/             # Page components
│   │   ├── routes.ts           # Route definitions
│   │   └── root.tsx            # Root layout
│   ├── public/                 # Static assets
│   └── package.json
│
├── server/                      # NestJS Backend
│   ├── src/
│   │   ├── common/
│   │   │   └── filters/        # Exception filters
│   │   ├── prisma/             # Database service
│   │   ├── app.module.ts       # Root module
│   │   └── main.ts             # Entry point
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   ├── migrations/         # Database migrations
│   │   └── seed.ts             # Seed script
│   ├── test/                   # E2E tests
│   └── package.json
│
├── .github/                     # GitHub configuration
├── LICENSE                      # Proprietary license
└── README.md                    # This file
```

---

## Architecture

### Database Schema

StockFlow uses a multi-tenant PostgreSQL database with 11 core models:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Tenant    │────<│    User     │     │  Category   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Warehouse  │────<│   Product   │>────│ InvoiceItem │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Warehouse   │     │    Stock    │     │   Invoice   │
│   Stock     │     │  Movement   │     └─────────────┘
└─────────────┘     └─────────────┘            │
                                               │
                    ┌─────────────┐            ▼
                    │  Customer   │>────┌─────────────┐
                    └─────────────┘     │   Payment   │
                                        └─────────────┘
```

### Multi-Tenancy Model

All business entities are scoped to a tenant through a `tenantId` foreign key, ensuring complete data isolation:

- **Shared Database, Shared Schema**: All tenants share the same database and schema
- **Row-Level Isolation**: Data is filtered by `tenantId` in all queries
- **Tenant-Scoped Uniqueness**: Unique constraints are compound (e.g., SKU is unique per tenant)

### Error Handling

The application implements a layered exception handling strategy:

1. **HttpExceptionFilter**: Handles standard NestJS HTTP exceptions
2. **PrismaExceptionFilter**: Maps Prisma database errors to HTTP responses
3. **AllExceptionsFilter**: Catch-all for unhandled exceptions

All errors return a consistent JSON format:
```json
{
  "statusCode": 400,
  "message": "Descriptive error message",
  "error": "Bad Request",
  "timestamp": "2025-01-07T10:30:00.000Z",
  "path": "/api/resource"
}
```

---

## Available Commands

### Server Commands
```bash
# Development
npm run start:dev       # Start with hot reload
npm run start:debug     # Start in debug mode

# Production
npm run build           # Compile TypeScript
npm run start:prod      # Run production build

# Testing
npm run test            # Run unit tests
npm run test:watch      # Watch mode
npm run test:cov        # Coverage report
npm run test:e2e        # End-to-end tests

# Code Quality
npm run lint            # Run ESLint
npm run format          # Run Prettier

# Database
npm run prisma:generate # Generate Prisma Client
npm run prisma:migrate  # Run migrations
npm run prisma:studio   # Open Prisma Studio
npm run prisma:seed     # Seed database
npm run prisma:reset    # Reset database
```

### Client Commands
```bash
npm run dev             # Development server (port 5173)
npm run build           # Production build
npm run start           # Serve production build
npm run typecheck       # Type checking
```

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Authenticate user |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate tokens |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List users |
| GET | `/users/:id` | Get user by ID |
| POST | `/users` | Create user |
| PATCH | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List products |
| GET | `/products/:id` | Get product by ID |
| GET | `/products/low-stock` | Get low stock products |
| POST | `/products` | Create product |
| PATCH | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/invoices` | List invoices |
| GET | `/invoices/:id` | Get invoice by ID |
| POST | `/invoices` | Create invoice |
| PATCH | `/invoices/:id` | Update invoice |
| PATCH | `/invoices/:id/send` | Send invoice |
| GET | `/invoices/:id/pdf` | Generate PDF |

### Warehouses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/warehouses` | List warehouses |
| GET | `/warehouses/:id` | Get warehouse by ID |
| POST | `/warehouses` | Create warehouse |
| POST | `/warehouses/transfer` | Transfer stock |

*Full API documentation available at `/api/docs` when running in development mode.*

---

## Testing

### Running Tests
```bash
cd server

# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e

# Specific test file
npx jest path/to/file.spec.ts
```

### Test Coverage Goals
- Unit Tests: > 80% coverage
- E2E Tests: Critical user flows
- Integration Tests: API endpoints

---

## Deployment

### Environment Variables for Production

```env
# Required
DATABASE_URL="postgresql://user:pass@host:5432/stockflow_prod"
JWT_SECRET="production-secret-key-min-32-chars"
JWT_REFRESH_SECRET="production-refresh-secret-key"
NODE_ENV=production

# Optional
PORT=3000
FRONTEND_URL=https://app.stockflow.com
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

---

## Contributing

This is a proprietary project. Contributions are limited to authorized team members only.

### Development Workflow

1. Create a feature branch from `main`
2. Implement changes following code standards
3. Write tests for new functionality
4. Submit a pull request for review
5. Merge after approval

### Code Standards

- Follow NestJS and React best practices
- Maintain TypeScript strict mode compliance
- Write unit tests for services
- Use conventional commits
- Document public APIs

---

## License

This project is proprietary software. See the [LICENSE](LICENSE) file for details.

**Copyright (c) 2025 Daniel Esteban Londoño. All rights reserved.**

Unauthorized copying, modification, distribution, or use of this software is strictly prohibited without explicit written permission from the copyright holder.

---

## Support

For support, questions, or feature requests:

- **Repository**: [github.com/DanielEsLoH/StockFlow](https://github.com/DanielEsLoH/StockFlow)
- **Issues**: [GitHub Issues](https://github.com/DanielEsLoH/StockFlow/issues)

---

<div align="center">

**Built with modern technologies for modern businesses.**

</div>