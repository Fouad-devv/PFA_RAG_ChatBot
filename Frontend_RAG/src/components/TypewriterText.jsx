import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const nextWordEnd = (text, from) => {
  let i = from;
  while (i < text.length && text[i] === " ") i++;
  while (i < text.length && text[i] !== " " && text[i] !== "\n") i++;
  if (i < text.length) i++;
  return i;
};

const MD_COMPONENTS = (rtl) => ({
  p:          ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  strong:     ({ children }) => <strong className="font-semibold text-emerald-700">{children}</strong>,
  em:         ({ children }) => <em className="italic text-slate-600">{children}</em>,
  ul:         ({ children }) => <ul className="list-disc list-outside ml-4 space-y-1 my-2">{children}</ul>,
  ol:         ({ children }) => <ol className="list-decimal list-outside ml-4 space-y-1 my-2">{children}</ol>,
  li:         ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1:         ({ children }) => <h1 className="text-[17px] font-bold text-slate-800 mt-4 mb-1.5">{children}</h1>,
  h2:         ({ children }) => <h2 className="text-[15px] font-bold text-slate-800 mt-3 mb-1">{children}</h2>,
  h3:         ({ children }) => <h3 className="text-[14px] font-semibold text-slate-700 mt-2 mb-1">{children}</h3>,
  code:       ({ children }) => <code className="bg-slate-100 text-emerald-700 px-1.5 py-0.5 rounded text-[13px] font-mono">{children}</code>,
  blockquote: ({ children }) => <blockquote className="border-l-[3px] border-emerald-300 pl-3 my-2 text-slate-500 italic">{children}</blockquote>,
  hr:         ()             => <hr className="border-slate-200 my-3" />,
  a:          ({ href, children }) => (
    <a href={href} className="text-emerald-600 underline underline-offset-2 hover:text-emerald-800" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
});

const TypewriterText = ({ content, streaming, rtl }) => {
  const [shown, setShown] = useState(() => (streaming ? "" : content));
  const [done, setDone]   = useState(!streaming);
  const wasStreaming       = useRef(streaming);
  const ref                = useRef({ content, streaming });
  ref.current.content   = content;
  ref.current.streaming = streaming;

  useEffect(() => {
    if (!streaming) { setShown(content); setDone(true); }
  }, [content, streaming]);

  useEffect(() => {
    if (!streaming) return;
    const lenRef = { current: 0 };
    const id = setInterval(() => {
      const { content: c, streaming: s } = ref.current;
      if (!s) { setShown(c); setDone(true); clearInterval(id); return; }
      if (lenRef.current < c.length) {
        for (let i = 0; i < 4 && lenRef.current < c.length; i++)
          lenRef.current = nextWordEnd(c, lenRef.current);
        setShown(c.slice(0, lenRef.current));
      }
    }, 55);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const components = MD_COMPONENTS(rtl);

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className={!done ? "streaming-msg" : (wasStreaming.current ? "animate-fade-only" : "")}
    >
      {shown
        ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{shown}</ReactMarkdown>
        : !done && <span className="cursor-block" />
      }
    </div>
  );
};

export default TypewriterText;
