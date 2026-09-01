# PushFlow - Modern Web Client

A fully-featured, modern web-based GitHub/GitLab client built with React, Vite, and Tailwind CSS. This application allows users to manage their repositories, view file structures, edit code with a built-in Monaco Editor, stage/unstage files, and push commits directly to GitHub—all from a sleek, responsive browser interface.

## 🚀 Features

- **Repository Management:** View, search, and clone public or private GitHub repositories.
- **Real-time Code Editing:** Integrated Microsoft Monaco Editor (the same editor powering VS Code) with syntax highlighting.
- **Source Control (Git Operations):**
  - Track modified, added, and deleted files.
  - Stage and unstage specific files.
  - Write commit messages and push changes directly to GitHub via the GitHub API.
- **Commit History & Rollback:** 
  - View the complete commit history of any branch.
  - **Revert System (Undo):** Revert your entire repository back to any previous commit with a single click.
- **File Explorer:** Nested folder tree structure with file icons to easily navigate your codebase.
- **Responsive Design:** A fully responsive interface that automatically adjusts to mobile, tablet, and desktop screens without breaking the layout.
- **Secure Authentication:** OAuth integration via Firebase to securely connect your GitHub account.

## 🛠️ Tech Stack

- **Frontend Framework:** React 18 (TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (Utility-first styling, Dark Mode UI)
- **Code Editor:** `@monaco-editor/react`
- **Backend/Auth:** Firebase (Authentication, Firestore) & GitHub REST API
- **Icons:** FontAwesome (via CDN) & Custom File Icons

## 🔒 Security Notice (Safe for Public GitHub)

This codebase is **100% safe to be open-sourced and published publicly**. 
- **No Hardcoded Tokens:** GitHub Personal Access Tokens (PAT) and OAuth tokens are retrieved dynamically upon user login and stored securely in the browser's `localStorage`. They are never hardcoded in the repository.
- **Public Firebase Config:** The `firebase-applet-config.json` contains Firebase web initialization variables. By design, Firebase API keys for web clients are safe to be public as long as your `firestore.rules` are properly secured (which they are in this app).

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is [MIT](https://opensource.org/licenses/MIT) licensed.
