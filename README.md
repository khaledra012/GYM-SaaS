# GYM-SaaS - Smart Gym Management System

A comprehensive Gym Management System built as a Software as a Service (SaaS) to streamline daily administrative operations. The system provides an interactive and modern user interface that allows gym managers and owners full control over trainees, subscriptions, attendance, and financials with ease and flexibility.

---

## 🌟 Key Features

- 📊 **Statistical Dashboard:** A quick overview of revenue, active members, and subscriptions.
- 👥 **Members Management:** Add, edit, and view members' training profiles and track their status.
- 📋 **Plans Management:** Create various training plans (time-based or session-based) with different prices and features.
- 🎟️ **Subscriptions Management:** 
  - Support for time-based subscriptions.
  - Support for session-based subscriptions.
  - Filter subscriptions (Active, Expiring Soon, Expired).
  - Flexible subscription renewal system (same plan, new plan, or custom manual renewal).
- ✔️ **Check-In / Today Log System:** A quick interface to scan and confirm attendance for gym members and a daily log of movements.
- 💰 **Accounting Management:**
  - **Shifts:** Open and close work shifts for employees.
  - **Ledger:** Track the cash register and expenses.
  - **History (Transactions):** Review all financial transactions in the gym.
- 🔐 **Authentication & Security:** Secure system for Login, Register (creating a new account), and resetting/changing passwords.

---

## 🛠️ Technology Stack (Frontend)

The frontend of the project is built with the latest web technologies to ensure speed and an excellent user experience:
- **Core Framework:** [React 19](https://react.dev/)
- **Bundler:** [Vite](https://vitejs.dev/)
- **Routing:** [React Router DOM v7](https://reactrouter.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Linting:** ESLint

---

## 🚀 Quick Start (Local Setup)

To set up the project on your local machine and start developing, please follow these steps:

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Development Server:**
   ```bash
   npm run dev
   ```
   This command will start a local server, usually available at `http://localhost:5173`.

3. **Production Build:**
   ```bash
   npm run build
   ```

4. **Preview Build:**
   ```bash
   npm run preview
   ```

---

## 📂 Folder Structure Overview

- `src/pages/` - Contains the main page files such as Dashboard, Members, Plans, etc.
- `src/components/` - Shared and reusable components like Modals and Buttons.
- `src/api/` (If applicable) - Contains API integration functions with the backend.

---

> **Note:** This system is designed to be responsive and scalable to serve multiple gyms (Multi-tenant SaaS). To connect it with the backend, please ensure the correct API routes are configured within the project settings.
