const fs = require('fs');
let code = fs.readFileSync('src/components/RepoBrowserModal.tsx', 'utf8');

// The file currently has a broken state. Let's find the start of the header.
const headerStart = code.indexOf('{/* Header */}');
const controlsBarStart = code.indexOf('{/* Controls Bar */}');

const newHeader = `{/* Header */}
        <div className="bg-[#252526] px-3 sm:px-5 py-3.5 border-b border-[#3d3d3d] flex items-start sm:items-center justify-between shrink-0 select-none gap-2">
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

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-[#444] text-xs px-2.5 py-1.5 rounded flex items-center gap-1.5 text-[#d4d4d4] hover:text-white transition-colors disabled:opacity-50"
              title="Refresh Repositories"
            >
              <i className={\`fas fa-sync-alt text-[11px] \${isLoading ? 'fa-spin' : ''}\`}></i>
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenCreateRepo();
              }}
              className="bg-[#238636] hover:bg-[#2ea043] text-white text-xs px-2.5 py-1.5 rounded flex items-center gap-1.5 font-medium transition-colors"
              title="Create New Repository"
            >
              <i className="fas fa-plus text-[10px]"></i>
              <span className="hidden sm:inline">New Repo</span>
            </button>

            <button
              onClick={onClose}
              className="text-[#888] hover:text-white hover:bg-[#333] p-1.5 rounded-lg text-lg transition-colors leading-none ml-1"
              title="Close"
            >
              &times;
            </button>
          </div>
        </div>

        `;

code = code.substring(0, headerStart) + newHeader + code.substring(controlsBarStart);
fs.writeFileSync('src/components/RepoBrowserModal.tsx', code);
console.log('Fixed header!');
