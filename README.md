# Remote Support Tool

BeyondTrust-style Remote Support Tool — React + Node.js + WebRTC

## Project Structure

```
remote-support-tool/
├── client/          # React + TypeScript + Tailwind (Frontend)
└── server/          # Node.js + Express + MySQL (Backend)
```

## Phase 2 — Setup Instructions

### 1. Database Setup

```bash
mysql -u root -p < server/schema.sql
```

### 2. Server (Backend)

```bash
cd server
cp .env.example .env
# .env mein apna DB password aur JWT secret daalo
npm install
node index.js
# Server: http://localhost:5000
```

### 3. Client (Frontend)

```bash
cd client
cp .env.example .env
npm install
npm run dev
# App: http://localhost:5173
```

## API Endpoints

| Method | Route              | Description     |
|--------|--------------------|-----------------|
| POST   | /api/auth/register | Naya account    |
| POST   | /api/auth/login    | Login           |
| GET    | /api/auth/me       | Current user    |
| GET    | /api/health        | Server check    |

## Demo Login
- Email: `admin@rst.com`
- Password: `password123`

## Roadmap
- [x] Phase 2 — Auth + Dashboard
- [ ] Phase 3 — WebRTC Screen Sharing
- [ ] Phase 4 — Remote Control
- [ ] Phase 5 — File Transfer + Recording
- [ ] Phase 6 — Polish + AI Features
