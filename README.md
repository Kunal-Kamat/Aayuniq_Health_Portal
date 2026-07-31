# Aayuniq Health Portal

Welcome to the Aayuniq Health Portal! This is a full-stack web application for managing patient health records and making healthcare data more accessible and organized.

## What This Project Does

The portal connects three main user types:
- **Patients** can register, securely log in with OTP verification, and view their complete medical history in a clean timeline format
- **Doctors** can access patient records, add new medical entries, and manage treatment plans
- **Government users** can view anonymized health analytics to inform public health decisions

### Key Features

- **Secure Patient Registration**: Each patient gets a unique ID and verifies their phone number via OTP
- **Patient Dashboard**: A responsive interface showing medical history, vitals, lab results, and visit timelines
- **Robust Security**: JWT authentication, bcrypt password hashing, and encrypted sensitive data
- **PDF Reports**: Patients can download their health reports as PDFs for sharing with other providers
- **Role-Based Access**: Different dashboards and permissions for patients, doctors, and government users

## Tech Stack

These technologies were chosen because they're reliable, well-documented, and work great together:

- **Frontend**: React with TypeScript, styled with Tailwind CSS, and smooth animations with Framer Motion
- **Backend**: Node.js running Express for the API server
- **Database**: MongoDB with Mongoose for flexible data modeling
- **Authentication**: Firebase Auth and Twilio for OTP verification
- **PDF Generation**: jsPDF for creating downloadable health reports

## Project Structure

The code is organized as follows:

```
aayuniq-health-portal/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── pages/         # Different page components
│   │   ├── components/    # Reusable UI components
│   │   ├── services/      # API calls and business logic
│   │   └── utils/         # Helper functions
├── backend/                # Node.js API server
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── middleware/       # Auth and validation logic
│   └── utils/            # Backend helpers
└── docs/                  # Documentation and diagrams
```

## Getting Started

### Prerequisites

Before you begin, make sure you have:
- Node.js (v16 or higher)
- MongoDB (either locally installed or a MongoDB Atlas account)
- Git

### Installation

1. Clone the repository to your local machine
2. Run `npm run install-all` from the root directory to install all dependencies
3. Set up your environment variables (Examples are included in the code)
4. Run `npm run dev` to start both the frontend and backend servers

### Environment Setup

You'll need to create `.env` files in both the `client/` and `backend/` directories. The backend needs database credentials, JWT secrets, and optionally Twilio/Firebase config for OTP. The frontend just needs the API URL.

Check the `setup.md` file for detailed instructions on configuring these.

## How to Use It

Once everything is running:

1. **Register as a patient** - Fill out the registration form with your details
2. **Verify your phone** - Enter the OTP sent to your phone number
3. **Explore your dashboard** - View your medical history, vitals, and lab results
4. **Download reports** - Export your health data as PDF for personal records or to share with doctors

For testing, a seed script is included that populates the database with sample patient data to explore the features without registering.

## Visual Documentation

Colorful flowcharts are available in `docs/diagrams/png/` to visualize how the application works:

- **Overall app flow**: `docs/diagrams/png/overall_flow.png` - Shows the big picture of how everything connects
- **Patient login (OTP)**: `docs/diagrams/png/patient_login_otp.png` - How patients authenticate securely
- **Doctor login**: `docs/diagrams/png/doctor_login_password.png` - Doctor authentication flow
- **Government login**: `docs/diagrams/png/government_login.png` - Government user access
- **Doctor adds medical record**: `docs/diagrams/png/doctor_add_record.png` - How doctors create patient records
- **Patient dashboard options**: `docs/diagrams/png/patient_dashboard_options.png` - What patients can do
- **Doctor dashboard options**: `docs/diagrams/png/doctor_dashboard_options.png` - Doctor's view
- **Government dashboard options**: `docs/diagrams/png/government_dashboard_options.png` - Analytics view
- **Combined flows**: `docs/diagrams/png/combined_flows.png` - All flows in one diagram

The Mermaid source files are in `docs/diagrams/*.mmd` for modifications.

## Project Overview

### Problem Statement

Healthcare data is often fragmented across different providers, making it hard for patients to get a complete picture of their health history. Doctors waste time tracking down records, and public health officials lack good data to make informed decisions.

### Solution

The Aayuniq Health Portal brings everything together:
- **Patients** get a single, secure place to view their complete medical history
- **Doctors** can quickly access patient records and add new information efficiently
- **Government users** get anonymized analytics to understand health trends without compromising privacy

### How It Works

**For Patients:**
1. Register with your phone number and get a unique patient ID
2. Verify your identity via OTP (Twilio or Firebase is used for this)
3. Access your dashboard to see your complete medical timeline
4. Download PDF reports to share with other healthcare providers

**For Doctors:**
1. Log in with secure credentials
2. View patient lists and search for specific patients
3. Add structured medical records including diagnoses, treatments, medications, vitals, and lab results
4. All records are indexed for fast retrieval

**For Government Users:**
1. Authenticate with secure credentials
2. Access aggregated analytics on disease trends, follow-up rates, and other public health metrics
3. All data is anonymized - no personally identifiable information

### Key Differentiators

- **Patient-first design**: Patients own their data and control who sees it
- **Structured records**: The data model enables instant timelines and summaries
- **Built-in analytics**: Government stakeholders get insights without privacy concerns
- **Developer-friendly**: Typed frontend, modular backend, and good documentation

## Technical Feasibility

This project is technically feasible because:

- **Proven technology stack**: React, Express, and MongoDB are battle-tested technologies
- **Security is built in**: JWT authentication, bcrypt password hashing, and OTP verification are already implemented
- **Scalable data model**: The MongoDB schemas with indexes support the timeline, vitals, labs, and analytics features
- **Easy to get started**: The monorepo structure with scripts and diagrams makes onboarding straightforward

### Potential Challenges

- **Privacy and compliance**: Healthcare data needs special handling
- **OTP delivery**: Sometimes SMS services can be unreliable
- **Data quality**: The system is only as good as the data entered
- **Scaling**: Performance at large user volumes
- **Role management**: Getting the permissions right for each user type

### Mitigation Strategies

- **Security**: Role-based access control (RBAC), audit logs, encryption at rest
- **OTP reliability**: Fallback channels and rate limiting
- **Data quality**: Input validation and controlled vocabularies
- **Performance**: Database indexes, pagination, and pre-aggregated analytics
- **Access control**: Short-lived JWTs, strict CORS, and regular dependency updates

## Impact and Benefits

### For Patients
- Get immediate access to your complete health history
- Better continuity of care across different providers
- Come to consultations better prepared with your medical background

### For Doctors
- Make faster clinical decisions with patient history at your fingertips
- Spend less time tracking down records and more time with patients
- Structured data makes it easier to spot patterns and trends

### For Government/Public Health
- Get timely, de-identified insights to guide interventions
- Make data-driven decisions about resource allocation
- Inform policy with real health trends

### Broader Benefits

- **Social**: Reduces care fragmentation, empowers patients with data ownership
- **Economic**: Cuts administrative overhead, reduces duplicate tests, streamlines workflows
- **Environmental**: Fewer paper records and printouts through digital sharing

### Technologies Used
- React - The frontend framework
- React Router - Navigation
- TypeScript - Type safety
- Tailwind CSS - Styling
- Framer Motion - Animations
- Node.js - Backend runtime
- Express - API framework
- MongoDB - Database
- Mongoose - ODM

