/**
 * The guarantee, made structural: no KaTeX error ever reaches the student.
 *
 * Pre-validating text (`mathHarden.ts`) has to guess which substrings remark-math will
 * treat as maths, and a regex cannot match that exactly — a corpus audit found five
 * error nodes that the pre-pass had never looked at. This plugin runs *after*
 * rehype-katex, so whatever remark-math decided was maths has already been through the
 * real renderer: any node KaTeX flagged is replaced with the formula as plain code.
 *
 * Use it after rehypeKatex. It needs no options.
 */
import type { Plugin } from "unified";
import type { Element, Parent, Root, RootContent } from "hast";

function classesOf(node: Element): string[] {
  const value = node.properties?.className;
  if (!value) return [];
  return Array.isArray(value) ? value.map(String) : String(value).split(/\s+/);
}

/** The TeX source KaTeX kept in the error node (it renders the input as its child). */
function sourceText(node: RootContent): string {
  if (node.type === "text") return node.value;
  if ("children" in node && Array.isArray(node.children)) {
    return node.children.map(sourceText).join("");
  }
  return "";
}

function fallback(node: Element): Element {
  const title = typeof node.properties?.title === "string" ? node.properties.title : "";
  const text = sourceText(node).trim();
  return {
    type: "element",
    tagName: "code",
    properties: {
      className: ["math-fallback"],
      // Keeps the reason available for debugging without showing it to the student.
      "data-katex-error": title || "unparsed",
    },
    children: [{ type: "text", value: text || "formula unavailable" }],
  };
}

const rehypeKatexSafe: Plugin<[], Root> = () => (tree: Root) => {
  const walk = (parent: Parent) => {
    parent.children = parent.children.map((child) => {
      if (child.type === "element") {
        if (classesOf(child).includes("katex-error")) return fallback(child);
        walk(child);
      }
      return child;
    });
  };
  walk(tree);
};

export default rehypeKatexSafe;
