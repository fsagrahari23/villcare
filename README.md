# VoiceCare AI

VoiceCare AI is a multilingual, voice-first healthcare coordination platform built for low-literacy and underserved patient populations. It helps patients describe symptoms in their native language, converts those narratives into structured clinical information, recommends nearby health centers and relevant doctors, and supports remote doctor follow-up through report review and voice/video teleconsultation.

The project is built with Next.js App Router, MongoDB, Gemini, Sarvam AI, Pinecone, Cloudinary, and ZEGOCLOUD.

## Problem We Are Solving

### 1. Multilingual Voice-First Symptom Narratives for Low-Literacy Patients
Many patients cannot comfortably type medical complaints, do not know clinical vocabulary, or are more confident speaking in their native language. VoiceCare AI solves this by letting the patient speak naturally, then:

- transcribing the voice input
- translating it into English when needed
- converting the free-form narrative into structured triage data
- identifying risk level, symptoms, care recommendations, emergency escalation guidance, and likely specialties
- matching the case to nearby approved health centers and available doctors

This reduces friction at the first point of care and gives providers a cleaner clinical summary instead of an unstructured voice note.

### 2. Medication Adherence and Side-Effect Tracking Integrated with Teleconsults
Our approach is to keep follow-up connected to the original symptom journey instead of making adherence a separate disconnected workflow. In this project, that happens through:

- stored symptom analyses for longitudinal context
- uploaded medical reports with extracted findings
- AI-assisted report Q&A for better patient understanding
- doctor review notes and summaries on patient records
- live voice/video consultations for remote follow-up
- health center and doctor routing so the same case can move from symptom capture to consultation

This creates the foundation for adherence monitoring where a patient can report side effects during remote care, the doctor can review prior reports and summaries, and the platform can keep the care loop continuous rather than one-time.

## Solution Approach

VoiceCare AI follows a practical care-delivery flow:

1. A patient records symptoms by voice in a local language.
2. Sarvam AI performs speech-to-text and translation support.
3. Gemini converts the narrative into structured medical triage output.
4. The system stores the analysis and recommends nearby approved centers and relevant doctors.
5. The patient can upload medical reports for OCR-style extraction and AI-assisted interpretation.
6. Doctors review consultations and reports inside their workspace.
7. Voice or video teleconsultation is launched through ZEGOCLOUD.
8. Staff and admins govern the network by approving and monitoring health centers.

## User Roles and Flows

### Patient Flow

- Register and maintain a health profile
- Record symptoms in English, Hindi, Tamil, Telugu, or Kannada
- Receive structured AI analysis including symptoms, risk level, recommendations, suggested action, emergency care guidance, and care specialties
- Discover nearby approved health centers
- View matched doctors based on symptom intent and care needs
- Upload medical reports and ask questions against report context
- Join voice/video consultations
- Track health activity through dashboard stats and recent actions

### Doctor Flow

- Log in through a dedicated doctor portal
- View assigned or related consultations
- Join live voice/video consultation rooms
- Review patient medical reports
- Add doctor summaries and doctor notes
- Verify reviewed reports
- Use previous report context during remote follow-up

### Staff/Admin Flow

- Review pending health center registrations
- Approve or reject centers with audit logging
- Track approval metrics and trends
- Monitor center distribution and approval health through dashboards and map views
- Maintain trust in the provider network before patients are routed to centers

### Health Center Flow

- Register the center with compliance, identity, service, and location details
- Wait for staff approval
- Manage center profile and readiness status
- Onboard doctors under that center
- Define doctor specialization, languages, diseases handled, care needs, and available consultation modes
- Prepare video consultation capability for patient care

## Architecture Overview

### Frontend

- Next.js 16 with App Router
- React 19
- Tailwind CSS
- shadcn/ui component system
- Leaflet and React Leaflet for map experiences
- Recharts for staff analytics

### Backend

- Next.js Route Handlers as the application API layer
- MongoDB with Mongoose models
- JWT-based login flow with cookie-based session handling
- Cloudinary for report and asset storage
- Pinecone for report document retrieval

### AI and Communication Layer

- Sarvam AI for speech-to-text, translation, and text-to-speech
- Gemini for symptom analysis, report extraction, medical assistant chat, and report Q&A
- Gemini embeddings plus Pinecone for retrieval-augmented report conversations
- ZEGOCLOUD for voice and video teleconsultation rooms

## AI and LLM Pipeline

### Voice Narrative to Structured Triage

`Patient voice -> /api/voice/transcribe -> /api/ai/analyze -> SymptomAnalysis -> nearby health center and doctor matching`

What happens in this pipeline:

- the patient records audio from the browser
- Sarvam transcribes the audio
- Sarvam translation is used when the patient speaks in a non-English language
- Gemini returns strict structured JSON
- the result is saved as `SymptomAnalysis`
- the platform finds nearby approved centers and available doctors using both geospatial search and specialty matching

### Medical Report Understanding

`Upload report -> Cloudinary storage -> PDF/image extraction -> Gemini structured parsing -> Pinecone indexing -> doctor/patient Q&A`

What happens in this pipeline:

- the report is uploaded and stored
- PDF text is extracted or image content is sent to Gemini
- report metadata and findings are stored in `MedicalReport`
- report text is chunked and embedded
- vectors are indexed in Pinecone
- later questions are answered using retrieved report chunks plus structured database context

### Teleconsultation Flow

`Matched doctor -> consultation creation -> ZEGOCLOUD room/token generation -> live voice/video consult -> doctor review`

What happens in this pipeline:

- a consultation room is created server-side
- patient and doctor tokens are generated
- both sides receive room configuration
- doctor joins from the dashboard using `ZegoCallPanel`
- consultation status is updated through the API

## Role-to-Module Mapping

### Patient-facing pages

- `/`
- `/auth/login`
- `/auth/register`
- `/dashboard`
- `/voice-input`
- `/reports`
- `/map`
- `/chat`
- `/profile`

### Doctor-facing pages

- `/doctor/dashboard`
- `/consultations/[id]`

### Health center-facing pages

- `/healthcenter/dashboard`

### Staff/Admin-facing pages

- `/staff/dashboard`
- `/staff/pending-approvals`
- `/staff/analytics`
- `/staff/map`

## Key API Modules

### Authentication and profile

- `app/api/auth/register/route.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/profile/route.ts`
- `app/api/user/profile/route.ts`

### Voice and AI

- `app/api/voice/transcribe/route.ts`
- `app/api/voice/synthesize/route.ts`
- `app/api/ai/analyze/route.ts`
- `app/api/chat/route.ts`
- `app/api/analyses/route.ts`

### Reports and RAG

- `app/api/reports/upload/route.ts`
- `app/api/reports/route.ts`
- `app/api/reports/[id]/route.ts`
- `app/api/reports/[id]/chat/route.ts`
- `app/api/doctor/reports/[id]/route.ts`

### Consultations

- `app/api/consultations/route.ts`
- `app/api/consultations/[id]/route.ts`

### Health center and doctor management

- `app/api/healthcenters/me/route.ts`
- `app/api/healthcenters/doctors/route.ts`
- `app/api/healthcenters/doctors/[id]/route.ts`
- `app/api/hospitals/nearby/route.ts`

### Staff governance

- `app/api/staff/pending/route.ts`
- `app/api/staff/approve/[id]/route.ts`
- `app/api/staff/reject/[id]/route.ts`
- `app/api/staff/stats/route.ts`
- `app/api/staff/analytics/route.ts`
- `app/api/staff/centers/route.ts`

## Core Data Models

- `User`
  - supports `patient`, `staff`, `admin`, `healthcenter`, and `doctor`
- `HealthCenter`
  - stores provider profile, geo data, documents, services, approval status, and operating details
- `Doctor`
  - stores specialization, diseases handled, care needs, languages, availability, and consultation modes
- `SymptomAnalysis`
  - stores original transcript, translated transcript, structured AI triage result, and patient location
- `MedicalReport`
  - stores uploaded reports, extracted findings, risk factors, doctor review, and Pinecone namespace data
- `Consultation`
  - stores room, participants, tokens, call type, consultation status, and clinical notes
- `Conversation` and `ChatMessage`
  - support conversational AI experiences
- `ApprovalLog`, `Notification`, `RiskAlert`, `Case`
  - support governance, alerts, and operational tracking

## How the Matching Logic Works

The project does not only show nearby hospitals. It also attempts to route the patient to the right care context.

- health centers are filtered to approved and active facilities
- geospatial lookup is used when coordinates are available
- doctors are scored against AI-generated disease keywords and care specialties
- results are ranked by proximity and clinical match quality

This is important because the goal is not just discovery, but guided navigation from voice complaint to actionable care.

## Medication Adherence and Side-Effect Tracking Strategy

This repository already implements the core building blocks needed for adherence-aware remote care:

- symptom analysis history
- patient dashboards
- report upload and understanding
- doctor summaries and notes
- remote consultation sessions

The intended adherence workflow with this architecture is:

1. Patient describes symptoms or side effects by voice.
2. AI structures the issue and stores it as a reviewable case context.
3. Patient uploads prescriptions, tests, or follow-up reports.
4. Doctor reviews extracted findings and adds clinical notes.
5. Teleconsultation is started for intervention or follow-up.
6. The next extension is scheduled medication reminders, adherence logs, and side-effect check-ins tied to the same patient timeline.

So the platform is designed as a continuous care loop, not only as a one-time symptom checker.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- MongoDB and Mongoose
- Gemini
- Sarvam AI
- Pinecone
- Cloudinary
- ZEGOCLOUD
- Leaflet
- Recharts

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` with values for:

```env
MONGODB_URI=
GEMINI_API_KEY=
SARVAM_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
PINECONE_API_KEY=
ZEGOCLOUD_APP_ID=
ZEGOCLOUD_SERVER_SECRET=
ZEGOCLOUD_SERVER_URL=
```

### 3. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Current Strengths

- strong multi-role architecture
- native-language voice intake
- structured AI triage instead of raw transcript output
- doctor and health center matching
- report intelligence with RAG support
- live teleconsultation support
- approval workflow for trusted provider onboarding

## Future Extensions

- medication reminder scheduler
- explicit side-effect diary and adherence logs
- patient timeline across consultations, reports, and prescriptions
- family caregiver access flows
- stronger audit, consent, and production-grade authorization layers

## Summary

VoiceCare AI is not just a chatbot or transcription demo. It is a multi-role healthcare workflow system that connects voice-first patient intake, multilingual AI reasoning, provider discovery, medical document understanding, doctor review, and live teleconsultation in one architecture.

Its main value is that it translates unstructured patient speech into structured, reviewable, actionable care pathways for patients, doctors, health centers, and healthcare operations teams.
