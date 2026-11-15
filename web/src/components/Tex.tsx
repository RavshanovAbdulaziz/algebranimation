import katex from "katex";
import { useLayoutEffect, useRef } from "react";

/** KaTeX formula. block=true bo'lsa alohida qatorda markazda chiqadi. */
export function Tex({ children, block = false }: { children: string; block?: boolean }) {
  const ref = useRef<HTMLDivElement & HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (ref.current) katex.render(children, ref.current, { displayMode: block, throwOnError: false, strict: false });
  }, [children, block]);
  return block ? <div className="tex-block" ref={ref} /> : <span ref={ref} />;
}
