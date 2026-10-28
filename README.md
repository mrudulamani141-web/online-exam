# 🎓 ExamCore - Web-Based Examination Management System

A modern, full-stack web application designed for educational institutions, universities, and certification providers to author, schedule, proctor, and automatically grade online examinations with role-based access control (Administrators, Teachers, and Students).

Built with **HTML5, CSS3, JavaScript (ES6+)**, **Node.js**, **Express.js**, and integrated with **Supabase (PostgreSQL)**.

---

## 🌟 Key Features

### 👨‍🎓 For Students
* **Exam Browsing:** Discover published assessments by subject, duration, and total marks.
* **Distraction-Free Exam Room:** Clean, modern interface designed for focus.
* **Live Countdown Timer:** Real-time clock with visual warnings as time runs low and auto-submission on expiration.
* **Interactive Question Palette:** Color-coded navigation grid reflecting Answered (Green), Unanswered (Gray), and Marked for Review (Purple).
* **Anti-Cheat Monitoring:** Detects and logs student tab-switching with visual proctoring warnings.
* **Instant Automatic Grading:** Immediate calculation of score, percentage, and Pass/Fail status.
* **Itemized Diagnostic Review:** Detailed feedback for every question comparing the student's submission against verified answer keys with explanatory notes.
* **Printable Score Certificate:** Formatted for PDF export and printing.

### 👩‍🏫 For Teachers / Instructors
* **Exam Authoring:** Create exams specifying subject, instructions, duration, total marks, and passing threshold.
* **Question Bank Builder:** Add diverse question types:
  * **Multiple Choice (MCQ)** with dynamic option inputs and correct answer radio selection.
  * **True / False** questions.
  * **Short Answer** with flexible case-insensitive keyword matching.
* **Point Weighting:** Assign specific point values to individual questions.
* **Publish / Unpublish Controls:** One-click toggle to make exams available to students or keep them in draft mode.
* **Submissions Analytics:** View all student attempts, completion times, average class performance, and pass rates.

### 🛡️ For Administrators
* **User Directory Management:** View, audit, and remove registered user accounts.
* **Platform-Wide Exam Registry:** Monitor all created examinations across all instructors.
* **System Telemetry:** Real-time metrics on total users, exams, attempts, and overall system pass rates.

---

## 📁 Folder Structure

The project is strictly organized into two decoupled tiers:

```
c:\Users\MRECW_ADMIN\.antigravity-ide\
├── backend/                        # Server-side application
│   ├── package.json                # Dependencies and npm run scripts
│   ├── server.js                   # Express server entry point & static asset host
│   ├── .env.example                # Template for environment variables
│   ├── .env                        # Active environment configuration
│   └── src/
│       ├── config/
│       │   ├── config.js           # Environment loader & default constants
│       │   └── supabase.js         # Supabase client SDK initialization
│       ├── controllers/
│       │   ├── authController.js   # Registration, JWT issuance, profile
│       │   ├── examController.js   # Exam CRUD, publication toggle, search
│       │   ├── questionController.js # Question bank management
│       │   ├── attemptController.js  # Timed sessions, submission, auto-grading
│       │   └── userController.js   # Admin user management & system metrics
│       ├── db/
│       │   ├── schema.sql          # Supabase PostgreSQL DDL (tables, triggers, RLS)
│       │   ├── seed.sql            # SQL seed script with sample data
│       │   ├── seed.js             # Automated Node.js seeder
│       │   └── local_store.json    # Zero-setup fallback store for offline testing
│       ├── middleware/
│       │   ├── auth.js             # JWT bearer verification & role authorization
│       │   ├── errorHandler.js     # Centralized error & 404 middleware
│       │   └── validator.js        # Request input validation schemas
│       ├── routes/
│       │   ├── authRoutes.js       # /api/auth endpoints
│       │   ├── examRoutes.js       # /api/exams endpoints
│       │   ├── questionRoutes.js   # /api/questions endpoints
│       │   ├── attemptRoutes.js    # /api/attempts endpoints
│       │   └── userRoutes.js       # /api/users endpoints
│       └── services/
│           ├── dbService.js        # Universal database abstraction layer
│           └── gradingService.js   # Automated scoring & diagnostic engine
│
├── frontend/                       # Client-side application
│   ├── index.html                  # Landing page with instant 1-click demo logins
│   ├── login.html                  # Sign in / Register with role selection
│   ├── dashboard.html              # Multi-role dashboard (Student, Teacher, Admin)
│   ├── exam-portal.html            # Proctoring & examination room interface
│   ├── results.html                # Graded score report & question breakdown
│   ├── css/
│   │   ├── styles.css              # Global design system, variables, modals, toasts
│   │   ├── dashboard.css           # Role-specific widgets, stats cards, tables
│   │   └── exam.css                # Distraction-free exam room, timer, palette
│   └── js/
│       ├── api.js                  # Centralized fetch client with JWT auth headers
│       ├── auth.js                 # Session persistence, navbar state, page guards
│       ├── dashboard.js            # Dashboard rendering & modal handlers
│       ├── exam-taking.js          # Countdown timer, palette, auto-submit, anti-cheat
│       ├── results.js              # Diagnostic score report renderer
│       └── utils.js                # Toast notifications, modal helpers, formatting
│
├── README.md                       # Complete documentation & usage guide
├── backend.txt                     # Backend architecture reference
├── database.txt                    # Supabase schema & database setup reference
└── frontend.txt                    # Frontend UI and components reference
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Custom Design System, Flexbox, CSS Grid), Vanilla JavaScript (ES6+), Fetch API |
| **Backend** | Node.js, Express.js |
| **Security & Auth** | JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcryptjs`), CORS |
| **Database** | **Supabase (PostgreSQL)** via `@supabase/supabase-js`, with built-in zero-setup fallback |
| **Proctoring** | Page Visibility API (Anti-cheat tab switch monitoring), Precision countdown timers |

---

## ⚡ Quick Start & Installation

### Prerequisites
* [Node.js](https://nodejs.org/) (v16.0 or higher)
* npm (v8.0 or higher)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start the Backend Server
```bash
node server.js
```
The server will boot and display:
```
====================================================
🚀 Examination Management System Server Running
🌐 Server Port:     http://localhost:5000
📁 Frontend:        http://localhost:5000/index.html
📡 Health Check:    http://localhost:5000/api/health
🗄️ Database Mode:   Local Fallback Active (Zero Setup Required)
====================================================
```

### 3. Open in Browser
Open your web browser and navigate to:
**[http://localhost:5000](http://localhost:5000)**

---

## 👥 Demo Accounts (Instant Testing)

The system includes pre-seeded demo accounts with sample exams and questions. You can use the one-click demo buttons on the landing page (`index.html`) or sign in manually with these credentials:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@exam.com` | `Password123!` | Full system access, user management, global exam audit |
| **Teacher** | `teacher@exam.com` | `Password123!` | Create exams, add questions, publish exams, review results |
| **Student 1** | `student@exam.com` | `Password123!` | Browse exams, take timed exams, view personal scorebook |
| **Student 2** | `student2@exam.com` | `Password123!` | Browse exams, take timed exams, view personal scorebook |

---

## 🗄️ Supabase Database Integration

The system natively connects to **Supabase PostgreSQL** while providing a zero-setup persistent fallback so you can test immediately even before setting up a Supabase project.

### Connecting to Your Supabase Project:

1. **Create a Supabase Project:**
   * Go to [https://supabase.com](https://supabase.com) and create a new project.

2. **Execute Database Schema:**
   * Navigate to the **SQL Editor** in your Supabase dashboard.
   * Copy and paste the contents of `backend/src/db/schema.sql` and run it.
   * (Optional) Copy and paste `backend/src/db/seed.sql` to populate sample exams and users.

3. **Configure Environment Variables:**
   * In `backend/.env`, set your Supabase project URL and Service Role Key (found under *Project Settings -> API* in Supabase):
   ```env
   PORT=5000
   JWT_SECRET=examination_management_system_secure_jwt_secret_key_2026
   JWT_EXPIRES_IN=24h

   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-secret-key
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Run Seed Script (Optional):**
   ```bash
   npm run seed
   ```

5. **Restart Server:**
   Upon starting, the server will log:
   `[Database] Supabase client initialized with endpoint: https://your-project-ref.supabase.co`

---

## 📡 RESTful API Documentation

### Authentication Endpoints (`/api/auth`)
* `POST /api/auth/register` — Register a new account (`email`, `password`, `full_name`, `role`).
* `POST /api/auth/login` — Sign in with `email` and `password` to receive a JWT Bearer token.
* `GET /api/auth/me` — Retrieve the currently authenticated profile.

### Exam Endpoints (`/api/exams`)
* `GET /api/exams` — List published exams (students) or all exams (teachers/admins). Supports `?search=` and `?teacherId=`.
* `GET /api/exams/:id` — Get single exam details with questions (answer keys are hidden for students).
* `POST /api/exams` — Create a new exam *(Teacher / Admin only)*.
* `PUT /api/exams/:id` — Update exam details *(Creator / Admin only)*.
* `DELETE /api/exams/:id` — Delete an exam and its associated data *(Creator / Admin only)*.
* `PATCH /api/exams/:id/publish` — Toggle published state *(Creator / Admin only)*.
* `GET /api/exams/:examId/results` — View all student submissions and class analytics for an exam.

### Question Endpoints (`/api/exams/:examId/questions` & `/api/questions`)
* `GET /api/exams/:examId/questions` — Retrieve questions for an exam.
* `POST /api/exams/:examId/questions` — Add a new question (Multiple Choice, True/False, or Short Answer).
* `PUT /api/questions/:id` — Update an existing question.
* `DELETE /api/questions/:id` — Delete a question.

### Attempt & Evaluation Endpoints (`/api/attempts`)
* `POST /api/attempts/start` — Start a new timed attempt session or resume an active one.
* `POST /api/attempts/:id/submit` — Submit student answers; triggers auto-grading and returns score diagnostics.
* `GET /api/attempts/my-attempts` — Retrieve all completed attempts for the authenticated student.
* `GET /api/attempts/:id` — View detailed score report and question breakdown for a specific attempt.

### Administration Endpoints (`/api/users`)
* `GET /api/users` — Retrieve all registered users *(Admin only)*.
* `DELETE /api/users/:id` — Delete a user account *(Admin only)*.
* `GET /api/users/stats` — Platform performance summary and telemetry *(Admin / Teacher)*.

---

## 🔒 Security & Data Integrity

1. **Role-Based Access Control (RBAC):** Middleware intercepts all restricted routes, verifying JWT signatures and enforcing permissions (`admin`, `teacher`, `student`).
2. **Hidden Answer Keys:** When students take an exam, `correct_answer` and `explanation` fields are strictly filtered out on the server side to prevent client-side inspection.
3. **Encrypted Passwords:** Passwords are never stored in plaintext; salted and hashed with `bcryptjs` (cost factor 10).
4. **Input Sanitization & Validation:** Middleware validates all emails, string lengths, numerical bounds (durations, scores), and JSON bodies before processing.
5. **Anti-Cheat Monitoring:** The frontend Page Visibility API detects when candidates navigate away from the exam tab, displaying proctoring warnings and recording event counts.
6. **XSS Protection:** Client-side HTML entities are escaped before rendering user-submitted text.

---

## 📈 Scalability Considerations

* **Database Indexing:** The PostgreSQL schema includes indexes on `users(email)`, `exams(teacher_id)`, `exams(is_published)`, `questions(exam_id)`, and `exam_attempts(exam_id, student_id)` to optimize high-concurrency queries.
* **Stateless Authentication:** JWT tokens eliminate server-side session state, enabling horizontal scaling across multiple Node.js instances behind a load balancer.
* **Decoupled Architecture:** The clean separation between `frontend` and `backend` enables hosting the client on CDNs (e.g. Vercel, Netlify, Cloudflare Pages) while running the Express API on serverless containers (e.g. Render, AWS ECS, Google Cloud Run).
