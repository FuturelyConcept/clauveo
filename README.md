# Clauveo - Tauri Version

A privacy-first screen recording and AI-powered code generation tool built with Tauri, React, and Rust.

## 🚀 Features

- **Privacy-First**: Everything processed locally, no data tracking
- **AI-Powered**: Generate code solutions using OpenAI GPT models
- **Smart Processing**: OCR, audio transcription, and UI analysis
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- **Cross-Platform**: Runs on Windows, macOS, and Linux

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Rust with Tauri 2
- **UI Framework**: Tailwind CSS v4 + Lucide Icons
- **AI Integration**: OpenAI API (Whisper + GPT-4)
- **Package Manager**: Bun (recommended) or npm

## 📋 Prerequisites

- **Rust**: 1.70.0 or later
- **Bun**: Latest version (recommended) or Node.js 18+
- **OpenAI API Key**: Required for AI features

## 🛠️ Development Setup

1. **Install Dependencies**
   ```bash
   bun install
   ```

2. **Start Development Server**
   ```bash
   bun run tauri dev
   ```

3. **Build for Production**
   ```bash
   bun run tauri build
   ```

## 🔧 Configuration

1. Launch the application
2. Go to Settings
3. Enter your OpenAI API key
4. Configure recording preferences
5. Test the API connection

## 🎯 How to Use

1. **Setup**: Configure your API keys in Settings
2. **Record**: Click "Start Recording" and demonstrate your issue (60s max)
3. **Process**: The app extracts frames, transcribes audio, and analyzes UI
4. **Generate**: AI creates code solutions based on your context
5. **Implement**: Copy the generated code and apply the fixes

## 📁 Project Structure

```
clauveo-tauri/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities & API clients
│   ├── types/             # TypeScript types
│   └── App.tsx            # Main application
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── commands.rs    # Tauri commands
│   │   ├── recording.rs   # Recording logic
│   │   ├── types.rs       # Rust types
│   │   └── main.rs        # Entry point
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
└── package.json           # Frontend dependencies
```

## 🔒 Privacy Features

- **Local Processing**: All video/audio processing happens on your machine
- **Immediate Cleanup**: Original files deleted after metadata extraction
- **No Tracking**: Zero telemetry or data collection
- **API Keys**: Stored securely in local storage only
- **Metadata Only**: Only processed metadata sent to AI services

## 📊 Technical Details

### Frontend Stack
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- React Syntax Highlighter for code display
- Tesseract.js for OCR processing

### Backend Stack
- Tauri 2 for native functionality
- Rust for backend logic
- Tokio for async processing
- Serde for serialization
- UUID for session management

### AI Integration
- OpenAI GPT-4 for code generation
- Whisper for audio transcription
- Custom prompt engineering for context
- Intelligent metadata extraction

## 🧪 Development Commands

```bash
# Start development with hot reload
bun run tauri dev

# Build for production
bun run tauri build

# Frontend only development
bun run dev

# Type checking
bun run build

# Install dependencies
bun install
```

## 🔧 Build Configuration

The app is configured to build for all major platforms:
- **Windows**: .msi installer
- **macOS**: .dmg installer + .app bundle
- **Linux**: .deb package + .AppImage

## 📝 Environment Variables

No environment variables required. All configuration is done through the UI.

## 🐛 Troubleshooting

1. **API Key Issues**: Ensure OpenAI API key is valid and has sufficient credits
2. **Recording Permissions**: Grant screen recording and microphone permissions
3. **Build Issues**: Ensure Rust and Tauri CLI are properly installed
4. **OCR Performance**: Processing time depends on video complexity

## 🚀 Future Enhancements

- Claude API integration
- Multiple AI model support
- Advanced video analysis
- Team sharing features
- Integration with popular IDEs

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues and questions, please create an issue in the GitHub repository.

---

Built with ❤️ using Tauri, React, and Rust