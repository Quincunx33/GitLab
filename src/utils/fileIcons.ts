import { SyntaxOption } from '../types';

export const SYNTAX_OPTIONS: SyntaxOption[] = [
  // Web Development
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'HTML/XML', value: 'xml' },
  { label: 'CSS', value: 'css' },

  // Programming Languages
  { label: 'Python', value: 'python' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'PHP', value: 'php' },
  { label: 'Java', value: 'java' },
  { label: 'C/C++/C#', value: 'cpp' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },

  // Data & Config
  { label: 'JSON', value: 'json' },
  { label: 'YAML', value: 'yaml' },
  { label: 'TOML', value: 'toml' },

  // Documentation
  { label: 'Markdown', value: 'markdown' },
  { label: 'Plain Text', value: 'plaintext' },

  // Game Development
  { label: 'GDScript', value: 'javascript' },
];

export function getFileIconClass(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'fab fa-js text-yellow-400';
    case 'ts':
    case 'tsx':
      return 'fab fa-js text-blue-400';
    case 'html':
    case 'htm':
    case 'xml':
      return 'fab fa-html5 text-orange-500';
    case 'css':
    case 'scss':
    case 'less':
      return 'fab fa-css3 text-blue-500';
    case 'py':
      return 'fab fa-python text-sky-400';
    case 'md':
      return 'fas fa-file-alt text-gray-200';
    case 'json':
      return 'fas fa-code text-yellow-500';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
      return 'fas fa-image text-purple-400';
    case 'pdf':
      return 'fas fa-file-pdf text-red-500';
    case 'java':
      return 'fab fa-java text-orange-400';
    case 'php':
      return 'fab fa-php text-indigo-400';
    case 'rb':
      return 'fas fa-gem text-red-400';
    default:
      return 'fas fa-file text-gray-400';
  }
}

export function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'html':
    case 'htm':
    case 'xml':
    case 'svg':
      return 'xml';
    case 'css':
    case 'scss':
    case 'less':
      return 'css';
    case 'py':
      return 'python';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'json':
      return 'json';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'java':
      return 'java';
    case 'php':
      return 'php';
    case 'cpp':
    case 'c':
    case 'h':
    case 'cs':
      return 'cpp';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'rb':
      return 'ruby';
    case 'gd':
      return 'javascript';
    default:
      return 'plaintext';
  }
}

export function getMonacoLanguage(lang: string): string {
  const l = lang.toLowerCase();
  if (['xml', 'html', 'svg'].includes(l)) return 'html';
  if (['js', 'jsx', 'javascript'].includes(l)) return 'javascript';
  if (['ts', 'tsx', 'typescript'].includes(l)) return 'typescript';
  if (['py', 'python'].includes(l)) return 'python';
  if (['md', 'markdown'].includes(l)) return 'markdown';
  if (['c', 'cpp', 'c++', 'h', 'cs'].includes(l)) return 'cpp';
  if (['rb', 'ruby'].includes(l)) return 'ruby';
  if (['json'].includes(l)) return 'json';
  if (['yaml', 'yml'].includes(l)) return 'yaml';
  if (['css', 'scss', 'less'].includes(l)) return 'css';
  if (['java'].includes(l)) return 'java';
  if (['php'].includes(l)) return 'php';
  if (['sql'].includes(l)) return 'sql';
  if (['go'].includes(l)) return 'go';
  if (['rust', 'rs'].includes(l)) return 'rust';
  return l || 'plaintext';
}

