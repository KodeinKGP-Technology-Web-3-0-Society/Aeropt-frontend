import katex from "katex";

/** Inline or display KaTeX for marketing mockups. Source strings are authored, not user input. */
export default function TeX({
  children,
  display = false,
  className,
}: {
  children: string;
  display?: boolean;
  className?: string;
}) {
  const html = katex.renderToString(children, {
    throwOnError: false,
    displayMode: display,
  });
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
