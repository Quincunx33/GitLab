const fs = require('fs');
let code = fs.readFileSync('src/components/RepoBrowserModal.tsx', 'utf8');

const target = `<div className="bg-[#252526] px-5 py-3.5 border-b border-[#3d3d3d] flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2d2d2d] border border-[#444] flex items-center justify-center text-white">
              <i className="fab fa-github text-lg"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">GitHub Repositories</h3>
                {githubUser && (
                  <span className="text-[11px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded font-mono font-medium">
                    @{githubUser}
                  </span>
                )}
                <span className="text-[10px] bg-[#333] text-[#aaa] px-2 py-0.5 rounded font-mono">
                  {repositories.length} repos
                </span>
              </div>
              <p className="text-[11px] text-[#888]">
                Browse and clone repositories directly into the web editor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">`;

const replacement = `<div className="bg-[#252526] px-3 sm:px-5 py-3.5 border-b border-[#3d3d3d] flex items-start sm:items-center justify-between shrink-0 select-none gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-[#2d2d2d] border border-[#444] flex items-center justify-center text-white shrink-0">
              <i className="fab fa-github text-lg"></i>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm font-semibold text-white whitespace-nowrap">GitHub Repositories</h3>
                {githubUser && (
                  <span className="text-[11px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded font-mono font-medium truncate max-w-[120px]">
                    @{githubUser}
                  </span>
                )}
                <span className="text-[10px] bg-[#333] text-[#aaa] px-2 py-0.5 rounded font-mono whitespace-nowrap">
                  {repositories.length} repos
                </span>
              </div>
              <p className="text-[11px] text-[#888] truncate mt-0.5 hidden sm:block">
                Browse and clone repositories directly into the web editor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/RepoBrowserModal.tsx', code);
  console.log('Successfully patched modal');
} else {
  console.log('Target not found!');
  // fallback for whitespace differences
  code = code.replace(/<div className="bg-\[#252526\] px-5 py-3.5 border-b border-\[#3d3d3d\] flex items-center justify-between shrink-0 select-none">[\s\S]*?<div className="flex items-center gap-2">/, replacement);
  fs.writeFileSync('src/components/RepoBrowserModal.tsx', code);
  console.log('Patched modal using regex fallback');
}
