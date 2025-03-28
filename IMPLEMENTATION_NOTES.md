# Implementation Notes

## What's Been Implemented

### Core Functionality
- ✅ Markdown parsing with unified/remark
- ✅ Kanban board data model
- ✅ File system operations using the File System Access API
- ✅ State management with React Context API
- ✅ Dark/light theme support

### UI Components
- ✅ Common components (Button, Checkbox)
- ✅ Card component with subtasks
- ✅ Column component
- ✅ Board component
- ✅ Home screen
- ✅ Board screen

### PWA Features
- ✅ Web manifest
- ✅ Service worker for offline support
- ✅ Offline fallback page
- ✅ Service worker registration
- ✅ LocalStorage for settings

### Documentation
- ✅ Main README with project overview
- ✅ PWA-specific README
- ✅ Implementation notes (this file)
- ✅ Icon and screenshot placeholders

## What's Left to Do

### UI Refinement
- [ ] Implement drag and drop between columns
- [ ] Add keyboard shortcuts
- [ ] Improve accessibility
- [ ] Add loading indicators
- [ ] Add error handling UI

### Assets
- [ ] Create app icons in various sizes
- [ ] Create screenshots for the app store
- [ ] Design a proper app logo

### Testing
- [ ] Write unit tests for core functionality
- [ ] Write component tests
- [ ] Test on different browsers and devices
- [ ] Test offline functionality

### Deployment
- [ ] Set up GitHub Pages for hosting
- [ ] Configure CI/CD pipeline
- [ ] Create a proper release process

### Additional Features
- [ ] Add support for multiple boards
- [ ] Implement file autosave
- [ ] Add support for due dates
- [ ] Add search functionality
- [ ] Add export options (PDF, HTML)

## Development Workflow

1. **Local Development**:
   ```
   npm run web
   ```

2. **Building for Production**:
   ```
   npm run build:web
   ```

3. **Deploying to GitHub Pages**:
   ```
   npm run deploy
   ```

## Architecture Notes

### File System Access API

The app uses the File System Access API to read and write Markdown files directly from the user's file system. This API is supported in modern browsers like Chrome, Edge, and Opera, but not in Safari or Firefox.

Key components:
- `fileSystem.ts`: Handles file operations
- `pickFile()`: Opens a file picker dialog
- `createFile()`: Creates a new file
- `readFile()`: Reads a file's contents
- `writeFile()`: Writes to a file

### Markdown Parsing

The app uses the unified/remark ecosystem to parse Markdown files into a Kanban board data model and vice versa.

Key components:
- `markdownParser.ts`: Handles Markdown parsing and serialization
- `parseMarkdownToKanban()`: Converts Markdown to a Kanban board
- `kanbanToMarkdown()`: Converts a Kanban board to Markdown

### State Management

The app uses React's Context API for state management, with a custom hook for accessing the state.

Key components:
- `stateManager.tsx`: Manages the app state
- `useAppState()`: Custom hook for accessing the state
- `AppProvider`: Context provider component

## Browser Compatibility

The app requires a modern browser that supports:
- File System Access API
- Service Workers
- Web App Manifest

Currently supported browsers:
- Chrome (desktop & Android) 86+
- Edge 86+
- Opera 72+
- Samsung Internet 14.0+

Safari and Firefox do not currently support the File System Access API, so the app will not work properly in those browsers.
