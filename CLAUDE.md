# CLAUDE.md

## Project

FPT University Research Project Management System (FURPMS)

Graduation Thesis Project - Software Engineering

The system manages the full lifecycle of university research projects:

- Proposal Submission
- Review Workflow
- Committee Management
- Research Contracts
- Deliverables
- Disbursements
- Settlements
- Notifications
- Analytics
- AI Summarization
- Semantic Search

---

# Technology Stack

## Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- RBAC Authorization
- Cloudinary
- Nodemailer
- Google Gemini API
- Railway Deployment

## Frontend

- ReactJS
- Vite
- TailwindCSS
- Shadcn UI
- React Query
- Axios
- React Router
- React Hook Form
- Zod
- Framer Motion
- Recharts

---

# Architecture

Use Clean Architecture.

backend/
src/
├── configs/
├── constants/
├── middlewares/
├── modules/
│
├── auth/
├── users/
├── cycles/
├── tracks/
├── proposals/
├── councils/
├── rounds/
├── meetings/
├── review-scoring/
├── contracts/
├── disbursements/
├── deliverables/
├── amendments/
├── progress-reports/
├── final-reports/
├── settlements/
├── notifications/
├── analytics/
├── ai/
│
├── shared/
│
├── app.js
└── server.js

Each module must contain:

controllers/
services/
repositories/
models/
validators/
routes/
dto/

---

Frontend Architecture

frontend/
src/
├── api/
├── hooks/
├── layouts/
├── routes/
├── stores/
├── lib/
├── constants/
├── types/
├── utils/
│
├── features/
│ ├── auth/
│ ├── dashboard/
│ ├── users/
│ ├── cycles/
│ ├── proposals/
│ ├── councils/
│ ├── contracts/
│ ├── reports/
│ ├── notifications/
│ ├── analytics/
│ └── ai/
│
├── components/
│ ├── ui/
│ ├── common/
│ ├── tables/
│ ├── forms/
│ ├── charts/
│ └── layouts/

Use Feature-Based Architecture.

---

# Coding Standards

- Use TypeScript everywhere.
- No any type.
- Use ESLint.
- Use Prettier.
- Use Husky.
- Use Conventional Commits.

---

# API Standards

All responses:

{
"success": true,
"message": "",
"data": {},
"errors": null
}

---

# Authentication

JWT Access Token

RBAC:

Admin
Staff
Faculty
ReviewCommittee

---

# Database

MongoDB Atlas

All collections must include:

createdAt
updatedAt
createdBy
updatedBy

Use soft delete.

deletedAt
isDeleted

---

# Deployment

Backend:
Railway

Frontend:
Vercel

Environment Variables must be centralized.

---

# AI Features

Google Gemini

Features:

- Proposal Summary
- Report Summary
- Reviewer Suggestions
- Semantic Search

Use vector embeddings.

MongoDB Atlas Vector Search.

---

# UI Design

Design level must be production-ready.

Requirements:

- Modern
- Academic
- Enterprise-grade
- FPT University style
- Smooth animations
- Responsive
- Mobile-first

Do NOT generate basic CRUD interfaces.

Every page must have:

- Empty state
- Loading state
- Error state
- Skeleton loaders

Use Shadcn UI components.

Use Framer Motion animations.

Dashboard must look executive-level.

---

# Documentation

Generate:

README.md

Backend README

Frontend README

Deployment Guide

API Documentation

Database ERD

Architecture Diagram

Swagger Documentation

System Design Document

All code must be production-ready.
