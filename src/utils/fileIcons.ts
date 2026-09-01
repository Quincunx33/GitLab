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
  { label: 'Shell', value: 'shell' },

  // Data & Config
  { label: 'JSON', value: 'json' },
  { label: 'YAML', value: 'yaml' },
  { label: 'TOML', value: 'toml' },
  { label: 'Dockerfile', value: 'dockerfile' },
  { label: 'Makefile', value: 'makefile' },

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

export function guessLanguageFromContent(content: string): string | null {
  if (!content) return null;
  const lines = content.split('\n').slice(0, 5); // Check first 5 lines
  const firstLine = lines[0]?.trim() || '';

  // Check shebang
  if (firstLine.startsWith('#!')) {
    if (firstLine.includes('python')) return 'python';
    if (firstLine.includes('node')) return 'javascript';
    if (firstLine.includes('bash') || firstLine.includes('sh')) return 'shell';
    if (firstLine.includes('ruby')) return 'ruby';
    if (firstLine.includes('php')) return 'php';
    if (firstLine.includes('perl')) return 'perl';
  }

  // Check XML/HTML
  if (firstLine.startsWith('<?xml') || firstLine.startsWith('<!DOCTYPE html>') || firstLine.startsWith('<html')) {
    return 'xml';
  }

  // Check common imports or patterns in the first few lines
  const joinedLines = lines.join('\n');
  if (/^import React/m.test(joinedLines)) return 'javascript';
  if (/^import .* from ['"]react['"]/m.test(joinedLines)) return 'javascript';
  if (/^package \w+;/m.test(joinedLines)) return 'java';
  if (/^package main/m.test(joinedLines)) return 'go';
  if (/^#include\s+<.*>/m.test(joinedLines)) return 'cpp';
  
  // JSON Check
  if (firstLine.startsWith('{') || firstLine.startsWith('[')) {
    try {
      JSON.parse(content);
      return 'json';
    } catch {
      // Not JSON
    }
  }

  return null;
}

export function getLanguageFromFilename(filename: string, content?: string): string {
  const nameLower = filename.toLowerCase();
  if (nameLower === 'dockerfile') return 'dockerfile';
  if (nameLower === 'makefile') return 'makefile';
  if (nameLower.includes('.bashrc') || nameLower.includes('.sh')) return 'shell';

  const hasExt = filename.includes('.');
  const ext = hasExt ? filename.split('.').pop()?.toLowerCase() || '' : '';

  if (content && (!hasExt || ext === 'txt' || ext === '')) {
    const guessed = guessLanguageFromContent(content);
    if (guessed) return guessed;
  }

  switch (ext) {
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
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
    case 'hpp':
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
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'shell';
    default:
      if (content) {
        const guessed = guessLanguageFromContent(content);
        if (guessed) return guessed;
      }
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
  if (['c', 'cpp', 'c++', 'h', 'hpp', 'cs'].includes(l)) return 'cpp';
  if (['rb', 'ruby'].includes(l)) return 'ruby';
  if (['json'].includes(l)) return 'json';
  if (['yaml', 'yml'].includes(l)) return 'yaml';
  if (['css', 'scss', 'less'].includes(l)) return 'css';
  if (['java'].includes(l)) return 'java';
  if (['php'].includes(l)) return 'php';
  if (['sql'].includes(l)) return 'sql';
  if (['go'].includes(l)) return 'go';
  if (['rust', 'rs'].includes(l)) return 'rust';
  if (['sh', 'bash', 'shell'].includes(l)) return 'shell';
  if (['dockerfile'].includes(l)) return 'dockerfile';
  if (['makefile'].includes(l)) return 'makefile';
  return l || 'plaintext';
}

