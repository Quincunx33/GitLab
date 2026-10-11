import { FileNode } from '../types';

export interface GitignoreCategory {
  id: string;
  name: string;
  description: string;
  rules: string[];
  defaultChecked: boolean;
}

export interface DetectedStack {
  name: string;
  icon: string;
  categoryIds: string[];
}

export const UNIVERSAL_CATEGORIES: GitignoreCategory[] = [
  {
    id: 'secrets',
    name: 'Security & Secrets (Highly Recommended)',
    description: 'Prevents accidentally leaking API tokens, private keys, and environment configs.',
    defaultChecked: true,
    rules: [
      '# Environment variables & secrets',
      '.env',
      '.env.local',
      '.env.*.local',
      '.env.development',
      '.env.test',
      '.env.production',
      '',
      '# Cryptographic keys and certificates',
      '*.pem',
      '*.key',
      '*.pfx',
      '*.p12',
      'id_rsa',
      'id_ed25519',
      'id_ecdsa',
      '',
      '# Service accounts & credentials',
      'credentials.json',
      'service-account*.json',
      'client_secret*.json',
      'auth.json',
      'secrets.json',
    ],
  },
  {
    id: 'os_editor',
    name: 'Operating System & Editor Junk',
    description: 'System cache files from macOS, Windows, VS Code, and IntelliJ.',
    defaultChecked: true,
    rules: [
      '# macOS junk',
      '.DS_Store',
      '.AppleDouble',
      '.LSOverride',
      '',
      '# Windows junk',
      'Thumbs.db',
      'ehthumbs.db',
      'Desktop.ini',
      '',
      '# Editor directories',
      '.vscode/*',
      '!.vscode/settings.json',
      '!.vscode/tasks.json',
      '!.vscode/launch.json',
      '!.vscode/extensions.json',
      '.idea/',
      '*.suo',
      '*.ntvs*',
      '*.njsproj',
    ],
  },
  {
    id: 'node',
    name: 'Node.js & JavaScript / TypeScript',
    description: 'Dependencies, lockfile caches, build distributions, and debug logs.',
    defaultChecked: true,
    rules: [
      '# Node dependencies',
      'node_modules/',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      'pnpm-debug.log*',
      '',
      '# Build output',
      'dist/',
      'build/',
      'out/',
      '.next/',
      '.nuxt/',
      '.svelte-kit/',
      '.turbo/',
      '.parcel-cache/',
      '',
      '# Coverage & testing',
      'coverage/',
      '.nyc_output/',
    ],
  },
  {
    id: 'python',
    name: 'Python',
    description: 'Virtual environments, bytecode cache, and package dists.',
    defaultChecked: false,
    rules: [
      '# Byte-compiled / optimized files',
      '__pycache__/',
      '*.py[cod]',
      '*$py.class',
      '',
      '# Virtual environments',
      'venv/',
      '.venv/',
      'env/',
      'ENV/',
      '',
      '# Distribution / packaging',
      'build/',
      'develop-eggs/',
      'dist/',
      'downloads/',
      'eggs/',
      '.eggs/',
      'lib/',
      'lib64/',
      'parts/',
      'sdist/',
      'var/',
      'wheels/',
      '*.egg-info/',
      '.installed.cfg',
      '*.egg',
    ],
  },
  {
    id: 'rust',
    name: 'Rust (Cargo)',
    description: 'Compiled target binaries and backup files.',
    defaultChecked: false,
    rules: [
      '# Cargo build output',
      '/target/',
      '**/*.rs.bk',
      'Cargo.lock',
    ],
  },
  {
    id: 'go',
    name: 'Go (Golang)',
    description: 'Compiled binaries, test outputs, and vendor folders.',
    defaultChecked: false,
    rules: [
      '# Compiled binaries',
      '*.exe',
      '*.exe~',
      '*.dll',
      '*.so',
      '*.dylib',
      '*.test',
      '*.out',
      '',
      '# Vendor directory',
      'vendor/',
    ],
  },
  {
    id: 'java',
    name: 'Java / Kotlin (Maven / Gradle)',
    description: 'Class files, jar packaging, gradle wrapper caches.',
    defaultChecked: false,
    rules: [
      '# Compiled class files',
      '*.class',
      '*.war',
      '*.nar',
      '*.ear',
      '*.zip',
      '*.tar.gz',
      '*.rar',
      '',
      '# Build directories',
      'target/',
      '.gradle/',
      'build/',
    ],
  },
];

/**
 * Scans the workspace file tree to auto-detect what tech stacks are present.
 */
export function detectProjectStacks(root: FileNode | null): DetectedStack[] {
  if (!root) return [];

  const foundNames = new Set<string>();
  const scan = (node: FileNode) => {
    foundNames.add(node.name.toLowerCase());
    if (node.children) {
      Object.values(node.children).forEach(scan);
    }
  };
  scan(root);

  const stacks: DetectedStack[] = [];

  // Check Node.js
  if (
    foundNames.has('package.json') ||
    foundNames.has('package-lock.json') ||
    foundNames.has('yarn.lock') ||
    foundNames.has('pnpm-lock.yaml') ||
    foundNames.has('tsconfig.json')
  ) {
    stacks.push({
      name: 'Node.js / Web Project',
      icon: 'fab fa-node-js text-emerald-400',
      categoryIds: ['secrets', 'os_editor', 'node'],
    });
  }

  // Check Python
  if (
    foundNames.has('requirements.txt') ||
    foundNames.has('pyproject.toml') ||
    foundNames.has('setup.py') ||
    foundNames.has('pipfile') ||
    Array.from(foundNames).some((n) => n.endsWith('.py'))
  ) {
    stacks.push({
      name: 'Python Project',
      icon: 'fab fa-python text-yellow-400',
      categoryIds: ['secrets', 'os_editor', 'python'],
    });
  }

  // Check Rust
  if (foundNames.has('cargo.toml') || Array.from(foundNames).some((n) => n.endsWith('.rs'))) {
    stacks.push({
      name: 'Rust Project',
      icon: 'fab fa-rust text-orange-400',
      categoryIds: ['secrets', 'os_editor', 'rust'],
    });
  }

  // Check Go
  if (foundNames.has('go.mod') || foundNames.has('go.sum') || Array.from(foundNames).some((n) => n.endsWith('.go'))) {
    stacks.push({
      name: 'Go Project',
      icon: 'fab fa-golang text-cyan-400',
      categoryIds: ['secrets', 'os_editor', 'go'],
    });
  }

  // Check Java
  if (
    foundNames.has('pom.xml') ||
    foundNames.has('build.gradle') ||
    foundNames.has('build.gradle.kts') ||
    Array.from(foundNames).some((n) => n.endsWith('.java') || n.endsWith('.kt'))
  ) {
    stacks.push({
      name: 'Java / Gradle Project',
      icon: 'fab fa-java text-rose-400',
      categoryIds: ['secrets', 'os_editor', 'java'],
    });
  }

  // Fallback default
  if (stacks.length === 0) {
    stacks.push({
      name: 'Standard Software Project',
      icon: 'fas fa-code text-sky-400',
      categoryIds: ['secrets', 'os_editor'],
    });
  }

  return stacks;
}

export function compileGitignoreContent(selectedCategoryIds: string[]): string {
  const chosenCategories = UNIVERSAL_CATEGORIES.filter((c) =>
    selectedCategoryIds.includes(c.id)
  );

  const lines: string[] = [
    '# =========================================================',
    '# Generated by PushFlow - .gitignore',
    `# Created on ${new Date().toLocaleDateString()}`,
    '# =========================================================',
    '',
  ];

  for (const cat of chosenCategories) {
    lines.push(`### ${cat.name} ###`);
    lines.push(...cat.rules);
    lines.push('');
  }

  return lines.join('\n');
}
