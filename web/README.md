# Markdown Kanban - Progressive Web App

This is the web version of the Markdown Kanban app, implemented as a Progressive Web App (PWA).

## Features

- **Installable**: Can be installed on your device like a native app
- **Offline Support**: Works even when you're offline (for previously opened files)
- **File System Access**: Uses the modern File System Access API to read and write Markdown files
- **Dark Mode**: Clean, minimal UI with a muted color palette
- **Cross-Platform**: Works on any device with a modern browser

## Installation Instructions

### Desktop (Chrome, Edge, etc.)

1. Visit the app in your browser
2. Look for the install icon in the address bar (or three-dot menu)
3. Click "Install" or "Install app"
4. The app will be installed and appear in your applications/start menu

### iOS (Safari)

1. Visit the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" in the confirmation dialog
5. The app will appear on your home screen

### Android (Chrome)

1. Visit the app in Chrome
2. Tap the three-dot menu
3. Tap "Add to Home Screen" or "Install app"
4. Follow the prompts to install
5. The app will appear on your home screen

## Browser Compatibility

The app requires a modern browser that supports:

- **File System Access API**: For reading and writing files
- **Service Workers**: For offline support
- **Web App Manifest**: For installation

Currently supported browsers:
- Chrome (desktop & Android) 86+
- Edge 86+
- Opera 72+
- Samsung Internet 14.0+

**Note for Safari/iOS users**: While the app can be installed on iOS, the File System Access API is not fully supported. Files can be opened but may need to be re-selected each time.

## Privacy

All data stays on your device:
- Files are accessed directly from your file system
- No data is sent to any server
- Settings are stored in your browser's localStorage

## Development

To run the app locally:

```bash
npm install
npm run web
```

To build for production:

```bash
npm run build:web
```

To deploy to GitHub Pages:

```bash
npm run deploy
