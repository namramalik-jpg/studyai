# StudyAI - Study Smarter With AI

StudyAI is a modern AI-powered study platform built with Next.js, Supabase, and Google Gemini. It helps students generate study notes, summaries, quizzes, and flashcards from any topic or study material.

Live Demo: https://study-ai-sandy-mu.vercel.app/

## Overview

StudyAI is designed as a premium SaaS-style education platform. It includes authentication, protected dashboard pages, AI generation tools, saved notes, history, profile management, settings, and an admin panel.

The project is suitable for a Final Year Project, portfolio showcase, and future production expansion.

## Features

- Modern responsive landing page
- Email/password authentication with Supabase
- Protected dashboard routes
- AI Notes Generator
- AI Summary Generator
- AI Quiz Generator
- AI Flashcards Generator
- AI History page
- Saved Notes page
- User Profile page
- Settings page
- Admin dashboard with role-based access
- Light and dark mode support
- Responsive design for mobile, tablet, and desktop
- Premium SaaS UI inspired by Notion, Linear, Vercel, and ChatGPT

## Tech Stack

- Next.js 15 App Router
- React
- Tailwind CSS
- Supabase Authentication
- Supabase Database
- Google Gemini API
- Lucide React Icons
- Vercel Deployment

## Pages

- `/` - Landing Page
- `/login` - Login
- `/signup` - Signup
- `/forgot-password` - Forgot Password
- `/reset-password` - Reset Password
- `/dashboard` - User Dashboard
- `/ai-notes` - AI Notes Generator
- `/ai-summary` - AI Summary Generator
- `/ai-quiz` - AI Quiz Generator
- `/flashcards` - AI Flashcards
- `/history` - AI History
- `/notes` - Saved Notes
- `/profile` - User Profile
- `/settings` - Settings
- `/admin` - Admin Panel

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/namramalik-jpg/studyai.git
cd studyai
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Create environment file

Create a `.env.local` file in the root directory and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key
```

### 4. Run the development server

```bash
pnpm dev
```

Open:

```txt
http://localhost:3005
```

## Supabase Setup

This project uses Supabase for:

- Authentication
- User profiles
- AI history
- Saved notes
- Quiz history
- Flashcard decks
- Admin roles

Run the SQL files from the `database` folder inside the Supabase SQL Editor.

Important tables include:

- `profiles`
- `ai_history`
- `notes`
- `summaries`
- `quiz_history`
- `flashcard_decks`
- `saved_notes`
- `user_preferences`

## Gemini API Setup

StudyAI uses Google Gemini for AI generation.

To get an API key:

1. Go to Google AI Studio.
2. Create an API key.
3. Add it to `.env.local` as `GEMINI_API_KEY`.
4. Restart the development server.

The Gemini API key is only used on the server side and is never exposed to the client.

## Admin Access

Admin access is controlled through the `role` column in the Supabase `profiles` table.

Supported roles:

- `user`
- `admin`

To make a user admin, update their profile role in Supabase:

```sql
update public.profiles
set role = 'admin'
where email = 'your-email@example.com';
```

## Deployment

The project is deployed on Vercel.

Production URL:

```txt
https://study-ai-sandy-mu.vercel.app/
```

Before deploying, add the required environment variables in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

## Build

```bash
pnpm build
```

On Windows, if the build fails because of low memory or pagefile limits, run:

```cmd
set NODE_OPTIONS=--max-old-space-size=4096
pnpm run build
```

## Project Status

StudyAI is feature-complete as a full-stack frontend + Supabase prototype and ready for portfolio/FYP demonstration. It can be extended further with payments, advanced analytics, team workspaces, and richer AI workflows.

## Author

Created by Namra Malik.
