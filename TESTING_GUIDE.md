# Testing Guide for Markdown Kanban

This guide provides step-by-step instructions for testing the Markdown Kanban app.

## Prerequisites

Before testing, ensure you have the following installed:
- Node.js (v14 or later)
- npm or yarn
- A modern browser (Chrome, Edge, or Opera) that supports the File System Access API

## Running the App Locally

1. **Navigate to the project directory**:
   ```bash
   cd markdown-kanban
   ```

2. **Install dependencies** (if you haven't already):
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run web
   ```

4. **Open the app in your browser**:
   The app should automatically open in your default browser at `http://localhost:19006/`. If it doesn't, manually navigate to that URL.

## Testing Core Functionality

### 1. File Operations

#### Opening a File
1. Click the "Open File" button on the home screen
2. Select a Markdown file from your computer (you can use the sample.md file in the assets directory)
3. Verify that the file content is parsed and displayed as a Kanban board

#### Creating a New File
1. Click the "Create New File" button on the home screen
2. Choose a location and name for the new file in the file picker dialog
3. Verify that a new file is created with the default template
4. Verify that the new file is opened and displayed as a Kanban board

### 2. Kanban Board Functionality

#### Viewing Cards and Columns
1. Open a Markdown file with multiple headings and tasks
2. Verify that each heading becomes a column
3. Verify that each task becomes a card in the appropriate column
4. Verify that completed tasks (with `[x]`) are shown as checked

#### Expanding Cards
1. Click on a card to expand it
2. Verify that any subtasks are displayed
3. Click on the card again to collapse it

#### Toggling Task Completion
1. Click the checkbox on a card to toggle its completion status
2. Verify that the card's appearance changes to reflect its new status
3. Click the "Save" button
4. Verify that the changes are saved to the Markdown file

### 3. Theme Support

1. Click the theme toggle button in the header
2. Verify that the app switches between dark and light themes
3. Verify that the theme preference is remembered when you reload the app

## Testing PWA Features

### 1. Installing the PWA

1. Build the app for production:
   ```bash
   npm run build:web
   ```

2. Serve the built files locally:
   ```bash
   npx serve web-build
   ```

3. Open the app in Chrome or Edge
4. Look for the install icon in the address bar (or three-dot menu)
5. Click "Install" or "Install app"
6. Verify that the app installs and can be launched from your desktop/start menu

### 2. Offline Support

1. Install the PWA as described above
2. Open the app and load a file
3. Disconnect from the internet (turn off Wi-Fi or use browser DevTools to simulate offline)
4. Refresh the app
5. Verify that the app still loads and you can see your previously opened file

## Testing Browser Compatibility

Test the app in the following browsers:
- Chrome (desktop)
- Edge
- Opera
- Chrome (Android)

Note that Safari and Firefox do not currently support the File System Access API, so the app will not work properly in those browsers.

## Testing Deployment

1. Build the app for production:
   ```bash
   npm run build:web
   ```

2. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

3. Visit your GitHub Pages URL (typically `https://yourusername.github.io/markdown-kanban/`)
4. Verify that the app loads and functions correctly

## Reporting Issues

If you encounter any issues during testing, please report them with the following information:
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Browser and version
- Screenshots (if applicable)

## Performance Testing

To test performance with large files:
1. Create a large Markdown file with many headings and tasks
2. Open the file in the app
3. Monitor performance using browser DevTools
4. Check for any lag when:
   - Scrolling through columns
   - Expanding cards
   - Toggling task completion
   - Saving changes
