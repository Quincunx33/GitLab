import { OutlineItem } from '../types';

export function parseOutline(content: string, language: string): OutlineItem[] {
  if (!content) return [];

  const lang = language.toLowerCase();

  if (['javascript', 'js', 'jsx', 'typescript', 'ts', 'tsx'].includes(lang)) {
    return parseJavaScript(content);
  } else if (['xml', 'html', 'htmlmixed', 'svg'].includes(lang)) {
    return parseHTML(content);
  } else if (['css', 'scss', 'less'].includes(lang)) {
    return parseCSS(content);
  } else if (['python', 'py'].includes(lang)) {
    return parsePython(content);
  }

  return [];
}

function parseJavaScript(content: string): OutlineItem[] {
  const items: OutlineItem[] = [];
  const lines = content.split('\n');
  let currentClass: string | null = null;
  let bracketCount = 0;
  let classLevel = 0;

  const addOutlineItem = (name: string, type: string, line: number, level = 0) => {
    const icon = getIconForType(type);
    items.push({
      name: `${icon} ${name}`,
      type,
      line,
      level,
    });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'class': return '📦';
      case 'constructor': return '🔨';
      case 'async-method':
      case 'async-function': return '⚡';
      case 'method':
      case 'function': return '🔹';
      case 'static-method': return '🔒';
      case 'variable-function': return '➜';
      default: return '•';
    }
  };

  const isInsideFunction = () => bracketCount > (currentClass ? classLevel + 1 : 1);

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    const openBrackets = (trimmedLine.match(/{/g) || []).length;
    const closeBrackets = (trimmedLine.match(/}/g) || []).length;
    bracketCount += openBrackets - closeBrackets;

    if (isInsideFunction()) return;

    // Class declarations
    const classMatch = trimmedLine.match(/^class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (classMatch) {
      currentClass = classMatch[1];
      classLevel = bracketCount;
      addOutlineItem(classMatch[1], 'class', index + 1, 0);
      return;
    }

    // Constructor in class
    if (currentClass && trimmedLine.startsWith('constructor')) {
      addOutlineItem('constructor', 'constructor', index + 1, 1);
      return;
    }

    // Methods (including async)
    const methodMatch = trimmedLine.match(/^(async\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*{?/);
    if (methodMatch && !trimmedLine.startsWith('function') && !trimmedLine.includes('=>') && !['if', 'for', 'while', 'switch', 'catch'].includes(methodMatch[2])) {
      const methodName = methodMatch[2];
      const isAsync = !!methodMatch[1];

      addOutlineItem(
        methodName,
        isAsync ? 'async-method' : 'method',
        index + 1,
        currentClass ? 1 : 0
      );
      return;
    }

    // Function declarations
    const functionMatch = trimmedLine.match(/^(export\s+)?(async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (functionMatch) {
      const isAsync = !!functionMatch[2];
      addOutlineItem(
        functionMatch[3],
        isAsync ? 'async-function' : 'function',
        index + 1,
        0
      );
      return;
    }

    // Static methods
    const staticMatch = trimmedLine.match(/^static\s+(async\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (staticMatch && currentClass) {
      const isAsync = !!staticMatch[1];
      addOutlineItem(
        staticMatch[2],
        isAsync ? 'static-async-method' : 'static-method',
        index + 1,
        1
      );
      return;
    }

    // Variable declarations with function assignments
    const varFuncMatch = trimmedLine.match(/^(?:export\s+)?(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(async\s+)?(\([^)]*\)\s*=>|function)/);
    if (varFuncMatch) {
      const isAsync = !!varFuncMatch[2];
      addOutlineItem(
        varFuncMatch[1],
        isAsync ? 'async-variable-function' : 'variable-function',
        index + 1,
        0
      );
    }
  });

  return items;
}

function parseHTML(content: string): OutlineItem[] {
  const items: OutlineItem[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Match elements with id or class
    const elementMatch = line.match(/<([a-z0-9]+)([^>]*?)(id|class)=["']([^"']+)["'][^>]*>/i);
    if (elementMatch) {
      const tag = elementMatch[1];
      const attr = elementMatch[3];
      const value = elementMatch[4];
      items.push({
        name: `<${tag}> ${attr === 'id' ? '#' : '.'}${value}`,
        type: 'element',
        icon: '🏷️',
        line: index + 1,
        level: 0,
      });
    }

    // Match headings
    const headingMatch = line.match(/<h([1-6])[^>]*>(.*?)<\/h\1>/i);
    if (headingMatch) {
      items.push({
        name: `H${headingMatch[1]}: ${headingMatch[2].replace(/<[^>]+>/g, '')}`,
        type: 'heading',
        icon: '📌',
        line: index + 1,
        level: 0,
      });
    }
  });

  return items;
}

function parseCSS(content: string): OutlineItem[] {
  const items: OutlineItem[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('@') && !trimmed.startsWith('}') && !trimmed.includes(':') && trimmed.includes('{')) {
      const selector = trimmed.split('{')[0].trim();
      if (selector) {
        items.push({
          name: selector,
          type: 'css-selector',
          icon: '🎨',
          line: index + 1,
          level: 0,
        });
      }
    }
  });

  return items;
}

function parsePython(content: string): OutlineItem[] {
  const items: OutlineItem[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('class ')) {
      const className = trimmed.split('class ')[1].split('(')[0].split(':')[0].trim();
      items.push({
        name: `📦 ${className}`,
        type: 'class',
        line: index + 1,
        level: 0,
      });
    } else if (trimmed.startsWith('def ')) {
      const funcName = trimmed.split('def ')[1].split('(')[0].trim();
      const isMethod = line.startsWith('    ') || line.startsWith('\t');
      items.push({
        name: `${isMethod ? '🔹' : '⚡'} ${funcName}`,
        type: isMethod ? 'method' : 'function',
        line: index + 1,
        level: isMethod ? 1 : 0,
      });
    }
  });

  return items;
}
