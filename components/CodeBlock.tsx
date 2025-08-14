import React, { useState } from 'react';

interface CodeBlockProps {
  language: string;
  code: string;
  onEdit: (code: string) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code, onEdit }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };
  
  const handleEdit = () => {
    onEdit(code);
  }

  return (
    <pre className="bg-slate-900/70 rounded-md pt-10 p-3 my-2 overflow-x-auto text-sm font-mono relative group">
      <div className="absolute top-2 left-3 right-3 flex items-center justify-between">
        <span className="text-xs text-slate-400 select-none">{language}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleEdit}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md"
              title="Alterar este código"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            <button
              onClick={handleCopy}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md"
              title={isCopied ? "Copiado!" : "Copiar código"}
            >
              {isCopied ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              )}
            </button>
        </div>
      </div>
      <code className={`language-${language}`}>{code}</code>
    </pre>
  );
};

export default CodeBlock;
