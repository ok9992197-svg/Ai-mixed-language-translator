# Bilingual Subtitle Translator

A modern, AI-powered web application for translating subtitles into natural hybrid languages. Supports authentic code-switching for Hinglish, Spanglish, Taglish, Janglish, and Konglish.

## Features

- **Multi-Format Support**: Upload and translate SRT and VTT subtitle files
- **Hybrid Language Translation**: Seamlessly blend two languages with authentic code-switching
- **Project Management**: Organize translations by project
- **Live Editing**: Edit translations directly in the browser
- **One-Click Export**: Download translated subtitles in original format
- **Secure Authentication**: Email/password auth with Supabase
- **Responsive Design**: Works on desktop and mobile devices

## Supported Language Pairs

- **Hinglish** (English → Hindi + English)
- **Spanglish** (English → Spanish + English)
- **Taglish** (English → Tagalog + English)
- **Janglish** (English → Japanese + English)
- **Konglish** (English → Korean + English)

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth
- **AI Translation**: Claude 3.5 Sonnet via Edge Functions
- **Styling**: CSS Modules with custom design system

## Getting Started

### Prerequisites

- Node.js 16+
- Supabase account (database already configured)
- Anthropic API key (for Claude translations)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SUPABASE_ANON_KEY=your_anon_key
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Auth.jsx        # Authentication UI
│   ├── Dashboard.jsx   # Main app interface
│   ├── FileUpload.jsx  # Subtitle upload
│   ├── ProjectForm.jsx # Project creation
│   └── SubtitleEditor.jsx # Translation editor
├── lib/
│   ├── supabase.ts     # Supabase client
│   ├── authStore.ts    # Auth state management
│   └── subtitleParser.ts # SRT/VTT parsing
├── types/
│   └── index.ts        # TypeScript definitions
└── styles/
    └── globals.css     # Global styles
```

## How It Works

1. **Create Project**: Set up a new translation project and select language pair
2. **Upload File**: Upload SRT or VTT subtitle file
3. **Parse**: System parses subtitles and prepares for translation
4. **Edit**: Review and edit translations in the browser
5. **Export**: Download translated subtitles in original format

## Database Schema

- `language_pairs`: Available hybrid language options
- `translation_projects`: User projects
- `subtitle_batches`: Uploaded subtitle files
- `translated_subtitles`: Individual translated lines
- `user_preferences`: User settings

## Edge Functions

- **translate-subtitle**: AI-powered translation using Claude 3.5 Sonnet
  - Supports all hybrid language pairs
  - Maintains formatting and timestamps
  - Natural code-switching for authentic dialogue

## Security

- Row-Level Security (RLS) on all database tables
- User-owned project isolation
- Secure API key handling
- CORS protection on Edge Functions

## License

MIT 
