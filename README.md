# Sweety – Blood Glucose Tracker

Sweety is a full-stack application for recording and reviewing personal blood glucose readings. It provides authenticated accounts, a dashboard, reading history, and UTC-based daily and monthly reports. It is an assignment/demo tracker, not a medical advice tool.

## Features

- Register and sign in with JWT authentication.
- Record glucose values in mg/dL or mmol/L with a reading type and timestamp.
- Enforce at most one reading per type per UTC day and a maximum of four readings per user per UTC day.
- View readings, dashboard summaries, and unit-separated daily and monthly reports.
- Restore the signed-in session for the current browser tab using `sessionStorage`.

## Technology stack

- Frontend: React 19, TypeScript, Vite 8, React Router, Zod.
- Backend: Node.js, Express 5, TypeScript, Zod, bcrypt, and JSON Web Tokens.
- Database: PostgreSQL with Prisma ORM 7 and the PostgreSQL driver adapter.

## Project structure

```text
client/
  src/app/             Application setup and route definitions
  src/context/         Authentication, readings, and report state
  src/features/        Auth, dashboard, readings, and reports UI/API code
  src/api/              Centralized HTTP client
server/
  src/config/           Prisma database client
  src/routes/           Express route registration
  src/middleware/       JWT authentication
  src/controllers/      HTTP validation and response handling
  src/services/         Business logic and Prisma queries
  src/utils/            Request validation schemas
  prisma/               Prisma schema, migrations, and seed script
  test/                 PostgreSQL-backed integration tests
```

## Prerequisites

- Node.js 20.19+ or 22.12+ (required by the installed Vite 8 release).
- npm (the version bundled with Node.js is suitable; npm 11.9 was used during preparation).
- PostgreSQL. The repository does not pin a PostgreSQL server version.
- Git.

## Installation

```sh
git clone https://github.com/Abee0204/Sweety.git
cd Sweety

cd server
npm install
cd ../client
npm install
cd ..
```

## Database and environment setup

Create a local PostgreSQL database (adjust the role for your installation):

```sh
createdb -U postgres sweety_db
```

Alternatively, connect with `psql -U postgres` and run `CREATE DATABASE sweety_db;`.

Copy the example environment file and edit its placeholders:

```powershell
Copy-Item server/.env.example server/.env
```

Set `DATABASE_URL` to the connection string for the database you created. Its format is `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`. Set `JWT_SECRET` to a long random development secret and keep the real `server/.env` private. `PORT` defaults to 5000 in the server code; `JWT_EXPIRES_IN` uses a `jsonwebtoken` duration such as `1d`.

Apply the checked-in migrations and generate the Prisma client from the server directory:

```sh
cd server
npx prisma migrate dev --config prisma7.config.js
npx prisma generate --config prisma7.config.js
```

The Prisma 7 config supplies the schema, migrations directory, and `DATABASE_URL`; the generated client is written to `src/generated/prisma`.

## Run the application

Start the backend in one terminal:

```sh
cd server
npm run dev
```

Start the frontend in a second terminal:

```sh
cd client
npm run dev
```

The frontend is available at <http://localhost:5173>. The API base URL is <http://localhost:5000/api> (the server port can be changed with `PORT`). The API health endpoint is <http://localhost:5000/api/health>.

## Demo account and seed data

After database setup, create the demo account and sample readings with:

```sh
cd server
npm run seed
```

Development-only demo credentials:

- Email: `demo@sweety.example`
- Password: `Sweety-Demo-Only-2026!`

The password is intentionally a demo credential for a local assignment database. Do not reuse it or expose it in a deployed environment. The seed script uses the demo user's creation date as a stable date anchor and skips existing slots, making repeated runs safe.

## Tests and checks

Backend integration tests require the local PostgreSQL database and environment variables to be configured:

```sh
cd server
npm test
npm run build
```

`npm test` runs the TypeScript build and the Node integration suite. The suite covers registration and login, invalid credentials, JWT-protected `/api/auth/me`, reading validation and user isolation, UTC date filtering, the daily and per-slot limits including concurrent submissions, and daily/monthly report aggregation and empty results.

Frontend checks:

```sh
cd client
npm run build
npm run lint
```

No separate frontend automated test command is configured in this repository.

## Screenshots

These application views were captured from the running app with the demo account. The tablet-width Add Reading view was captured without browser developer tools. Final image files are in `docs/screenshots/`.

### Login

![Sweety login page](docs/screenshots/login.jpg)

### Dashboard with demo readings

![Sweety dashboard with demo readings](docs/screenshots/dashboard.jpg)

### Add Reading

![Sweety Add Reading page](docs/screenshots/add-reading.jpg)

### Daily Report

![Sweety daily report](docs/screenshots/daily-report.jpg)

### Monthly Report

![Sweety monthly report](docs/screenshots/monthly-report.jpg)

### Add Reading at tablet width

![Sweety Add Reading page at tablet width](docs/screenshots/add-reading-ipad.jpg)

## Notes

Reading limits and report grouping use UTC calendar days. Glucose statistics remain separate by unit. Seeded values are illustrative sample data and do not provide clinical interpretation. With more development time, the project could add focused frontend tests and deployment configuration/documentation for the SPA route fallback used by React Router.
