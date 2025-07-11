# Course End Survey

A lightweight, completely dynamic web application for collecting course end survey feedback. Built with Next.js, TypeScript, and Google Sheets integration - **NO PREDEFINED DATA**.

## 🌐 GitHub Codespaces Quick Start

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/LuciferDinesh/student-feedback-system)

**One-click setup in the cloud!** This repository is fully configured for GitHub Codespaces with:
- ✅ Pre-installed Node.js 20
- ✅ Automatic dependency installation
- ✅ Auto-forwarded port 3000
- ✅ VS Code extensions for TypeScript and Tailwind CSS
- ✅ Development server auto-start

### Using Codespaces:
1. Click the "Open in GitHub Codespaces" badge above
2. Wait for the environment to set up (2-3 minutes)
3. Configure your `.env.local` with Google Sheets credentials
4. The development server starts automatically at `localhost:3000`

## ✨ Key Features

- 📱 **Mobile-first responsive design**
- 🔄 **100% Dynamic - Zero hardcoded values**
- ⚡ **Real-time updates (30 seconds for options, 2 minutes for config)**
- 📊 **Single Google Sheet admin configuration**
- 🎯 **Dynamic question loading**
- ✅ **Form validation and confirmation**
- 🔥 **Lightweight codebase**

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your Google Sheets credentials:
   ```
   GOOGLE_CLIENT_EMAIL=your-service-account-email
   GOOGLE_PRIVATE_KEY=your-private-key
   GOOGLE_SPREADSHEET_ID=your-sheet-id
   ```

3. **Run the application**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📊 Google Sheet Configuration

### Single Sheet Structure: "Admin Config"
| Branch | Year | Section | Subject | Teacher | Question1 | Question2 | ... |
|--------|------|---------|---------|---------|-----------|-----------|-----|
| CSE | 1st Year | A | Mathematics | Dr. Smith | How would you rate... | How clear are... | ... |
| ECE | 2nd Year | A | Electronics | Prof. Kumar | How would you rate... | How clear are... | ... |
| CYBER SECURITY | 3rd Year | B | Network Security | Prof. Anderson | How would you rate... | How clear are... | ... |

### ⚡ Dynamic Updates
- **Add any new branch, year, or section** → Appears automatically within 30 seconds
- **No code changes required** for new data
- **Real-time polling** keeps options fresh

## 🎯 Ultra-Fast Updates

- **Options refresh**: Every 30 seconds
- **Config refresh**: Every 2 minutes  
- **Manual refresh**: Click "Refresh Options" button
- **Live status**: Shows available branches/years/sections count

## 🏗️ Project Structure (Lightweight)

```
src/
├── app/
│   ├── api/
│   │   ├── admin-config/       # Fetch configuration from single sheet
│   │   ├── get-options/        # Dynamic dropdown options  
│   │   └── submit-enhanced-feedback/  # Submit responses
│   ├── enhanced-page.tsx       # Main student interface (fully dynamic)
│   └── layout.tsx              # App layout
└── lib/
    └── enhanced-data.ts        # Types only
```

## 🔧 Environment Variables

```bash
# Google Sheets Integration (Required)
GOOGLE_CLIENT_EMAIL=your-service-account-email
GOOGLE_PRIVATE_KEY=your-private-key
GOOGLE_SPREADSHEET_ID=your-sheet-id

# Next.js (Optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 💡 Usage

1. **Students**: Select branch/year/section → Answer questions → Submit
2. **Admins**: Add data to Google Sheet → Automatically appears in app
3. **No maintenance**: System is fully self-updating

## 🎉 Zero Configuration

- ✅ **No hardcoded branches/years/sections**
- ✅ **No manual code updates needed**
- ✅ **Instant reflection of Google Sheet changes**
- ✅ **Completely dynamic and responsive**

## License

This project is licensed under the MIT License.

