# Smart Inventory Management System – Project Blueprint

## 1) Overview
A full‑stack inventory platform to help SMEs track stock in real time, process scans for in/out movements, and proactively restock using basic demand forecasting. Includes role-based access, reporting dashboards, and Google Sheets export for finance/ops.

Key goals
- Improve stock accuracy to >98%
- Reduce stockouts by >30% via alerts and predictive ordering
- Decrease manual reconciliation time by >50%

Primary users
- Admin: Manages users, system settings, suppliers, reports
- Inventory Manager: Oversees catalog, purchase orders, thresholds, audits
- Warehouse/Store Staff: Scans items in/out, views counts and alerts

Success criteria
- End-to-end item lifecycle supported (create, stock in, stock out, adjust)
- Auditability of every movement (who, what, when, where)
- Dashboards with KPIs and exportable reports
- Google Sheets sync for summary reports

---

## 2) Feature Set

MVP (Phase 1)
- User authentication: JWT-based login, role-based authorization (Admin, Manager, Staff)
- Product catalog: CRUD with SKU, name, category, price, barcode, min/max levels, supplier
- Stock movements: Inbound, outbound, adjustments with reasons; barcode scan for item lookup
- Alerts: Low-stock thresholds; configurable per item/category
- Basic reports: Current stock, low-stock list, daily movement log
- Google Sheets export: On-demand export of summary reports
- Audit log: Who did what, when

Phase 2 (V1)
- Predictive analytics: Simple moving average and exponential smoothing; reorder point suggestions
- Purchase orders: Create/approve/receive against POs; partial receipts
- Locations/bins: Optional multi-location stock (e.g., warehouse, store)
- Label printing: Barcode/QR labels for new SKUs
- Dashboard: KPIs (Inventory value, turns, stockout risk), charts (trendlines, ABC analysis)

Phase 3 (Nice-to-have)
- Cycle counts and discrepancy workflows
- Supplier performance metrics (lead time variance, fill rate)
- Batch/lot and expiry tracking
- Mobile-friendly PWA, offline capture + sync
- Webhooks and 3rd‑party integrations (ERP, e‑commerce)

---

## 3) Technology Stack
- Frontend: React + TypeScript, Vite or CRA, React Query, React Router, Component library (MUI or AntD)
- Backend: Node.js + TypeScript, Express.js, Mongoose
- Database: MongoDB
- Auth: JWT (access + refresh), bcrypt password hashing
- Barcode scanning: Browser-based (QuaggaJS or @zxing/library); optional support for handheld scanners
- Reporting/Charts: Chart.js or Recharts
- Export: Google Sheets API (service account) + CSV
- Testing: Jest (unit), Supertest (API), Playwright/Cypress (E2E)
- Tooling: ESLint, Prettier, Husky + lint-staged
- Packaging/Deploy: Docker, docker-compose

---

## 4) System Architecture

High-level
- React UI communicates with Express API over HTTPS (REST JSON)
- Express uses Mongoose to persist to MongoDB
- Background jobs (Node cron) compute forecasts and send alerts
- Google Sheets integration writes summary sheets via service account

ASCII Diagram

[ React (web) ]
      |
      v
[ Express API ] <---> [ MongoDB ]
      |
      +--> [ Job Scheduler (Forecasts/Alerts) ]
      |
      +--> [ Google Sheets API ]

---

## 5) Data Model (MongoDB Collections)

users
- _id (ObjectId)
- email (unique)
- passwordHash
- role: 'admin' | 'manager' | 'staff'
- name
- active: boolean
- createdAt, updatedAt
Indexes: email unique

products
- _id, sku (unique), name, description
- category, brand
- price, cost
- barcode (EAN/UPC/QR)
- minLevel, maxLevel, reorderQty (optional)
- supplierId (ref suppliers)
- uom: Unit of measure (e.g., pcs)
- isActive: boolean
- createdAt, updatedAt
Indexes: sku unique, barcode, category

stockLevels
- _id, productId (ref products)
- locationId (optional ref locations)
- quantity (number)
- updatedAt
Compound index: productId + locationId unique

inventoryTransactions
- _id
- productId (ref products)
- type: 'IN' | 'OUT' | 'ADJUST'
- quantity (signed for ADJUST or include reason)
- reason: 'RECEIVE' | 'SALE' | 'RETURN' | 'DAMAGE' | 'COUNT' | 'MANUAL'
- reference: string (PO#, SO#, etc.)
- locationId (optional)
- userId (ref users)
- unitCost (optional), unitPrice (optional)
- createdAt
Indexes: productId, type, createdAt

suppliers
- _id, name, email, phone, leadTimeDays, minOrderQty, address
- notes, active
Index: name

purchaseOrders
- _id, supplierId, status: 'DRAFT' | 'APPROVED' | 'SENT' | 'RECEIVED' | 'CLOSED'
- items: [{ productId, orderedQty, receivedQty, unitCost }]
- expectedDate, createdBy, approvedBy
- createdAt, updatedAt
Index: supplierId, status

alerts
- _id, productId, type: 'LOW_STOCK' | 'STOCKOUT_RISK'
- message, acknowledged: boolean, createdAt, acknowledgedBy
Index: productId, type

locations (optional Phase 2)
- _id, name, code, address, active

auditLogs
- _id, userId, action, entityType, entityId, metadata, createdAt
Index: userId, createdAt

---

## 6) Role-Based Access Control (RBAC)
- admin: all permissions
- manager: products CRUD, stock adjustments, POs, reports, thresholds, view users
- staff: scan in/out, view products/stock, view alerts

Enforcement points
- Backend middleware to require role for each endpoint
- UI hides/guards actions based on user role

---

## 7) API Design (REST)
Base URL: /api

Auth
- POST /api/auth/login { email, password } -> { accessToken, refreshToken, user }
- POST /api/auth/refresh { refreshToken } -> { accessToken }
- POST /api/auth/logout

Users
- GET /api/users (admin)
- POST /api/users (admin)
- PATCH /api/users/:id (admin)
- DELETE /api/users/:id (admin)

Products
- GET /api/products?search=&category=&active=
- GET /api/products/:id
- POST /api/products (manager/admin)
- PATCH /api/products/:id (manager/admin)
- DELETE /api/products/:id (admin)
- POST /api/products/:id/print-label (manager/admin)

Stock
- GET /api/stock?productId=&locationId=
- POST /api/stock/in (manager/staff) { productId, quantity, reference, locationId }
- POST /api/stock/out (manager/staff) { productId, quantity, reference, locationId }
- POST /api/stock/adjust (manager) { productId, quantity, reason, locationId }
- GET /api/transactions?productId=&type=&from=&to=

Alerts
- GET /api/alerts
- POST /api/alerts/:id/ack (manager/staff)

Purchase Orders (Phase 2)
- GET /api/pos
- POST /api/pos
- GET /api/pos/:id
- PATCH /api/pos/:id
- POST /api/pos/:id/receive

Reports
- GET /api/reports/stock-summary
- GET /api/reports/low-stock
- GET /api/reports/movements?from=&to=
- GET /api/reports/valuation (uses unitCost)

Google Sheets
- POST /api/integrations/sheets/export { reportType, params }

Errors
- Consistent error shape: { error: { code, message, details? } }

---

## 8) Predictive Analytics (Phase 2)
Demand forecasting (per product)
- Simple Moving Average (SMA): SMA_n = avg(last n daily demand)
- Exponential Smoothing: F_t = α D_{t-1} + (1-α) F_{t-1}

Reorder point (ROP)
- ROP = dL + z * σL
  - d = average daily demand (from forecasts)
  - L = lead time in days (supplier.leadTimeDays)
  - σL = std dev of demand during lead time
  - z = service level factor (e.g., 1.65 for 95%)

Suggested order quantity
- If currentOnHand + onOrder < ROP -> suggest Max(reorderQty, d * (L + safetyDays))

Implementation notes
- Nightly job computes forecast per active SKU from transactions
- Store forecast results in collection forecasts: { productId, method, params, d, sigma, rop, updatedAt }
- Show in UI and create alerts for stockout risk

---

## 9) Barcode Scanning & Labels
- In-browser scanning via QuaggaJS or @zxing/library using device camera
- Support hardware scanners (act as keyboard) with input focus
- Label printing: Generate barcode images (JsBarcode) and print via browser; optional ZPL output for label printers
- Data: barcode stored on product; fallback search by SKU/name

---

## 10) Reporting & Dashboard
KPIs
- Inventory valuation = Σ(onHand × cost)
- Inventory turnover = COGS / avg inventory
- Low-stock items count
- Stockout risk items

Dashboards
- Time-series demand per SKU
- Top movers, ABC classification (Pareto)
- Movements heatmap (by reason)
- Filters by date range, category, location

Exports
- CSV download
- Google Sheets export using service account

---

## 11) Security & Compliance
- Store bcrypt password hashes (salted), never plaintext
- JWT access tokens short-lived; refresh tokens rotate; blacklist on logout
- Rate limiting + IP throttling on auth and write endpoints
- Input validation with Zod/Yup/Joi; sanitize all user inputs
- CORS restricted to known origins
- Principle of least privilege (RBAC)
- Audit log for critical actions, immutable append-only semantics
- Backups: daily Mongo dumps; retention policy

---

## 12) Non-Functional Requirements
- Performance: p95 < 300ms for GETs, < 600ms for writes at 100 rps (MVP scale)
- Availability: 99.9% (target), graceful degradation
- Observability: Request logging (Morgan), app logs (Winston), health checks /api/health
- Scalability: Horizontal scaling for API, Mongo indexes for heavy queries
- Test coverage target: 70%+ (backend), 50%+ (frontend) by V1

---

## 13) Project Structure (Monorepo)

smart-inventory/
- client/ (React app)
  - src/
    - api/
    - components/
    - hooks/
    - pages/
    - store/
    - utils/
  - public/
- server/ (Express + Mongoose)
  - src/
    - config/
    - middleware/
    - models/
    - routes/
    - controllers/
    - services/
    - jobs/
    - utils/
  - tests/
- .env.example
- docker-compose.yml
- README.md

---

## 14) Environment Variables
- Common
  - NODE_ENV=development|production

- Server
  - PORT=4000
  - MONGO_URI=mongodb://localhost:27017/smart_inventory
  - JWT_SECRET=change_me
  - JWT_REFRESH_SECRET=change_me_too
  - CORS_ORIGIN=http://localhost:5173
  - GOOGLE_SA_EMAIL=...
  - GOOGLE_SA_PRIVATE_KEY=... (escaped newlines)
  - GOOGLE_SHEETS_REPORT_SPREADSHEET_ID=...

- Client
  - VITE_API_BASE_URL=http://localhost:4000/api

---

## 15) Local Development Setup
Prerequisites
- Node.js LTS (>=18), npm or pnpm
- MongoDB (local or Docker)

Steps
1) Clone repo and create folders client and server
2) Install deps
   - In /client: npm create vite@latest client -- --template react-ts; cd client; npm install @tanstack/react-query axios recharts zod
   - In /server: npm init -y; npm install express mongoose zod jsonwebtoken bcryptjs cors morgan winston node-cron dotenv helmet
     - Dev deps: npm install -D typescript ts-node-dev @types/express @types/jsonwebtoken @types/bcryptjs @types/node jest ts-jest @types/jest supertest @types/supertest eslint prettier
3) Create .env files based on .env.example
4) Run MongoDB (service or Docker)
5) Start
   - Server: npm run dev (ts-node-dev src/index.ts)
   - Client: npm run dev (Vite on 5173)

Optional Docker (example compose)
- services: api (Node), mongo, client (nginx) – configure in docker-compose.yml

---

## 16) Testing Strategy
- Unit tests: business logic in services (forecasting, reorder calculations)
- API tests: Supertest for auth, products, stock flows
- E2E: Playwright/Cypress scenarios (login, scan, stock in/out, alerts)
- Fixtures/seed data for deterministic tests
- CI pipeline: lint, build, test; artifacts: coverage report

---

## 17) Google Sheets Integration
- Use a Google Cloud service account with Sheets API enabled
- Share target spreadsheet with service account email
- Store credentials as env vars (email + private key)
- Backend module handles exporting reports to a given sheet tab
  - Example tabs: StockSummary, LowStock, Movements
- Rate limiting and retries for API calls

---

## 18) Logging and Monitoring
- Request logs: Morgan combined format in dev
- App logs: Winston with levels (info, warn, error), JSON format in prod
- Correlation IDs per request for tracing
- Health checks: GET /api/health returns { status, uptime, db }

---

## 19) Data Seeding & Migration
- Seed script to insert demo users, products, suppliers
- Migration approach: simple Node scripts or Mongo migrations tool for schema evolution (indexes)

---

## 20) UI Flows
- Login -> Dashboard (KPIs, alerts)
- Product Catalog: list, filter, create/edit, print label
- Scan Screen: camera or input field; resolve product; choose action (IN/OUT/ADJUST)
- Transactions: filter by product/date/type; export
- Reports: view and export to CSV/Sheets
- Settings: thresholds, suppliers, locations (Phase 2)

---

## 21) Acceptance Criteria (MVP Samples)
- As staff, I can scan a product barcode and perform OUT with quantity; stock decreases and a transaction is recorded with timestamp and user
- As manager, I see a Low Stock list where quantity <= minLevel
- As admin, I can create a user with role and the user can log in
- As manager, I can export the Stock Summary to Google Sheets and see a new tab populated

---

## 22) Risks and Mitigations
- Camera permissions unreliable on some browsers: Provide manual entry fallback + hardware scanner support
- Forecast accuracy limited by sparse data: Start with simple models; mark confidence level; allow manual overrides
- Data consistency under concurrency: Use atomic updates in Mongo; transaction sessions for PO receive flows
- Secrets leakage: Use env vars and secret managers in prod; never commit keys

---

## 23) Roadmap & Milestones
Milestone 1 (2 weeks)
- Backend: Auth, Users, Products, Stock endpoints (IN/OUT/ADJUST), Mongo models
- Frontend: Auth pages, Product list/detail CRUD, basic Scan screen
- Reports: Stock Summary, Low Stock (server + UI)
- Logs, basic tests, .env setup

Milestone 2 (2–3 weeks)
- Alerts service, Dashboard KPIs, Transactions filters
- Google Sheets export
- Hardening: validation, RBAC, error handling, indexes

Milestone 3 (3 weeks)
- Forecasting jobs and suggested reorder
- Purchase Orders, Receive flow
- More tests (API + E2E), performance tuning

---

## 24) Glossary
- SKU: Stock Keeping Unit, unique product identifier
- On-hand: Current available stock
- ROP: Reorder Point – threshold to trigger replenishment
- PO: Purchase Order
- COGS: Cost of Goods Sold

---

## 25) Next Steps (Actionable)
- Initialize repo with client and server scaffolds
- Define Mongoose schemas based on the Data Model
- Implement Auth + RBAC middleware
- Build Products and Stock endpoints + basic tests
- Create React pages: Login, Dashboard, Products, Scan, Reports
- Integrate barcode scanning with QuaggaJS on Scan page
- Implement Stock Summary and Low Stock reports + CSV and Sheets export
- Add nightly cron job placeholder for forecasts

This document serves as the single source of truth for MVP through V1. Keep it updated as the implementation evolves.