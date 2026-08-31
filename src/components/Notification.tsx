import React from 'react';

interface NotificationProps {
  isLoading: boolean;
  loadingMessage: string;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  onCloseToast: () => void;
}

export const Notification: React.FC<NotificationProps> = ({
  isLoading,
  loadingMessage,
  toast,
  onCloseToast,
}) => {
  return (
    <>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50 p-4 text-white">
          <div className="w-10 h-10 border-4 border-[#0066b8] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium tracking-wide">{loadingMessage || 'Processing...'}</p>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 right-6 z-50 max-w-sm animate-bounce">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-md shadow-xl border text-xs text-white ${
              toast.type === 'success'
                ? 'bg-emerald-900/90 border-emerald-600'
                : toast.type === 'error'
                ? 'bg-rose-900/90 border-rose-600'
                : 'bg-sky-900/90 border-sky-600'
            }`}
          >
            <i
              className={`fas ${
                toast.type === 'success'
                  ? 'fa-check-circle text-emerald-400'
                  : toast.type === 'error'
                  ? 'fa-exclamation-circle text-rose-400'
                  : 'fa-info-circle text-sky-400'
              } text-base`}
            ></i>
            <span className="flex-1 font-medium">{toast.message}</span>
            <button onClick={onCloseToast} className="text-[#aaa] hover:text-white ml-2 text-sm">
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  );
};
