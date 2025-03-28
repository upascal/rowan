# Markdown Kanban

A task manager that automatically generates a Kanban board from a Markdown to-do list. Available as both a Progressive Web App (PWA) and a macOS application.

## Features

- **Markdown to Kanban**: Automatically converts Markdown headings to columns and list items to cards
- **Real-time Sync**: Changes to the Markdown file are immediately reflected in the Kanban board and vice versa
- **Drag and Drop**: Reorder cards within a column or move them between columns
- **Dark Mode**: Clean, minimal UI with a muted color palette
- **File Management**: Open existing Markdown files or create new ones
- **State Persistence**: Remembers your last opened file and settings

## How It Works

The app parses Markdown files with the following structure:

```markdown
# To Do
## Task Group 1
- [ ] Task 1 
  - [ ] Subtask 1.1
  - [x] Subtask 1.2

## Task Group 2
- [ ] Task 1
- [ ] Task 2 

# In Progress
- [ ] Task 2

# Done
- [x] Task 3
```

This generates a Kanban board with:
- Three columns: "To Do", "In Progress", and "Done"
- Cards for each task with checkboxes
- Nested subtasks within cards

## Getting Started

### Web Version (PWA)

The web version is available as a Progressive Web App that can be installed on any device with a modern browser.

1. Visit the app at: [https://yourusername.github.io/markdown-kanban](https://yourusername.github.io/markdown-kanban)
2. Use the "Install" button or your browser's install option to add it to your device
3. The app works offline and can access your local files through the File System Access API

For more details about the PWA version, see [web/README.md](web/README.md).

### macOS Version

#### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- macOS 10.15 or later

#### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/markdown-kanban.git
   cd markdown-kanban
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Run the app on macOS:
   ```
   npm run macos
   ```

#### Building for Distribution

To build the macOS app for distribution:

```
npm run build:macos
```

### Development

To run the web version locally:

```
npm run web
```

To build the web version for production:

```
npm run build:web
```

To deploy the web version to GitHub Pages:

```
npm run deploy
```

## Usage

1. **Open a Markdown File**: Click on a recent file or create a new one
2. **View as Kanban**: Your Markdown to-do list will be displayed as a Kanban board
3. **Edit Tasks**: Click on a card to expand it and view/edit subtasks
4. **Move Tasks**: Drag and drop cards to reorder or move between columns
5. **Toggle Completion**: Click the checkbox to mark a task as complete
6. **Save Changes**: Click the Save button to write changes back to the Markdown file

## Project Structure

```
markdown-kanban/
├── app/                  # Main application code
│   ├── components/       # UI components
│   │   ├── Board/        # Kanban board components
│   │   ├── Card/         # Card components
│   │   ├── common/       # Shared UI components
│   │   └── screens/      # App screens
│   ├── services/         # Core services
│   │   ├── fileSystem.ts # File operations
│   │   ├── markdownParser.ts # MD parsing logic
│   │   └── stateManager.tsx # App state management
│   ├── types/            # TypeScript definitions
│   └── utils/            # Helper functions
├── assets/               # Static assets
├── web/                  # PWA-specific files
│   ├── icons/            # PWA icons
│   ├── manifest.json     # Web app manifest
│   ├── offline.html      # Offline fallback page
│   ├── register-service-worker.js # Service worker registration
│   └── service-worker.js # Service worker for offline support
└── ...
```

## Technologies Used

### Common Technologies
- **TypeScript**: For type safety and better developer experience
- **Unified/Remark**: For Markdown parsing and serialization
- **React Native Draggable FlatList**: For drag and drop functionality
- **Expo**: For simplified development workflow

### PWA Version
- **File System Access API**: For reading and writing local files
- **Service Workers**: For offline support and caching
- **Web App Manifest**: For installable web app experience
- **LocalStorage**: For persisting app settings

### macOS Version
- **React Native macOS**: For building the native macOS desktop app

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the simplicity of Markdown and the visual organization of Kanban boards
- Built to provide a lightweight alternative to complex task management systems
