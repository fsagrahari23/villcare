# VoiceCare AI - Voice-First Medical Triage Platform

A multilingual, voice-enabled medical triage platform designed for rural and low-literacy users. Built with Next.js, Node.js, and AI integration (Gemini, Sarvam AI).

## 🎯 Project Overview

VoiceCare AI democratizes healthcare access by enabling voice-first symptom recording and AI-powered medical analysis. The platform serves three user groups:

- **Patients**: Record symptoms via voice, get AI analysis, find nearby health centers
- **Healthcare Staff**: Review and approve hospital registrations
- **Administrators**: Manage staff, view analytics, configure platform settings

## ✨ Key Features

### Patient Features
- **Voice Input**: Record symptoms in native language (Hindi, Tamil, English, etc.)
- **AI Analysis**: Gemini-powered symptom analysis with structured output
- **Medical Reports**: Upload, analyze, and store medical documents
- **Health Map**: Locate nearby approved health centers within 5km radius
- **AI Chat**: Medical and general-purpose AI assistance
- **Health Dashboard**: Track checkups, recommendations, and health status
- **Risk Alerts**: High-risk condition detection and notifications

### Staff/Admin Features
- **Pending Approvals**: Review hospital registrations with document verification
- **Approval Workflow**: Approve/reject with reasons and timestamps
- **Staff Dashboard**: Quick stats on approvals and pending applications
- **Analytics**: Approval trends, center distribution, average approval time
- **Centers Map**: Visualize all health centers with status indicators
- **Approval History**: Full audit trail of all approvals/rejections

## 🏗️ Architecture

### Frontend (Next.js 16)
- **App Router** with file-based routing
- **Components**: Built with shadcn/ui components
- **Styling**: Tailwind CSS with medical-themed color palette
- **State Management**: React hooks + API calls via axios
- **Maps**: Leaflet integration for location features
- **Charts**: Recharts for analytics visualizations

### Backend (Node.js)
- **API Routes**: Next.js API routes for serverless functions
- **Database**: MongoDB with Mongoose (simulated in demo)
- **Authentication**: JWT tokens with httpOnly cookies
- **File Upload**: Cloudinary integration (ready)
- **Voice Processing**: Sarvam AI STT/TTS (ready for integration)
- **Medical Analysis**: Gemini API integration (ready)

## 📁 Project Structure

```
voicecare-ai/
├── app/
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Medical theme with design tokens
│   ├── auth/
│   │   ├── login/page.tsx       # Patient/Staff login
│   │   └── register/page.tsx    # User registration
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── logout/route.ts
│   │   └── staff/
│   │       ├── approve/[id]/route.ts
│   │       └── reject/[id]/route.ts
│   ├── dashboard/page.tsx       # Patient dashboard
│   ├── voice-input/page.tsx     # Voice recording & analysis
│   ├── reports/page.tsx         # Medical reports upload
│   ├── map/page.tsx             # Find health centers
│   ├── chat/page.tsx            # AI chat interface
│   ├── profile/page.tsx         # User profile & medical history
│   └── staff/
│       ├── dashboard/page.tsx   # Staff home
│       ├── pending-approvals/page.tsx
│       ├── analytics/page.tsx   # Analytics dashboard
│       └── map/page.tsx         # Staff map view
└── components/
    └── Navigation.tsx            # Role-based navigation

```

## 🎨 Design System

### Color Palette (Medical Professional Theme)
- **Primary Blue**: `#0066cc` - Main brand color
- **Healthcare Teal**: `#00aa88` - Accent color for approved/success
- **Medical Green**: `#00bb99` - Additional accent
- **Warning Yellow**: `#ffaa00` - Pending status
- **Destructive Red**: `#ff4444` - Errors/rejections
- **Neutrals**: White, light grays, dark grays, black

### Typography
- **Headings**: Geist Sans
- **Body**: Geist Sans
- **Monospace**: Geist Mono

### Components
- Built with shadcn/ui (Button, Card, Input, Label, etc.)
- Responsive design with Tailwind CSS
- Accessible with ARIA attributes

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Demo Credentials

**Patient Account**
- Email: `patient@example.com`
- Password: `password123`

**Staff Account**
- Email: `staff@example.com`
- Password: `password123`

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - Logout

### Staff Approval System
- `PUT /api/staff/approve/[id]` - Approve hospital
- `PUT /api/staff/reject/[id]` - Reject hospital

### Voice & Medical (Ready for Integration)
- `POST /api/voice/upload` - Upload audio
- `POST /api/voice/analyze` - STT + Gemini analysis
- `POST /api/reports/upload` - Upload medical document
- `POST /api/reports/analyze` - OCR + analysis

## 🔌 Integration Points

### Gemini API (Medical Analysis)
```
Model: google/gemini-2.0-flash
Features:
- Symptom analysis
- Risk assessment
- Recommendations generation
- Medical Q&A
```

### Sarvam AI (Voice Processing)
```
Features:
- Speech-to-text (STT) - Multiple Indian languages
- Text-to-speech (TTS) - Natural voice responses
- Language: Hindi, Tamil, Telugu, Kannada, English
```

### Cloudinary (File Storage)
```
- Medical report uploads
- Prescription images
- OCR document processing
```

## 📊 Data Models

### User
- id, name, email, phone
- role (patient/staff/admin)
- medical_history, allergies, conditions
- emergency_contact

### Case/Triage
- symptoms, transcript, audio_url
- ai_analysis, risk_level
- recommendations, date_created

### HealthCenter
- name, location, coordinates
- type (Hospital/UHC/Clinic)
- status (pending/approved/rejected)
- approval_staff, approval_date
- documents, contact_info

### Staff
- email, name, role
- assigned_health_centers
- approval_authority

## 🛡️ Security Features

- JWT authentication with httpOnly cookies
- Input validation and sanitization
- Secure API routes with middleware
- Environment variables for secrets
- CORS protection
- SQL injection prevention (Mongoose)

## 📱 Responsive Design

- Mobile-first design approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Touch-optimized buttons and forms
- Adaptive layouts for all screen sizes

## 🌐 Multilingual Support

Ready for:
- English
- Hindi
- Tamil
- Telugu
- Kannada

Extend in `components/Navigation.tsx` language selector

## 🚀 Deployment

### Vercel Deployment
```bash
# Connect GitHub repository
vercel --prod

# Or use git push to deploy automatically
```

### Environment Variables
```
NEXT_PUBLIC_API_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_key
SARVAM_API_KEY=your_sarvam_key
CLOUDINARY_NAME=your_cloudinary
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_secret
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

## 📈 Analytics & Monitoring

- Vercel Analytics integrated
- Staff dashboard with approval trends
- Charts for center distribution
- Approval rate metrics
- Geographic distribution analysis

## 🔄 Future Enhancements

- [ ] Real MongoDB integration
- [ ] Sarvam AI STT/TTS implementation
- [ ] Gemini API medical analysis
- [ ] Email/SMS notifications
- [ ] Real-time notifications (WebSockets)
- [ ] Doctor dashboard for patient queue
- [ ] Video consultations
- [ ] Prescription generation
- [ ] Insurance integration
- [ ] Emergency button with location sharing

## 👥 User Roles & Permissions

### Patient
- View own dashboard
- Record voice checkups
- Upload medical reports
- View nearby health centers
- Chat with AI assistant
- Manage profile

### Staff
- View pending applications
- Approve/reject hospitals
- View approved centers
- Generate reports
- View analytics
- Add notes to applications

### Admin
- All staff permissions
- Create/manage staff accounts
- Platform settings
- Configure center types
- View system analytics

## 📝 Notes for Integration

### Sarvam AI Integration
1. Get API key from Sarvam AI
2. Set `SARVAM_API_KEY` in environment
3. Update `app/voice-input/page.tsx` to call Sarvam STT
4. Handle language parameter based on user selection

### Gemini Integration
1. Get API key from Google AI Studio
2. Set `GEMINI_API_KEY` in environment
3. Update analysis logic to call Gemini
4. Implement structured output parsing

### MongoDB Integration
1. Set `MONGODB_URI` connection string
2. Create connection in backend
3. Replace simulated data with real queries
4. Implement proper error handling

## 🧪 Testing

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📧 Support

For issues and feature requests, please open an issue on GitHub.

---

**Built with ❤️ for rural healthcare access**

**VoiceCare AI - Healthcare at your voice**
