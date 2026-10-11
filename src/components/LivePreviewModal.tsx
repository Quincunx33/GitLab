import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FileNode, Tab } from '../types';

interface ConsoleMessage {
  id: string;
  level: 'log' | 'warn' | 'error' | 'info';
  messages: string[];
  timestamp: string;
}

interface LivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileStructure: FileNode | null;
  tabs: Tab[];
  activeTabId: string | null;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export const LivePreviewModal: React.FC<LivePreviewModalProps> = ({
  isOpen,
  onClose,
  fileStructure,
  tabs,
  activeTabId,
}) => {
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [logs, setLogs] = useState<ConsoleMessage[]>([]);
  const [consoleFilter, setConsoleFilter] = useState<'all' | 'errors' | 'logs'>('all');
  const [showConsole, setShowConsole] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Collect map of all files { [relativePath]: content }
  const fileContentMap = useMemo(() => {
    const map = new Map<string, string>();

    // 1. Traverse fileStructure
    const scan = (node: FileNode) => {
      if (node.type === 'file' && node.content !== undefined) {
        map.set(node.path, node.content);
        map.set(node.name, node.content);
      }
      if (node.children) {
        Object.values(node.children).forEach(scan);
      }
    };
    if (fileStructure) scan(fileStructure);

    // 2. Override with any currently active/modified open tabs
    tabs.forEach((tab) => {
      map.set(tab.path, tab.content);
      map.set(tab.title, tab.content);
    });

    return map;
  }, [fileStructure, tabs]);

  // Construct assembled HTML document
  const assembledHtml = useMemo(() => {
    // 1. Identify primary HTML candidate
    let htmlContent = '';
    const activeTab = tabs.find((t) => t.id === activeTabId);

    if (activeTab && activeTab.title.toLowerCase().endsWith('.html')) {
      htmlContent = activeTab.content;
    } else {
      // Look for index.html in files
      for (const [key, val] of fileContentMap.entries()) {
        if (key.toLowerCase().endsWith('index.html')) {
          htmlContent = val;
          break;
        }
      }
    }

    // Fallback: If no HTML file is found, check if active tab is JS or CSS
    if (!htmlContent) {
      if (activeTab && (activeTab.title.endsWith('.js') || activeTab.title.endsWith('.ts'))) {
        htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>JavaScript Preview</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; background: #121212; color: #eee; }
    h2 { color: #38bdf8; }
    #output { background: #1e1e1e; padding: 16px; border-radius: 8px; border: 1px solid #333; font-family: monospace; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h2>Script Output Console</h2>
  <div id="output">Running script... Check console below!</div>
  <script>
    try {
      ${activeTab.content}
    } catch (err) {
      console.error(err);
      document.getElementById('output').textContent = 'Error: ' + err.message;
    }
  </script>
</body>
</html>`;
      } else {
        htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PushFlow Live Preview</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #181818; color: #888; text-align: center; }
  </style>
</head>
<body>
  <div>
    <h3 style="color: #ccc;">No HTML File Selected</h3>
    <p style="font-size: 13px;">Create or open an index.html file to view live interactive rendering.</p>
  </div>
</body>
</html>`;
      }
    }

    // 2. Inline local CSS files referenced in <link rel="stylesheet" href="...">
    let inlined = htmlContent.replace(
      /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
      (match, href) => {
        const cleanHref = href.replace(/^\.?\//, '');
        const foundCss = fileContentMap.get(cleanHref) || fileContentMap.get(href);
        if (foundCss) {
          return `<style data-inlined="${cleanHref}">\n${foundCss}\n</style>`;
        }
        return match;
      }
    );

    // 3. Inline local JS files referenced in <script src="...">
    inlined = inlined.replace(
      /<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi,
      (match, src) => {
        // Skip external CDNs
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
          return match;
        }
        const cleanSrc = src.replace(/^\.?\//, '');
        const foundJs = fileContentMap.get(cleanSrc) || fileContentMap.get(src);
        if (foundJs) {
          return `<script data-inlined="${cleanSrc}">\n${foundJs}\n</script>`;
        }
        return match;
      }
    );

    // 4. Inject Console Interceptor Script into <head> or at start
    const interceptorScript = `
<script>
(function() {
  function formatArg(arg) {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'object') {
      try { return JSON.stringify(arg); } catch(e) { return Object.prototype.toString.call(arg); }
    }
    return String(arg);
  }

  function sendLog(level, args) {
    try {
      const messages = Array.from(args).map(formatArg);
      window.parent.postMessage({
        type: 'PUSHFLOW_CONSOLE',
        level: level,
        messages: messages
      }, '*');
    } catch(e) {}
  }

  const _log = console.log;
  const _warn = console.warn;
  const _error = console.error;
  const _info = console.info;

  console.log = function() { _log.apply(console, arguments); sendLog('log', arguments); };
  console.warn = function() { _warn.apply(console, arguments); sendLog('warn', arguments); };
  console.error = function() { _error.apply(console, arguments); sendLog('error', arguments); };
  console.info = function() { _info.apply(console, arguments); sendLog('info', arguments); };

  window.addEventListener('error', function(e) {
    sendLog('error', [e.message + (e.lineno ? ' (line ' + e.lineno + ')' : '')]);
  });
})();
</script>
`;

    if (inlined.includes('<head>')) {
      inlined = inlined.replace('<head>', '<head>' + interceptorScript);
    } else {
      inlined = interceptorScript + inlined;
    }

    return inlined;
  }, [fileContentMap, tabs, activeTabId]);

  // Listen to postMessage from sandboxed iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PUSHFLOW_CONSOLE') {
        const newMsg: ConsoleMessage = {
          id: Math.random().toString(36).slice(2, 9),
          level: event.data.level || 'log',
          messages: event.data.messages || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        setLogs((prev) => [...prev.slice(-100), newMsg]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!isOpen) return null;

  const handleRerun = () => {
    setLogs([]);
    setRefreshKey((k) => k + 1);
  };

  const filteredLogs = logs.filter((l) => {
    if (consoleFilter === 'errors') return l.level === 'error';
    if (consoleFilter === 'logs') return l.level === 'log' || l.level === 'info';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="bg-[#1e1e1e] border border-[#383838] rounded-xl shadow-2xl w-full h-[96vh] text-xs text-[#d4d4d4] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-4 py-2.5 bg-[#252526] border-b border-[#333] flex items-center justify-between gap-3 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-white text-sm">Live Preview & Runner</span>
            </div>

            {/* Viewport Width Controls */}
            <div className="hidden sm:flex items-center bg-[#181818] border border-[#3a3a3a] rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setViewport('desktop')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                  viewport === 'desktop'
                    ? 'bg-[#333] text-white shadow-xs'
                    : 'text-[#888] hover:text-[#ccc]'
                }`}
                title="Full Responsive Desktop View (100%)"
              >
                <i className="fas fa-desktop text-xs"></i>
                <span>Desktop</span>
              </button>
              <button
                onClick={() => setViewport('tablet')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                  viewport === 'tablet'
                    ? 'bg-[#333] text-white shadow-xs'
                    : 'text-[#888] hover:text-[#ccc]'
                }`}
                title="Tablet View (768px)"
              >
                <i className="fas fa-tablet-screen-button text-xs"></i>
                <span>Tablet (768px)</span>
              </button>
              <button
                onClick={() => setViewport('mobile')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                  viewport === 'mobile'
                    ? 'bg-[#333] text-white shadow-xs'
                    : 'text-[#888] hover:text-[#ccc]'
                }`}
                title="Mobile View (375px)"
              >
                <i className="fas fa-mobile-screen text-xs"></i>
                <span>Mobile (375px)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRerun}
              className="px-2.5 py-1 bg-[#2e2e2e] hover:bg-[#383838] text-white rounded font-medium border border-[#444] transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
              title="Rerun / Refresh preview iframe"
            >
              <i className="fas fa-rotate text-emerald-400"></i>
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setShowConsole((c) => !c)}
              className={`px-2.5 py-1 rounded font-medium border transition-colors flex items-center gap-1.5 text-xs ${
                showConsole
                  ? 'bg-sky-950/80 border-sky-600/60 text-sky-300'
                  : 'bg-[#2e2e2e] border-[#444] text-[#888] hover:text-white'
              }`}
              title="Toggle In-Preview Console Drawer"
            >
              <i className="fas fa-terminal text-xs"></i>
              <span>Console</span>
              {logs.filter((l) => l.level === 'error').length > 0 && (
                <span className="bg-rose-600 text-white text-[9px] px-1 rounded-full font-bold">
                  {logs.filter((l) => l.level === 'error').length}
                </span>
              )}
            </button>

            <button
              onClick={onClose}
              className="text-[#888] hover:text-white p-1.5 text-base transition-colors"
              title="Close Preview (Esc)"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Viewport Frame Container */}
        <div className="flex-1 bg-[#121212] overflow-hidden flex flex-col items-center justify-center relative p-2">
          <div
            className={`h-full bg-white transition-all duration-300 ease-in-out overflow-hidden shadow-2xl flex flex-col ${
              viewport === 'desktop'
                ? 'w-full rounded-none'
                : viewport === 'tablet'
                ? 'w-[768px] max-w-full border-x border-[#333] rounded-t-lg'
                : 'w-[375px] max-w-full border-x border-[#333] rounded-t-lg'
            }`}
          >
            <div className="h-6 bg-[#f0f0f0] border-b border-[#ddd] flex items-center justify-center gap-1.5 shrink-0 select-none">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="ml-2 text-[10px] text-[#888] font-mono truncate">{viewport.toUpperCase()}</span>
            </div>
            <iframe
              key={refreshKey}
              ref={iframeRef}
              srcDoc={assembledHtml}
              title="Live Preview"
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
              className="w-full h-full border-none bg-white"
            />
          </div>
        </div>

        {/* Integrated Console Log Drawer */}
        {showConsole && (
          <div className="h-56 bg-[#181818] border-t border-[#383838] flex flex-col shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.5)]">
            {/* Console Toolbar */}
            <div className="px-4 py-2 bg-[#202020] border-b border-[#2d2d2d] flex items-center justify-between text-[11px] text-[#aaa]">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <i className="fas fa-terminal text-sky-400"></i> Console
                </span>
                <div className="flex items-center gap-0.5 bg-[#151515] rounded-md p-0.5 border border-[#333]">
                  <button
                    onClick={() => setConsoleFilter('all')}
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      consoleFilter === 'all' ? 'bg-[#333] text-white' : 'text-[#777] hover:text-[#ccc]'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setConsoleFilter('errors')}
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      consoleFilter === 'errors' ? 'bg-rose-950 text-rose-300' : 'text-[#777] hover:text-[#ccc]'
                    }`}
                  >
                    Errors
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[#666]">{logs.length} entries</span>
                <button
                  onClick={() => setLogs([])}
                  className="hover:text-rose-400 text-[#777] text-[10.5px] flex items-center gap-1 transition-colors"
                  title="Clear console output"
                >
                  <i className="fas fa-ban"></i> Clear
                </button>
              </div>
            </div>

            {/* Console Log Rows */}
            <div className="flex-1 p-2 overflow-y-auto font-mono text-[11px] space-y-0.5">
              {filteredLogs.length === 0 ? (
                <div className="text-[#555] text-center pt-10">Console is clear.</div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 py-1 px-2 border-b border-[#222] last:border-none ${
                      log.level === 'error'
                        ? 'bg-rose-950/20 text-rose-300'
                        : log.level === 'warn'
                        ? 'bg-amber-950/10 text-amber-300'
                        : 'text-[#d4d4d4]'
                    }`}
                  >
                    <span className="text-[#666] text-[10px] shrink-0 w-16">{log.timestamp}</span>
                    <span className="break-all whitespace-pre-wrap flex-1">{log.messages.join(' ')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
