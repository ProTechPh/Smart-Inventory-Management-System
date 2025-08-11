# Smart Inventory Management System

A full-stack inventory management application with a modern React frontend and an Express/TypeScript backend. The frontend is fully functional out-of-the-box thanks to a localStorage fallback for product data while still integrating with the backend when available.

## Features

- Modern, cohesive UI with a simple design system (cards, buttons, tables, modals)
- Dashboard with backend health status
- Products module
  - List, search (name, SKU, category), and sort (name/price/stock)
  - Create, edit, delete via accessible modals
  - Persist to backend if product API exists, otherwise fall back to localStorage
  - Seed sample data when no backend is available
- Reliable data fetching/mutations using React Query
- Vite-powered frontend (fast dev + builds)
- Express backend with CORS, security middleware, structured errors, and MongoDB support via Mongoose

## Tech Stack

- Frontend: React 18, TypeScript, Vite, React Router, React Query
- Backend: Node.js, Express, TypeScript, Mongoose

## Repository Structure

- client/ — React + Vite frontend
- server/ — Express + TypeScript backend

## Prerequisites

- Node.js 18+ recommended (required by Vite 5)
- npm 9+ (bundled with Node 18+)
- Optional: MongoDB (local or hosted) if you want to persist data on the backend

## Environment Variables

Frontend (client/.env):
- VITE_API_BASE_URL: Backend API base URL. Defaults to http://localhost:4000/api

Example client/.env:
- VITE_API_BASE_URL=http://localhost:4000/api

Backend (server/.env):
- PORT: API port (default 4000)
- CORS_ORIGIN: Allowed origin for the frontend (default http://localhost:5173)
- MONGO_URI: MongoDB connection string (default mongodb://localhost:27017/smart_inventory)

Example server/.env:
- PORT=4000
- CORS_ORIGIN=http://localhost:5173
- MONGO_URI=mongodb://localhost:27017/smart_inventory

## Installation

Install dependencies for both apps:
- cd server && npm install
- cd client && npm install

## Running Locally

Run the backend (Terminal 1):
- cd server
- Copy server/.env.example to server/.env and adjust if needed
- npm run dev
- Server starts at http://localhost:4000

Run the frontend (Terminal 2):
- cd client
- Copy client/.env.example to client/.env (or keep defaults)
- npm run dev
- Frontend starts at http://localhost:5173

Notes:
- The frontend reads VITE_API_BASE_URL from client/.env.
- If the backend does not expose product endpoints yet, the frontend will use localStorage automatically and seed demo products.

## Build

Frontend:
- cd client
- npm run build
- npm run preview

Backend:
- cd server
- npm run build
- npm start

## API

Implemented:
- GET /api/health — Returns { status, uptime, db } and reflects Mongo connection state

Expected by frontend (optional, for full backend persistence):
- GET /api/products — Return Product[] or { products: Product[] }
- POST /api/products — Return Product or { product }
- PATCH /api/products/:id — Return Product or { product }
- DELETE /api/products/:id — 200/204 on success

Product type used by the frontend:
- id: string
- name: string
- sku: string
- price: number
- stock: number
- category?: string
- createdAt: string (ISO)
- updatedAt?: string (ISO)

## Frontend Behavior Without Backend

- The client includes an API helper with a localStorage fallback (key: sim_products_v1)
- On first run without backend endpoints, it seeds 3 sample products
- You can clear local storage (sim_products_v1) to reset demo data

## Scripts

Frontend (client/package.json):
- npm run dev — Start Vite dev server
- npm run build — Type-check and build for production
- npm run preview — Preview production build at port 5173

Backend (server/package.json):
- npm run dev — Start dev server with ts-node-dev
- npm run build ��� Compile TypeScript
- npm start — Start compiled server
- npm run test — Run tests (if present)
- npm run lint — Lint code

## Troubleshooting

- CORS errors: Ensure server CORS_ORIGIN matches the frontend origin (default http://localhost:5173)
- Mongo connection: If MongoDB is not running or MONGO_URI is invalid, /api/health will reflect the DB state; product endpoints are optional
- Product endpoints missing: The frontend will continue to work using localStorage
- Port conflicts: Change PORT in server/.env or Vite preview port via npm run preview -- --port <port>
- Reset seeded data: Clear localStorage entry sim_products_v1 in your browser

## Project Status

- Frontend is fully functional with local persistence and a modern UI
- Backend currently exposes a health endpoint and is ready for product CRUD routes

## License
