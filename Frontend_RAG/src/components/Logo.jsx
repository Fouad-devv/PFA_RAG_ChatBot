// Scales of Justice icon — represents Moroccan Labor Code legal assistant
const ScalesIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.589-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.589-1.202L5.25 4.97z" />
  </svg>
);

// size: "sm" | "md" | "lg" | "xl"
// dark: true = on dark bg (landing), false = on white bg (sidebars)
// showText: show app name + subtitle beside the icon
export const AppLogo = ({ size = "md", dark = false, showText = false }) => {
  const s = {
    sm: { box: "w-8 h-8 rounded-xl",   icon: "w-4 h-4",  shadow: dark ? "shadow-emerald-500/30" : "shadow-emerald-200" },
    md: { box: "w-9 h-9 rounded-xl",   icon: "w-5 h-5",  shadow: dark ? "shadow-emerald-500/30" : "shadow-emerald-200" },
    lg: { box: "w-14 h-14 rounded-2xl", icon: "w-7 h-7", shadow: dark ? "shadow-emerald-500/40" : "shadow-emerald-200" },
    xl: { box: "w-16 h-16 rounded-2xl", icon: "w-8 h-8", shadow: dark ? "shadow-emerald-500/40" : "shadow-emerald-200" },
  }[size];

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s.box} bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg ${s.shadow} flex-shrink-0`}>
        <ScalesIcon className={`${s.icon} text-white`} />
      </div>
      {showText && (
        <div className="min-w-0">
          <p className={`font-bold text-sm leading-tight tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
            Assistant Juridique
          </p>
          <p className={`text-[10px] leading-tight truncate ${dark ? "text-white/55" : "text-slate-400"}`}>
            Code du Travail Marocain
          </p>
        </div>
      )}
    </div>
  );
};

// Small circular avatar used next to AI messages
export const AIAvatar = ({ className = "w-8 h-8" }) => (
  <div className={`${className} rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-100`}>
    <ScalesIcon className="w-[45%] h-[45%] text-white" />
  </div>
);
