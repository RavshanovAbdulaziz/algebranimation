import katex from "katex";
import { useLayoutEffect, useRef } from "react";

/** KaTeX formula. block=true bo'lsa alohida qatorda markazda chiqadi. */
export function Tex({ children, block = false }: { children: string; block?: boolean }) {
  const ref = useRef<HTMLDivElement & HTMLSpanElement>(null);
  useLayoutEffect(() => {
    // Matn ichida ham "daftardagidek" to'liq o'lcham: kasrlar ustma-ust, mayda emas
    if (ref.current) katex.render(block ? children : `\\displaystyle ${children}`, ref.current, { displayMode: block, throwOnError: false, strict: false });
  }, [children, block]);
  return block ? <div className="tex-block" ref={ref} /> : <span ref={ref} />;
}
