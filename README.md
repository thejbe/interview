# Interview Scheduler

A full-stack Next.js application for scheduling interviews, built with Supabase.

## Features

- **Recruiter Workflow**: Dashboard, Template Management (Create/Edit), View Metrics.
- **Manager Workflow**: Manage Availability (Weekly Grid), Calendar Connection (Mock).
- **Candidate Workflow**: Book interviews via public links (`/booking/[token]`).
- **Design**: Premium, dark-themed UI using Tailwind CSS and Material Symbols.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database & Auth**: Supabase
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed.
- A Supabase project created.

### 2. Environment Variables
Create a `.env.local` file in the root directory and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Setup
Run the migration file located at `supabase/migrations/20240101000000_initial_schema.sql` in your Supabase SQL Editor to create the necessary tables and policies.

### 4. Install Dependencies
```bash
npm install
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This project is optimized for deployment on Vercel or any Next.js compatible hosting.
Ensure you add the Environment Variables in your deployment settings.

## Folder Structure

- `app/`: Next.js App Router pages and layouts.
  - `recruiter/`: Recruiter specific routes.
  - `manager/`: Manager specific routes.
  - `booking/`: Public booking routes.
  - `components/`: Reusable UI and feature components.
- `lib/`: Utilities (Supabase client, etc.).
- `legacy_design/`: Original HTML/CSS references.
