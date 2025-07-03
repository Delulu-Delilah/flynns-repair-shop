import { useState, useEffect } from 'react';

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check initial maximize state
    if (window.electronAPI?.window?.isMaximized) {
      window.electronAPI.window.isMaximized().then(setIsMaximized);
    }

    // Listen for maximize state changes
    if (window.electronAPI?.window?.onMaximizeChange) {
      const unsubscribe = window.electronAPI.window.onMaximizeChange(setIsMaximized);
      return unsubscribe;
    }
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.window?.minimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.window?.maximize().then(setIsMaximized);
  };

  const handleClose = () => {
    window.electronAPI?.window?.close();
  };

  return (
    <div className="flex items-center justify-between h-8 bg-tron-darker border-b border-cyan-400/30 select-none">
      {/* Drag Region */}
      <div className="flex-1 h-full flex items-center px-4 drag-region">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-tron-darker rounded-sm"></div>
          </div>
          <span className="text-cyan-400 font-mono text-xs uppercase tracking-wider font-bold">
            FLYNNS
          </span>
        </div>
      </div>

      {/* Window Controls */}
      <div className="flex h-full">
        {/* Minimize Button */}
        <button
          onClick={handleMinimize}
          className="w-12 h-full flex items-center justify-center hover:bg-cyan-400/10 transition-colors duration-200 group"
          title="Minimize"
        >
          <div className="w-3 h-0.5 bg-cyan-300 group-hover:bg-cyan-100 transition-colors"></div>
        </button>

        {/* Maximize/Restore Button */}
        <button
          onClick={handleMaximize}
          className="w-12 h-full flex items-center justify-center hover:bg-cyan-400/10 transition-colors duration-200 group"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <div className="relative">
              <div className="w-2.5 h-2.5 border border-cyan-300 group-hover:border-cyan-100 transition-colors"></div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 border border-cyan-300 group-hover:border-cyan-100 transition-colors bg-tron-darker"></div>
            </div>
          ) : (
            <div className="w-3 h-3 border border-cyan-300 group-hover:border-cyan-100 transition-colors"></div>
          )}
        </button>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="w-12 h-full flex items-center justify-center hover:bg-red-500/20 transition-colors duration-200 group"
          title="Close"
        >
          <div className="relative w-3 h-3">
            <div className="absolute inset-0 w-3 h-0.5 bg-cyan-300 group-hover:bg-red-400 transition-colors transform rotate-45 translate-y-1"></div>
            <div className="absolute inset-0 w-3 h-0.5 bg-cyan-300 group-hover:bg-red-400 transition-colors transform -rotate-45 translate-y-1"></div>
          </div>
        </button>
      </div>
    </div>
  );
} 