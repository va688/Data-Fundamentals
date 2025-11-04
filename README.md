# StudyPal

<div align="center">
  <h3><b>Smart study tracker with courses, tasks, timetable, lecturers, and AI-powered assistance</b></h3>
</div>

# 📗 Table of Contents

- [📖 About the Project](#about-project)
  - [🛠 Built With](#built-with)
    - [Tech Stack](#tech-stack)
    - [Key Features](#key-features)
  - [🚀 Live Demo](https://studentpalapp.onrender.com)
- [💻 Getting Started](#getting-started)
  - [Setup](#setup)
  - [Prerequisies](#prerequisites)
  - [Install](#install)
  - [Usage](#usage)
  - [Run tests]( https://studentpalapp.onrender.com)
  - [Deployment](#triangular_flag_on_post-deployment)
- [👥 Authors](#authors)
- [🔭 Future Features](#future-features)
- [🤝 Contributing](#contributing)
- [⭐️ Show your support](#support)
- [🙏 Acknowledgements](#acknowledgements)
- [❓ FAQ](#faq)
- [📝 License](#license)

# 📖 StudyPal <a name="about-project"></a>

StudyPal helps students track courses, tasks, timetable, and lecturers; get book recommendations by course; and generate a tailored study schedule using AI or a smart local planner. It also reminds you before lectures and deadlines.

## 🛠 Built With <a name="built-with"></a>

### Tech Stack <a name="tech-stack"></a>

- Client: HTML, CSS, JavaScript
- Platform: Supabase (Auth, Edge Functions)
- APIs: Google Books API;

### Key Features <a name="key-features"></a>

- Course management with per-course book recommendations
- Assignments & Tasks with due dates (styled table)
- Timetable with Day/Time/Venue (styled table) and notifications with custom lead time
- Lecturers directory with course link, email, and optional phone (styled cards)
- AI Study Schedule (via Supabase Function + Gemini) with local smart fallback
- Toast confirmations after actions and in-app notification controls

## 🚀 Live Demo <a name="live-demo"></a>

- Live link: https://studentpalapp.onrender.com

## 💻 Getting Started <a name="getting-started"></a>

To get a local copy up and running, follow these steps.

### Prerequisites <a name="prerequisites"></a>

- A modern browser
- Optional for backend features: Supabase CLI (for deploying Edge Functions)

### Setup <a name="setup"></a>

Clone this repository:

- Windows/macOS/Linux
  - git clone <your_repo_url>
  - cd studyPal

### Install <a name="install"></a>

No build step is required. All files are static.

- Optional: Install Supabase CLI if you want to deploy the serverless functions.

### Usage <a name="usage"></a>

Local development:
- Open index.html in a browser (or use a static server / VSCode Live Server).
- Login/Sign up uses Supabase Auth.
- The app persists lists per user via localStorage.
- Notifications: open Dashboard → Notifications → Enable.

AI endpoints:
- Book recommendations: Supabase Edge Function recommend-books (or client-side Google Books fallback).
- Study schedule: Supabase Edge Function generate-schedule (or local smart fallback if AI fails).

If you fork this project, update the following in dashboard.js/auth.js:
- SUPABASE_URL, SUPABASE_ANON_KEY
- SUPABASE_FUNCTIONS_URL

### Run tests <a name="run-tests"></a>

I have hosted the site on render you can access it here: https://studentpalapp.onrender.com

### Deployment <a name="triangular_flag_on_post-deployment"></a>

Static hosting (Netlify, Vercel, GitHub Pages) works for the frontend. For AI features, deploy Supabase functions:

1) Install and login
- supabase login
- supabase link --project-ref <your_project_ref>

2) Secrets (only if using Gemini)
- supabase secrets set GEMINI_API_KEY=<your_gemini_key>

3) Deploy functions
- supabase functions deploy recommend-books --no-verify-jwt
- supabase functions deploy generate-schedule --no-verify-jwt

Ensure dashboard.js has SUPABASE_FUNCTIONS_URL set to https://<your_project_ref>.functions.supabase.co.

## 👥 Authors <a name="authors"></a>

- Violet Otieno

## 🔭 Future Features <a name="future-features"></a>

- Supabase DB persistence with RLS (sync lists across devices)
- Background notifications via Service Worker; calendar (.ics) export
- Per-course book thumbnails and rating signals

## 🤝 Contributing <a name="contributing"></a>

Contributions, issues, and feature requests are welcome! Open an issue or PR.

## ⭐️ Show your support <a name="support"></a>

If you like this project, star the repo and share feedback.

## 🙏 Acknowledgements <a name="acknowledgements"></a>

- Supabase team and docs

## ❓ FAQ <a name="faq"></a>

- Why don’t I see notifications?
  - Enable them in the app and in your browser/system settings. Keep the tab open.
- AI schedule not working?
  - Ensure the Supabase function is deployed and GEMINI_API_KEY is set, otherwise the local smart planner runs.
-  Do recommendations match each course?
  - Yes books are grouped per course; click “Show more” to see additional picks.   

## 📝 License <a name="license"></a>

This project is MIT licensed.
