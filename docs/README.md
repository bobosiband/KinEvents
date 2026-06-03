# KinEvents — Documentation Index

KinEvents is a family event management platform that coordinates events, birthdays, gift pools, and family communication in one place.

## Feature Documentation

| Doc | Description |
|-----|-------------|
| [Architecture](./architecture.md) | Tech stack, project structure, and key patterns |
| [Authentication & Access Control](./authentication.md) | Login, JWT, roles, and capabilities |
| [Events](./events.md) | Event creation, RSVP, and management |
| [Birthdays](./birthdays.md) | Birthday tracking and auto-event generation |
| [Gift Pools](./gift-pools.md) | Gift pool creation, contributions, and verification |
| [Users & Family](./users.md) | User profiles, roles, and family member management |
| [Notifications](./notifications.md) | Email, WhatsApp, and push notification dispatch |
| [Chat](./chat.md) | Real-time family group chat |
| [Admin Dashboard](./admin.md) | Admin tools, metrics, and site management |
| [Database](./database.md) | Single-document MongoDB schema and data models |
| [Deployment & Configuration](./deployment.md) | Environment variables, build, and hosting options |

## Quick Start

```bash
# Frontend
cd FrontEnd && npm install && npm run dev

# Backend
cd BackEnd && npm install && npm run dev
```

## Repository Layout

```
KinEvents/
├── FrontEnd/          # React 18 + TypeScript + Vite
├── BackEnd/           # Node.js + Express + MongoDB
├── scripts/           # Deployment helper scripts
└── docs/              # This documentation
```
