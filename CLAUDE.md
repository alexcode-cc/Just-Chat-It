# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Just Chat It is a modern multi-AI chat desktop application built with Electron + Vue 3 + Vuetify architecture, enabling simultaneous conversations with multiple AI services (ChatGPT, Claude, Gemini, etc.).

## Development Commands

### Project Setup and Development
```bash
# Install dependencies
npm install

# Start development mode
npm run dev

# Build application
npm run build

# Package desktop application
npm run dist
```

### Testing
```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Generate test coverage report
npm run test:coverage
```

### Code Quality
```bash
# ESLint check
npm run lint

# Auto-fix code format
npm run lint:fix

# Prettier formatting
npm run format
```

## Technical Architecture

### Core Technology Stack
- **Electron**: Cross-platform desktop application framework
- **Vue 3**: Frontend framework (using Composition API)
- **Vuetify 3**: Material Design component library
- **TypeScript**: Type-safe development
- **Vite**: Modern build tool
- **Pinia**: State management
- **SQLite**: Local database

### Architecture Patterns
- **Main Process**: Handles application lifecycle, multi-window management, system integration, database operations
- **Renderer Process**: Vue 3 application logic, UI rendering, WebView integration
- **IPC Communication**: Type-safe communication between main and renderer processes

## Project Structure

```
src/
├── main/                   # Electron main process
│   ├── window-manager.ts   # Window management
│   ├── ipc-handlers.ts     # IPC event handlers
│   ├── system-integration/ # System integration (tray, hotkeys, clipboard)
│   └── database/           # SQLite database management
├── renderer/               # Vue renderer process
│   ├── components/         # Vue components
│   │   ├── common/         # Common components
│   │   ├── dashboard/      # Main dashboard
│   │   ├── chat/           # Chat-related components
│   │   ├── compare/        # AI comparison features
│   │   ├── prompts/        # Prompt management
│   │   └── settings/       # Settings interface
│   ├── stores/             # Pinia state management
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── styles/             # Style files (including Liquid Glass effects)
├── shared/                 # Shared code
│   ├── types/              # Shared type definitions
│   ├── constants/          # Constants definitions
│   └── utils/              # Shared utility functions
└── assets/                 # Static resources
```

## Core Feature Implementation

### Multi-Window Management
- Independent BrowserWindow for each AI service
- WebView integration for AI service web interfaces
- Persistent storage of window state and position

### State Management Architecture
Main Pinia Stores:
- **AIStore**: AI service management, window state, quota tracking
- **ChatStore**: Chat session management, message records
- **PromptStore**: Prompt library management
- **SettingsStore**: Application settings

### Database Design
SQLite Tables:
- `ai_services`: AI service configuration
- `chat_sessions`: Chat sessions
- `chat_messages`: Chat messages
- `prompts`: Prompt library
- `app_settings`: Application settings

### Liquid Glass Visual Effects
- Implemented using backdrop-filter and CSS variables for glassmorphism effect
- Dynamic light and shadow tracking mouse position
- Integration with Vuetify theme system

## Development Standards

### File Naming Conventions
- Vue components: PascalCase (e.g., `ChatWindow.vue`)
- Utility functions: camelCase (e.g., `formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `AI_SERVICES.ts`)
- Type definitions: PascalCase (e.g., `AIService.ts`)

### TypeScript Requirements
- Enable strict mode
- Explicit type definitions, avoid using `any`
- Prefer interfaces over type aliases
- Use type-safe channels for IPC communication

### Vue 3 Standards
- Use Composition API
- Explicitly define Props and Emits
- Use ref/reactive for reactive data

### CSS Standards
- Use SCSS preprocessor
- BEM naming convention
- CSS variables for theme management
- Responsive design principles

## Important Development Notes

### WebView Integration
- Use independent WebView for each AI service to load official web pages
- Implement offline access functionality, save chat history to local database
- Handle network errors and service unavailability states

### System Integration Features
- Global hotkey registration and management
- System tray integration
- Clipboard content monitoring
- Desktop notifications

### Performance Considerations
- Memory management for multiple windows
- WebView resource cleanup
- Hardware acceleration for Liquid Glass effects
- Virtualized scrolling for large chat histories

### Error Handling
- Layered error handling: UI layer, business layer, data layer, system layer
- Graceful degradation to offline mode
- User-friendly error message display

## Testing Strategy

- **Unit Tests**: Store actions, utility functions, data models (Vitest)
- **Integration Tests**: IPC communication, database operations, WebView integration
- **E2E Tests**: Complete user flows (Playwright for Electron)
- **Visual Regression Tests**: Liquid Glass effect consistency

## Git Commit Conventions

This project follows the **AngularJS Git Commit Message Conventions** to ensure clear, structured, and semantic commit history.

### Commit Message Format

Each commit message consists of a **header**, an optional **body**, and an optional **footer**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Header
The header is **mandatory** and must conform to the format: `<type>(<scope>): <subject>`

- **type**: Describes the category of change (see types below)
- **scope**: Optional, indicates the module or component affected (e.g., `chat`, `settings`, `database`)
- **subject**: Brief description of the change
  - Use imperative, present tense: "add" not "added" nor "adds"
  - Don't capitalize the first letter
  - No period (.) at the end
  - Maximum 50 characters

#### Body (Optional)
- Provides detailed explanation of the change
- Use imperative, present tense
- Include motivation for the change and contrast with previous behavior
- Wrap at 72 characters

#### Footer (Optional)
- Reference issue tracker IDs
- Note breaking changes

### Commit Types

| Type | Description | Example |
|------|-------------|---------|
| **feat** | New feature or functionality | `feat(chat): add multi-AI simultaneous messaging` |
| **fix** | Bug fix | `fix(webview): resolve memory leak in chat window` |
| **docs** | Documentation changes | `docs(readme): update installation instructions` |
| **style** | Code style changes (formatting, missing semi-colons, etc.) | `style(components): format code with prettier` |
| **refactor** | Code refactoring without changing functionality | `refactor(store): simplify state management logic` |
| **perf** | Performance improvements | `perf(renderer): optimize liquid glass rendering` |
| **test** | Adding or updating tests | `test(chat): add unit tests for message handling` |
| **build** | Changes to build system or dependencies | `build(deps): upgrade electron to v28` |
| **ci** | Changes to CI configuration | `ci(github): add automated testing workflow` |
| **chore** | Other changes that don't modify src or test files | `chore(git): update .gitignore` |
| **revert** | Revert a previous commit | `revert: revert "feat(chat): add voice input"` |

### Commit Examples

#### Feature Addition
```
feat(prompts): add custom prompt template management

Implement a new prompt template system that allows users to:
- Create and save custom prompt templates
- Organize templates by category
- Apply templates across different AI services

Closes #123
```

#### Bug Fix
```
fix(window): prevent window state loss on app restart

The window position and size were not being persisted correctly
when the application was closed. Updated the window-manager to
properly save state before quit.

Fixes #456
```

#### Documentation
```
docs(claude): translate CLAUDE.md to English

- Translate all sections from Chinese to English
- Maintain consistent terminology
- Improve clarity and readability
```

#### Refactoring
```
refactor(database): migrate to better-sqlite3

Replace sqlite3 package with better-sqlite3 for improved performance
and synchronous API. Updated all database operations accordingly.

BREAKING CHANGE: Database initialization now requires synchronous setup
```

#### Performance Improvement
```
perf(chat): implement virtual scrolling for messages

Add virtual scrolling to chat message list to handle thousands
of messages without performance degradation.
```

### Scope Guidelines

Common scopes in this project:
- **chat**: Chat-related features and components
- **ai**: AI service integration and management
- **window**: Window management and lifecycle
- **database**: Database operations and schema
- **ui**: User interface components and styling
- **settings**: Application settings and preferences
- **prompts**: Prompt management features
- **system**: System integration (tray, hotkeys, clipboard)
- **ipc**: Inter-process communication
- **build**: Build configuration and tooling
- **deps**: Dependencies management

### Commit Guidelines

1. **Atomic Commits**: Each commit should represent a single logical change
2. **Meaningful Messages**: Commit messages should clearly explain what and why
3. **Test Before Commit**: Ensure tests pass before committing
4. **Stage Appropriately**: Only stage files related to the current change
5. **Reference Issues**: Link commits to issue tracker when applicable

### Breaking Changes

If a commit introduces a breaking change, the footer should start with `BREAKING CHANGE:` followed by a description:

```
refactor(api): change IPC channel naming convention

Update all IPC channel names to use kebab-case instead of camelCase
for consistency with Electron best practices.

BREAKING CHANGE: All existing IPC channel names have changed.
Update any code that uses IPC communication:
- `chatMessage` → `chat-message`
- `windowState` → `window-state`
```

### Revert Commits

If a commit reverts a previous commit, it should begin with `revert:`, followed by the header of the reverted commit:

```
revert: feat(voice): add voice input feature

This reverts commit a1b2c3d4.

The voice input feature is causing memory leaks in production.
Will reimplement after fixing the underlying issue.
```

### Multi-Line Commits

For complex changes, use a detailed body:

```
feat(compare): add side-by-side AI response comparison

Implement a new comparison view that displays responses from
multiple AI services side-by-side:

- Add CompareView component with split-pane layout
- Implement synchronized scrolling between panes
- Add response highlighting for differences
- Store comparison sessions in database

This feature helps users evaluate different AI models and
choose the best response for their needs.

Closes #789
```

### Tools and Automation

Consider using these tools to enforce commit conventions:
- **commitlint**: Lint commit messages
- **husky**: Git hooks for pre-commit checks
- **commitizen**: Interactive commit message builder
- **standard-version**: Automated versioning and changelog generation
