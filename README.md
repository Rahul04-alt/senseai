
# SenseAI — AI-Powered Career Coach

SenseAI is a full-stack AI career coaching platform built with **Next.js 15**. It helps job seekers accelerate their careers with personalized AI guidance — from resume building and cover letter generation to mock interview practice and real-time industry insights.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the App](#running-the-app)
- [Key Pages & Routes](#key-pages--routes)
- [Background Jobs (Inngest)](#background-jobs-inngest)
- [Authentication](#authentication)
- [Database Schema](#database-schema)
- [Scripts](#scripts)
- [Contributing](#contributing)

---

## Features

| Feature | Description |
|---|---|
| **AI-Powered Career Guidance** | Personalized career advice and insights powered by Google Gemini |
| **Smart Resume Builder** | Generate ATS-optimized resumes with AI assistance and PDF export |
| **Cover Letter Generator** | Create tailored cover letters for any job description in seconds |
| **Mock Interview Practice** | Role-specific quiz questions with instant AI feedback |
| **Behavioral Interview Prep** | Practice STAR-method answers and soft-skill scenarios |
| **Skill Gap Analysis** | Identify missing skills and get a personalized learning roadmap |
| **Industry Insights Dashboard** | Real-time salary data, hiring trends, and market analysis for your industry |
| **Company Research** | Quick company briefs to help you prepare for interviews |
| **Performance Tracking** | Charts and analytics to track quiz scores and improvement over time |
| **Dark / Light Mode** | Full theme support via `next-themes` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Turbopack) |
| **Language** | JavaScript (JSX) |
| **Styling** | [Tailwind CSS v3](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Authentication** | [Clerk](https://clerk.com/) |
| **Database** | PostgreSQL via [Prisma ORM](https://www.prisma.io/) |
| **AI** | [Google Gemini API](https://ai.google.dev/) (`@google/genai`) |
| **Background Jobs** | [Inngest](https://www.inngest.com/) |
| **Forms** | React Hook Form + Zod validation |
| **Charts** | [Recharts](https://recharts.org/) |
| **Notifications** | [Sonner](https://sonner.emilkowal.ski/) |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## Project Structure

```
senseai-main/
├── actions/              # Server Actions (AI calls, DB mutations)
│   ├── cover-letter.js
│   ├── dashboard.js
│   ├── interview.js
│   ├── job-tools.js
│   ├── resume.js
│   └── user.js
├── app/
│   ├── (auth)/           # Sign-in / Sign-up pages (Clerk)
│   ├── (main)/           # Protected app routes
│   │   ├── dashboard/
│   │   ├── resume/
│   │   ├── ai-cover-letter/
│   │   ├── interview/
│   │   ├── skill-gap/
│   │   ├── company-research/
│   │   ├── job-tools/
│   │   ├── growth-tools/
│   │   └── onboarding/
│   └── api/inngest/      # Inngest webhook endpoint
├── components/           # Shared UI components + shadcn/ui
├── data/                 # Static data (features, FAQs, testimonials)
├── hooks/                # Custom React hooks
├── lib/
│   ├── prisma.js         # Prisma client singleton
│   ├── checkUser.js      # Clerk ↔ DB user sync
│   ├── utils.js
│   └── inngest/          # Inngest client & functions
└── prisma/
    ├── schema.prisma
    └── migrations/
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- A **PostgreSQL** database (local or hosted — [Neon](https://neon.tech), [Supabase](https://supabase.com), etc.)
- A [Clerk](https://clerk.com/) account
- A [Google AI Studio](https://aistudio.google.com/) API key (Gemini)
- An [Inngest](https://www.inngest.com/) account (for background jobs)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/senseai.git
cd senseai

# 2. Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root and populate it:

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Google Gemini AI
GEMINI_API_KEY=AIza...
```

> **Where to get each key:**
> - `DATABASE_URL` — your PostgreSQL provider's connection string
> - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — [Clerk Dashboard](https://dashboard.clerk.com/) → API Keys
> - `GEMINI_API_KEY` — [Google AI Studio](https://aistudio.google.com/app/apikey)

### Database Setup

```bash
# Apply all migrations and generate Prisma client
npx prisma migrate deploy

# (First time or after schema changes) generate the client manually
npx prisma generate

# Optional: open Prisma Studio to browse your data
npx prisma studio
```

### Running the App

```bash
# Development (with Turbopack)
npm run dev

# In a second terminal — start the Inngest dev server
npx inngest-cli@latest dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Key Pages & Routes

| Route | Description |
|---|---|
| `/` | Landing page — features, testimonials, FAQ |
| `/onboarding` | Industry & skills setup (required on first login) |
| `/dashboard` | Industry insights, salary data, hiring trends |
| `/resume` | AI resume builder with ATS scoring & PDF export |
| `/ai-cover-letter` | Cover letter generator & saved letters list |
| `/interview` | Mock interview quizzes with performance charts |
| `/interview/mock` | Live mock interview session |
| `/skill-gap` | Skill gap analysis and learning roadmap |
| `/company-research` | AI-generated company briefs |
| `/job-tools` | Job description analysis and tools |
| `/growth-tools` | Additional career growth resources |

---

## Background Jobs (Inngest)

Inngest handles long-running or scheduled background tasks (e.g., refreshing industry insights). The webhook endpoint lives at `/api/inngest`.

To develop locally:

```bash
npx inngest-cli@latest dev
```

This starts a local Inngest dev server at `http://localhost:8288` and proxies events to your Next.js app.

---

## Authentication

Authentication is handled entirely by **Clerk**. The `middleware.js` file protects all routes under `/(main)/`. After sign-up, users are redirected to `/onboarding` to set their industry and skills before accessing the dashboard.

User data is synced from Clerk to the local PostgreSQL database via `lib/checkUser.js` on every authenticated request.

---

## Database Schema

| Model | Description |
|---|---|
| `User` | Core user profile — industry, skills, bio, experience |
| `Assessment` | Interview quiz results with per-question breakdown |
| `Resume` | Single resume per user (Markdown + ATS score) |
| `CoverLetter` | Multiple cover letters per user |
| `IndustryInsight` | Cached salary & hiring trend data per industry |

---

## Scripts

```bash
npm run dev        # Start dev server (Turbopack)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
```

> `postinstall` automatically runs `prisma generate` after every `npm install`.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

---

> Built with Next.js 15, Clerk, Prisma, Google Gemini, and Inngest.
