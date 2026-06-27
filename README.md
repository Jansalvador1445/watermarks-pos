# H2O Water Refilling Management System

Production-ready Admin Dashboard for water refilling businesses.

## Tech Stack

**Frontend (`web/`)**: React 19, Vite, TypeScript, Ant Design, TanStack Query, Zustand, Recharts, React Hook Form, Framer Motion

**Backend (`backend/`)**: Node.js, Express, MongoDB, Mongoose, JWT (HttpOnly cookies), Socket.io, Winston, Node Cron

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 7+

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed    # Creates admin user
npm run dev     # http://localhost:5000
```

**Default Admin**: `admin@h2o.com` / `Admin@123`

### Frontend

```bash
cd web
cp .env.example .env
npm install
npm run dev     # http://localhost:5173
```

### Docker

```bash
# Set secrets in .env at root
JWT_ACCESS_SECRET=your-32-char-access-secret-here
JWT_REFRESH_SECRET=your-32-char-refresh-secret-here

docker-compose up -d
```

## Project Structure

```
WaterMarks/
├── web/                 # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── features/    # Module pages
│   │   ├── layouts/     # App & Auth layouts
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API layer
│   │   └── store/       # Zustand stores
│   └── Dockerfile
├── backend/             # Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   └── socket/
│   └── Dockerfile
└── docker-compose.yml
```

## Features

- Dashboard with real-time stats, charts, and analytics
- Customer CRUD with CSV import
- Delivery management with calendar view
- POS Sales system
- Transaction tracking with print/export
- Water gallon inventory tracking
- Inventory management
- Reports with CSV export
- User management with RBAC
- Real-time notifications (Socket.io)
- Activity logs & audit trail
- Backup & restore
- System settings

## API Endpoints

| Module | Base Path |
|--------|-----------|
| Auth | `/api/auth` |
| Dashboard | `/api/dashboard` |
| Customers | `/api/customers` |
| Deliveries | `/api/deliveries` |
| Transactions | `/api/transactions` |
| Gallons | `/api/gallons` |
| Inventory | `/api/inventory` |
| Reports | `/api/reports` |
| Users | `/api/users` |
| Notifications | `/api/notifications` |
| Logs | `/api/logs` |
| Backups | `/api/backups` |
| Settings | `/api/settings` |

## Roles

| Role | Permissions |
|------|-------------|
| Admin | Full access |
| Cashier | Dashboard, Customers (read), Transactions, POS |
| Delivery Staff | Dashboard, Customers (read), Deliveries, Gallons |

## Production Deployment

```bash
# Backend with PM2
cd backend && npm run build
pm2 start ecosystem.config.js

# Frontend build
cd web && npm run build
# Serve dist/ with Nginx (see web/nginx.conf)
```
