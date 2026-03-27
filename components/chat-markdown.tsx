"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

type Props = {
    content: string;
};

export default function ChatMarkdown({ content }: Props) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                a: ({ href, children, ...props }) => (
                    <a
                        href={href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
                        {...props}
                    >
                        {children}
                    </a>
                ),
                h1: ({ children }) => (
                    <h1 className="text-2xl font-bold tracking-tight mt-2 mb-3">
                        {children}
                    </h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-xl font-semibold mt-4 mb-2">{children}</h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-lg font-semibold mt-3 mb-2">{children}</h3>
                ),
                p: ({ children }) => (
                    <p className="leading-7 mb-3 last:mb-0 whitespace-pre-wrap">
                        {children}
                    </p>
                ),
                ul: ({ children }) => (
                    <ul className="list-disc pl-5 space-y-1 my-3">{children}</ul>
                ),
                ol: ({ children }) => (
                    <ol className="list-decimal pl-5 space-y-1 my-3">{children}</ol>
                ),
                li: ({ children }) => <li className="leading-7">{children}</li>,
                blockquote: ({ children }) => (
                    <blockquote className="border-l-4 pl-4 italic text-muted-foreground my-3">
                        {children}
                    </blockquote>
                ),
                hr: () => <hr className="my-4 border-border" />,
                table: ({ children }) => (
                    <div className="my-4 w-full overflow-x-auto rounded-xl border border-border">
                        <table className="w-full border-collapse text-sm">
                            {children}
                        </table>
                    </div>
                ),
                thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
                th: ({ children }) => (
                    <th className="border border-border px-3 py-2 text-left font-semibold">
                        {children}
                    </th>
                ),
                td: ({ children }) => (
                    <td className="border border-border px-3 py-2 align-top">{children}</td>
                ),
                tr: ({ children }) => <tr>{children}</tr>,
                code: ({ inline, className, children, ...props }: any) => {
                    const code = String(children).replace(/\n$/, "");

                    if (inline) {
                        return (
                            <code
                                className="rounded-md bg-muted px-1.5 py-0.5 text-[0.9em] font-mono"
                                {...props}
                            >
                                {code}
                            </code>
                        );
                    }

                    return <CodeBlock code={code} />;
                },
            }}
        >
            {content}
        </ReactMarkdown>
    );
}

function CodeBlock({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // ignore
        }
    };

    return (
        <div className="relative my-4 overflow-hidden rounded-xl border border-border bg-zinc-950">
            <button
                onClick={handleCopy}
                className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white hover:bg-white/10"
            >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
            </button>
            <pre className="overflow-x-auto p-4 text-sm text-zinc-100">
                <code className="font-mono whitespace-pre">{code}</code>
            </pre>
        </div>
    );
}