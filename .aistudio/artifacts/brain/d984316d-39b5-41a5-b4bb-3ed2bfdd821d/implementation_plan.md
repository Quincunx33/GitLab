# Implementation Plan: In-Browser Live Preview, .gitignore Generator & Full Workspace ZIP Export

This plan details the design and architecture for the three features selected by the user to expand PushFlow into a complete developer workstation:
1. **In-Browser Code Execution & Live Preview** (HTML/CSS/JS Sandbox, Console Output, Responsive Viewports)
2. **Automated .gitignore Generator** (Project stack auto-detection, secret leaks prevention)
3. **Workspace ZIP Exporter** (Complete hierarchical archive download)

---

## 1. Feature Breakdown & Architecture

### Feature 1: In-Browser Live Preview & Code Runner (`LivePreviewModal.tsx` & Split View)
- **Multi-File Web Bundling**: Combines `index.html` with referenced workspace stylesheets and JavaScript files into a self-contained blob/srcdoc for sandboxed preview.
- **Sandboxed Execution**: Isolated `<iframe>` with `sandbox="allow-scripts allow-modals allow-forms"` to ensure security while supporting modern DOM APIs.
- **In-Preview Console Interceptor**: Injects a lightweight console proxy into the preview frame that routes `console.log`, `console.warn`, `console.error`, and runtime uncaught exceptions directly to a bottom console drawer in PushFlow.
- **Responsive Viewport Controls**:
  - Full / Responsive Desktop view (100% width)
  - Tablet view (768px centered container)
  - Mobile view (375px phone container)
- **Live Auto-Refresh & Manual Rerun**: Auto-reloads preview upon editing workspace files with debounce, with a manual refresh button.

### Feature 2: Automated .gitignore Generator (`GitignoreGeneratorModal.tsx`)
- **Workspace Stack Auto-Detection**:
  - Scans workspace file tree for markers:
    - Node.js / React / Next / Vite: `package.json`, `vite.config.*`, `next.config.*`
    - Python: `requirements.txt`, `pyproject.toml`, `*.py`
    - Rust: `Cargo.toml`
    - Go: `go.mod`
    - Java / Kotlin: `pom.xml`, `build.gradle`
- **Rule Categorization & Customization**:
  - **Security & Secrets**: `.env`, `.env.*`, `*.pem`, `*.key`, `credentials.json`, `service-account*.json`
  - **Dependencies & Packages**: `node_modules/`, `venv/`, `.venv/`, `vendor/`
  - **Build Output**: `dist/`, `build/`, `out/`, `target/`, `*.pyc`, `__pycache__/`
  - **System & Editor Junk**: `.DS_Store`, `Thumbs.db`, `.vscode/`, `.idea/`
- **One-Click Creation / Update**:
  - Generates or appends cleanly to `.gitignore` in workspace root.
  - Opens `.gitignore` in active editor tab with toast confirmation.

### Feature 3: Full Workspace Archive Exporter (Clean ZIP Download)
- **Workspace Tree Serialization**: Traverses `fileStructure` recursively, packing files and folders into a clean ZIP structure using `JSZip`.
- **Intelligent Filtering Option**: Respects `.gitignore` or allows user to download clean production files vs complete raw workspace.
- **One-Click Download Action**: Added to Toolbar under a dedicated "Export ZIP" action and File menu with automatic filename generation: `${repoName || 'pushflow-workspace'}-${date}.zip`.

---

## 2. Component Design & Spatial Layout (Anti-Slop Restraint)

- **Toolbar Integration**:
  - Add clean, unboxed action buttons in Toolbar:
    - `<button id="livePreviewBtn">` with `<i className="fas fa-play text-emerald-400"></i> Run / Preview`
    - `<button id="exportZipBtn">` with `<i className="fas fa-file-zipper text-sky-400"></i> Export ZIP`
    - Integrated option in Explorer header: `Generate .gitignore`
- **Modal Aesthetics**:
  - PushFlow dark palette (`bg-[#1e1e1e]`, `border-[#333]`, hairline dividers).
  - No static pills or ornamental clutter. High contrast, tabular numerals for file counts and sizes.
  - Console panel styled like VS Code integrated terminal (`bg-[#181818] font-mono text-xs`).

---

## 3. Implementation Steps & Planned Code Modifications

1. **Create Utility: `src/utils/gitignorePresets.ts`**:
   - Presets for Node/React, Python, Go, Rust, Java, and Universal Secrets.
   - Stack detector function `detectProjectStack(fileStructure: FileNode | null)`.

2. **Create Component: `src/components/GitignoreGeneratorModal.tsx`**:
   - Stack detector summary banner.
   - Toggleable category sections (Secrets, Dependencies, Build, OS).
   - "Generate .gitignore" action that writes to root of `fileStructure`.

3. **Create Component: `src/components/LivePreviewModal.tsx`**:
   - Embedded preview iframe with responsive container frames (Desktop, Tablet, Mobile).
   - Real-time console log drawer with filter (All, Logs, Errors).
   - HTML/JS/CSS assembler from current workspace tabs & fileStructure.

4. **Add ZIP Export Utility / Handler in `src/App.tsx`**:
   - `handleExportWorkspaceZip`: walks tree, compresses with `JSZip`, triggers browser download.

5. **Update Toolbar & Navigation in `src/components/Toolbar.tsx`**:
   - Add "Preview / Run", "Export ZIP", and ".gitignore" controls.

6. **Verification & Testing**:
   - Validate with `compile_applet` and `lint_applet`.
   - Test opening workspace with HTML/CSS/JS, launching Live Preview, generating `.gitignore`, and downloading ZIP archive.
