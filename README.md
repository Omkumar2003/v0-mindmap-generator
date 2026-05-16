# MindMap Pro 🗺️

Transform your documents into interactive mind maps with AI-powered insights.

## 🚀 Features

- **Smart Document Analysis** - AI automatically extracts key concepts from your documents
- **Interactive Mind Maps** - Drag, edit, expand, and explore your information visually
- **AI Summaries** - Get instant summaries and key points powered by Groq AI
- **Dark & Light Modes** - Switch between themes with a single click
- **Responsive Design** - Works seamlessly on mobile, tablet, and desktop
- **Secure & Private** - Row-level security ensures your data stays private

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: Groq API
- **Visualization**: React Flow
- **UI Components**: shadcn/ui

## 📖 Documentation

Detailed documentation is available:

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- **[FEATURE_TEST_REPORT.md](./FEATURE_TEST_REPORT.md)** - Detailed feature list and test results
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Complete implementation details
- **[VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md)** - Full verification checklist

## ⚡ Quick Start

### Prerequisites
- Node.js v18+
- pnpm (or npm/yarn)
- Supabase account (already configured)
- Groq API key (already configured)

### Installation & Running

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev

# Open http://localhost:3000 in your browser
```

## 🎯 Main Pages

### Public Pages
- `/` - Home page with features overview
- `/contact` - Contact us form and information
- `/auth/sign-up` - Create a new account
- `/auth/login` - Sign in to your account

### Protected Pages (Login Required)
- `/dashboard` - View and manage your documents
- `/editor/[id]` - Edit document content
- `/mindmap/[id]` - Interactive mind map viewer

## 🌙 Theme Support

Switch between light and dark modes:
1. Click the sun/moon icon in the header
2. Your preference is automatically saved
3. Applies to all pages and components

## 🔐 Security

- **Row Level Security (RLS)** - Your data is private
- **Email Verification** - Account verification required
- **Protected Routes** - Dashboard and editor require login
- **Secure Sessions** - Encrypted session management

## 📊 How It Works

1. **Create an Account** - Sign up with email and password
2. **Upload/Paste Content** - Add your document or text
3. **Generate Mind Map** - AI extracts concepts and creates a visual map
4. **Interact & Edit** - Drag nodes, edit labels, explore relationships
5. **View Summaries** - See AI-generated summaries and key points

## 🎨 Design Highlights

- **Modern UI** - Clean, professional interface
- **Responsive Layout** - Adapts to any screen size
- **Dark Mode** - Comfortable dark theme option
- **Smooth Animations** - Fluid transitions and interactions
- **Accessible** - WCAG AA compliant

## 🐛 Issues Fixed

✅ **Fixed**: 404 page after account creation  
✅ **Added**: Contact us page  
✅ **Added**: Dark mode and light mode support  
✅ **Verified**: All features working correctly  

## 📱 Responsive Design

- **Mobile (< 768px)** - Optimized touch experience
- **Tablet (768px - 1024px)** - 2-column layouts
- **Desktop (> 1024px)** - Full 3+ column layouts

## 🚀 Deployment

Ready for production deployment:

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

Deploy to Vercel with one click or use any Node.js hosting.

## 📚 API Endpoints

All endpoints require authentication:

```
GET  /api/documents              - List your documents
GET  /api/documents/[id]         - Get document details
PUT  /api/documents/[id]         - Update document
POST /api/generate-mindmap       - Generate mind map
GET  /api/mindmaps/[id]          - Get mind map data
```

## 🤝 Support

Have questions? Visit the `/contact` page or check the documentation files.

## 📝 License

This project is built with v0 and uses modern open-source technologies.

## 🎉 Ready to Use

The application is fully functional and ready for:
- Personal use
- Team collaboration
- Production deployment
- Further development

---

**Get started with MindMap Pro today!** 🗺️✨

Visit `http://localhost:3000` to begin.

For detailed setup instructions, see [QUICKSTART.md](./QUICKSTART.md).
