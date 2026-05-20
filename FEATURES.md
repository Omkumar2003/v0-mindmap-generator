# MindMap Pro - Complete Feature Implementation

## 1. Database Schema Updates

### New Columns Added:
- `profiles.is_admin` - Boolean flag for admin access control (default: FALSE)
- `mindmaps.nodes` - JSONB array storing all node data
- `mindmaps.edges` - JSONB array storing all edge/connection data
- `mindmaps.last_autosave` - Timestamp of last auto-save

### RLS Policies:
All tables have Row Level Security enabled:
- Users can only access their own documents
- Users can only access their own mindmaps
- Profiles are protected by user ID

## 2. Auto-Save Functionality

### How It Works:
- Every 5 seconds, if mindmap exists and has been modified, auto-save triggers
- Auto-save endpoint: `POST /api/mindmaps/[id]/autosave`
- Stores nodes, edges, and root_node in database
- Shows "Auto-saving..." then "Saved" indicator in UI

### Features:
- Non-blocking - doesn't prevent user interaction
- Debounced with 5-second interval
- Status indicator in navbar (yellow = saving, green = saved)
- Automatic clearing after 2 seconds

### Code Location:
```
app/mindmap/[id]/page.tsx - useEffect hook and autoSaveMindMap function
app/api/mindmaps/[id]/autosave/route.ts - Auto-save endpoint
```

## 3. Protected Routes & Authentication

### Admin Protection:
- `/admin` - Admin dashboard (protected via layout.tsx)
- Admin layout checks for authenticated user + is_admin = true
- Non-admin users redirected to dashboard
- Non-authenticated users redirected to sign-in

### Route Protection:
All mindmap pages are protected:
- Check for authenticated user
- Verify user owns the document/mindmap
- Return 401/403 on unauthorized access

## 4. Admin Page & User Management

### Admin Dashboard Features:
- **Location**: `/admin`
- **Protected**: Server-side layout validation + client-side checks
- **User Table**: Displays all users with email, status, join date
- **Admin Badge**: Shows which users have admin privileges
- **Toggle Admin**: Make/remove admin status for users
- **Self-Protection**: Cannot remove your own admin status

### API Endpoints:
- `GET /api/admin/users` - Fetch all users (admin only)
- `PUT /api/admin/users` - Update user admin status (admin only)

### User Columns Displayed:
- Email (with admin badge if applicable)
- Status (Admin or User badge)
- Join Date
- Actions (Make Admin / Remove Admin button)

## 5. Admin Seeding & Role-Based Access

### Initial Setup:
Use `POST /api/admin/setup` to create first admin user:
```bash
POST /api/admin/setup
{
  "adminEmail": "admin@gmail.com",
  "adminPassword": "123456789"
}
```

### Security:
- Only one admin account can be created via setup endpoint
- Subsequent admins must be created via admin panel
- All admin checks verify `is_admin = true` in profiles table

### Demo Credentials (Manual Setup):
1. Sign up with: `admin@gmail.com` / `123456789`
2. Run setup API or manually set `is_admin = true` in database for that user
3. Can then access `/admin` page

## 6. Mindmap Export as Image

### Export Functionality:
- **Button**: "Export Image" button in mindmap navbar (when nodes exist)
- **Format**: PNG image with white background
- **Resolution**: 2x scale for high quality
- **Filename**: `{title}-{date}.png`

### Implementation:
- Uses html2canvas library (installed: `html2canvas 1.4.1`)
- Captures React Flow visualization
- Auto-downloads with timestamp

### Code Location:
```
lib/mindmap-export.ts - exportMindMapAsImage function
app/mindmap/[id]/page.tsx - handleExportAsImage handler
```

## 7. Mindmap Data Persistence

### Saving Strategy:

#### Auto-Save (Every 5 seconds):
- Stores nodes and edges to database
- Called via auto-save endpoint
- Non-blocking, silent save

#### Manual Save:
- "Save Mind Map" button in navbar
- Shows alert on success/failure
- Creates new mindmap if doesn't exist
- Updates existing mindmap if already saved

### Data Stored:
```typescript
{
  nodes: Node[] - Array of all mindmap nodes
  edges: Edge[] - Array of all connections
  root_node: Node[] - Copy of nodes for compatibility
  updated_at: timestamp
  last_autosave: timestamp
}
```

### Database Tables:
- `documents` - User's documents
- `mindmaps` - Mindmap data linked to documents
- Relationship: One document can have one mindmap

## 8. Multiple Mindmap Files

### Current Implementation:
- Dashboard shows all user documents
- Each document can have ONE associated mindmap
- Documents are listed with creation date and title

### Structure:
```
User
  └─ Documents (multiple)
      └─ Mindmaps (one per document)
```

### Accessing Mindmaps:
1. Go to Dashboard
2. Click on a document
3. Document ID is used to load/create associated mindmap

## API Endpoints Summary

### Documents:
- `GET /api/documents` - List user's documents
- `POST /api/documents` - Create new document
- `GET /api/documents/[id]` - Get document
- `PUT /api/documents/[id]` - Update document

### Mindmaps:
- `GET /api/mindmaps/[id]` - Get mindmap with summaries
- `PUT /api/mindmaps/[id]` - Update mindmap
- `POST /api/mindmaps/[id]/autosave` - Auto-save nodes/edges

### Admin:
- `GET /api/admin/users` - List all users (admin only)
- `PUT /api/admin/users` - Update user admin status (admin only)
- `POST /api/admin/setup` - Create first admin account
- `GET /api/admin/setup` - Check if admin exists

## Security Considerations

1. **Authentication**: All routes require valid Supabase auth session
2. **Authorization**: RLS policies enforce user ownership
3. **Admin Role**: Checked via `is_admin` column in profiles
4. **Self-Protection**: Admins cannot demote themselves
5. **Protected Routes**: Server-side layout checks for admin pages

## Testing the Features

### Test Auto-Save:
1. Create/generate mindmap
2. Add/edit nodes
3. Check status indicator
4. Verify data persists by refreshing page

### Test Admin Features:
1. Create admin account via setup endpoint
2. Sign in with admin account
3. Visit `/admin` - should see user table
4. Toggle admin status for test user
5. Try accessing `/admin` as non-admin - should redirect

### Test Export:
1. Generate mindmap with multiple nodes
2. Click "Export Image" button
3. Check downloads folder for PNG file
4. Verify image quality and content

### Test Protected Routes:
1. Try accessing `/admin` while logged out - redirects to signin
2. Try accessing `/admin` as non-admin user - redirects to dashboard
3. Try accessing mindmap of another user - should get 404 via API
