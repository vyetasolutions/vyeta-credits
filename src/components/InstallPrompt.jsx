import React, { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if user is on iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    // Check if app is already running in standalone (installed) mode
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

    if (isStandalone) {
      return; // Already installed, don't show prompt
    }

    if (isIosDevice) {
      setIsIOS(true);
      setShowPrompt(true);
    } else {
      // Android / Desktop Chrome event handler
      const handleBeforeInstallPrompt = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowPrompt(true);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto bg-base-850 border border-violet-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-riseIn">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center font-display font-bold text-violet-400 shrink-0">
            V
          </div>
          <div>
            <h4 className="text-sm font-semibold text-ink-100">Install Vyeta Credits</h4>
            <p className="text-xs text-ink-400 mt-0.5">
              Add to your home screen for quick access.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-ink-500 hover:text-ink-300 text-xs px-1"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-base-700/60">
        {isIOS ? (
          <p className="text-[11px] text-ink-300">
            Tap the <span className="font-bold text-violet-300">Share button</span> at the bottom of Safari, then scroll down and tap <span className="font-bold text-violet-300">"Add to Home Screen"</span>.
          </p>
        ) : (
          <button
            onClick={handleInstallClick}
            className="w-full py-2 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition-colors shadow-lg shadow-violet-600/20"
          >
            Install App
          </button>
        )}
      </div>
    </div>
  );
}
