import React from "react";

function LoadingAnimation() {
  return (
    <div className="flex items-start gap-3 max-w-[72%] py-1">
      <div className="flex items-center gap-1 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
      </div>
    </div>
  );
}

export default LoadingAnimation;