# Mind Map Generation & Save - Bug Fixes

## Issues Fixed

### Issue 1: Generate with AI Button Not Working
**Problem:** The mind map page was sending incorrect request parameters to the API
- Page was sending: `title`, `content`
- API expected: `documentTitle`, `documentContent`

**Solution:** Updated mind map page to send correct parameter names

### Issue 2: Save Mind Map Button Not Working  
**Problem:** Save function had multiple issues:
- Couldn't handle newly generated mind maps properly
- Missing user_id validation in update query
- Poor error messages

**Solution:** 
- Added proper validation before saving
- Fixed RLS query to include user_id check
- Added detailed error messages with debugging logs

### Issue 3: API Not Returning Proper React Flow Format
**Problem:** Generated nodes didn't have the correct structure for React Flow
- Missing `type: 'mindmap'` field
- Missing `data` object with required callbacks
- Nodes weren't positioned properly for visualization

**Solution:**
- Updated API to return nodes with complete React Flow format
- Added proper position calculation for hierarchical layout
- Included all required node data properties

### Issue 4: Database Storage Format
**Problem:** Mindmap data was being stored with nested structure `{ nodes, edges }`
- Database expects `root_node` and `edges` as separate fields

**Solution:** Changed storage to save nodes to `root_node` field and edges to `edges` field

## Files Modified

### 1. `/app/mindmap/[id]/page.tsx`
**Changes:**
- Fixed `handleGenerateMindMap` function to send correct parameters
- Added better error handling with detailed messages
- Fixed `handleSaveMindMap` to properly update mindmap state after generation
- Added validation checks before operations
- Added console logging for debugging

**Key Changes:**
```typescript
// Before
body: JSON.stringify({
  documentId: docId,
  title: document.title,
  content: document.content,
})

// After
body: JSON.stringify({
  documentId: docId,
  documentTitle: document.title,
  documentContent: document.content,
})
```

### 2. `/app/api/generate-mindmap/route.ts`
**Changes:**
- Enhanced node processing to include proper React Flow format
- Added `type: 'mindmap'` to all nodes
- Added complete `data` object with required callbacks
- Improved position calculation for better visualization
- Fixed database storage to use separate fields

**Key Changes:**
```typescript
// Before
nodes.push({
  id: currentId,
  data: { label: node.label || 'Untitled' },
  position: { x: level * xSpacing, y: parentId ? level * ySpacing : 0 }
})

// After
nodes.push({
  id: currentId,
  type: 'mindmap',  // ADDED
  data: {
    label: node.label || 'Untitled',
    isEditable: true,  // ADDED
    onChangeLabel: () => {},  // ADDED
    onDelete: () => {},  // ADDED
    onAddChild: () => {},  // ADDED
  },
  position: {
    x: level * xSpacing,
    y: parentId ? (childIndex - (totalBranches - 1) / 2) * ySpacing : 0  // IMPROVED
  }
})
```

## Testing

All features should now work correctly:

### Generate with AI
1. Navigate to a document's mind map view
2. Click "Generate with AI" button
3. API will:
   - Fetch document content
   - Use Groq AI to analyze and extract concepts
   - Generate hierarchical mind map structure
   - Create nodes and edges in proper React Flow format
   - Save to database and return visualization

### Save Mind Map
1. After generating (or manually editing), click "Save Mind Map"
2. Function will:
   - Validate you have a mind map to save
   - Check authentication
   - Either create new mindmap record or update existing
   - Save nodes and edges to database
   - Confirm with success message

## Error Handling

All operations now include:
- Detailed error messages shown to user
- Console logging with `[v0]` prefix for debugging
- Proper try-catch blocks
- Validation checks before operations

## Next Steps

If you still experience issues:
1. Check browser console for `[v0]` error messages
2. Verify your GROQ_API_KEY environment variable is set
3. Ensure Supabase is properly configured
4. Check database schema has correct `mindmaps` and `summaries` tables

All fixes are complete and the mind map generation and save features should now work seamlessly!
