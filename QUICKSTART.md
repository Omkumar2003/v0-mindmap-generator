# MindMap Pro - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm (package manager)
- Supabase account connected
- Groq API key set

### Environment Variables
The following environment variables are already configured:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `GROQ_API_KEY` - Groq API key for AI features
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` - Auth callback URL (for development)

### Running the Application

```bash
# Install dependencies (if not already done)
pnpm install

# Start the development server
pnpm dev

# The app will be available at http://localhost:3000
```

## 📍 Main Pages & Routes

### Public Routes
- `/` - Home page with feature overview
- `/contact` - Contact us form and information
- `/auth/login` - Sign in page
- `/auth/sign-up` - Create new account
- `/auth/sign-up-success` - Email confirmation page
- `/auth/callback` - Email verification handler
- `/auth/error` - Authentication error page

### Protected Routes (Require Authentication)
- `/dashboard` - Main dashboard with document management
- `/editor/[id]` - Document editor
- `/mindmap/[id]` - Interactive mind map viewer

## 🎯 Using the Application

### 1. Sign Up
1. Go to `http://localhost:3000/auth/sign-up`
2. Enter email and password
3. Confirm password matches
4. Click "Sign up"
5. Check email for verification link
6. Click the link to verify your account

### 2. Create a Document
1. Go to `/dashboard` (redirected if authenticated)
2. Click "Create New Document"
3. Enter document title and content
4. Click "Create"

### 3. Generate a Mind Map
1. Open your document from the dashboard
2. Click "Generate Mind Map"
3. AI will extract concepts and create a visual map
4. The mind map will appear with an interactive visualization

### 4. Edit the Mind Map
- **Drag nodes** - Click and drag to move nodes around
- **Expand/Collapse** - Click the arrow on nodes to expand/collapse children
- **Edit labels** - Double-click a node to edit its label
- **Add nodes** - Click the "+" button to add child nodes
- **Delete nodes** - Click the trash icon to remove nodes
- **Zoom** - Use scroll wheel or pinch to zoom
- **Pan** - Click and drag the canvas to pan

### 5. View Summaries
- AI-generated summaries appear in the right sidebar
- Shows key points extracted from your document
- Updates when mind map changes

### 6. Toggle Dark Mode
- Click the sun/moon icon in the header to switch themes
- Preference is saved automatically

## 🔑 Key Features Explained

### Smart Document Analysis
- Upload or paste document text
- AI automatically extracts key concepts
- Creates hierarchical relationships between concepts

### Interactive Mind Maps
- Visual representation of document structure
- Fully editable and interactive
- Supports multiple levels of hierarchy
- Real-time visualization updates

### AI Summaries
- Automatic summarization of documents
- Key points extraction
- Powered by Groq AI for fast processing

### Dark Mode
- System preference detection
- Manual toggle in header
- Persistent across sessions
- Full theme coverage for all components

## 🛠️ API Endpoints

### Documents
```
GET /api/documents
- Fetch all user documents
- Returns: Array of documents

GET /api/documents/[id]
- Fetch specific document
- Returns: Document object

PUT /api/documents/[id]
- Update document content
- Body: { title: string, content: string }
- Returns: Updated document
```

### Mind Maps
```
POST /api/generate-mindmap
- Generate mind map from document
- Body: { documentId: string, content: string }
- Returns: Generated mind map structure

GET /api/mindmaps/[id]
- Fetch generated mind map
- Returns: Mind map data with nodes and edges
```

## 🎨 Theme Customization

Colors are defined in `app/globals.css` using CSS custom properties:

### Light Mode (Default)
- Background: White
- Foreground: Dark gray/black
- Primary: Dark color
- Secondary: Light gray
- Accent: Light accent color

### Dark Mode
- Background: Dark gray/black
- Foreground: White
- Primary: Light color
- Secondary: Medium gray
- Accent: Bright accent color

Toggle dark mode by clicking the sun/moon icon in the header.

## 📱 Responsive Design

The application is fully responsive:
- **Mobile** (< 768px) - Single column layout, touch-optimized
- **Tablet** (768px - 1024px) - 2-column layout where appropriate
- **Desktop** (> 1024px) - Full 3+ column layouts

## 🔒 Security

All user data is protected by:
- **Row Level Security (RLS)** - Users can only access their own data
- **Authentication** - Email and password required
- **Email Verification** - Account confirmed via email link
- **HTTPS** - Encrypted transmission in production

## 🐛 Troubleshooting

### "404 Page Not Found"
- Make sure you're accessing the correct URL
- If after sign-up, check your email for verification link
- Once verified, you'll be able to access the dashboard

### Dark Mode Not Working
- Check if your browser supports localStorage
- Clear localStorage and reload: `localStorage.clear()`
- The theme preference is saved in `localStorage` with key `"theme"`

### Mind Map Not Generating
- Ensure `GROQ_API_KEY` is set in environment variables
- Check browser console for error messages
- Verify document content is not empty
- Try with a different document

### Can't Log In
- Check that your email is verified (check spam folder)
- Verify email and password are correct
- Try signing up with a different email

## 📧 Support

For issues or questions:
- Visit `/contact` to send a message
- Check the error messages in your browser console
- Review the `FEATURE_TEST_REPORT.md` for detailed feature information

## 🎓 Learning Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Flow Documentation](https://reactflow.dev)
- [Groq API Documentation](https://console.groq.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

Enjoy using MindMap Pro! 🗺️
