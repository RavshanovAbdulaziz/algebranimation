import type { CSSProperties, ReactNode } from "react";
import { fmt } from "../lib/la";

/** HTML matritsa (qavslar bilan). Satr/ustun/katakni ajratib ko'rsatish mumkin. */
export function MatGrid({
  M,
  hiRow,
  hiCol,
  hiCells,
  hiTone = "accent",
  dim,
  colColors,
  hide,
  label,
  bars = false,
  splitAfter,
}: {
  M: (number | string | ReactNode)[][];
  hiRow?: number;
  hiCol?: number;
  hiCells?: [number, number][];
  /** Ajratilgan kataklar rangi: accent (ko'k) yoki neg (to'q sariq, "−" hadlar uchun) */
  hiTone?: "accent" | "neg";
  /** (i, j) => true bo'lsa katak xira (ajratilgan katak hech qachon xiralashmaydi) */
  dim?: (i: number, j: number) => boolean;
  colColors?: string[];
  hide?: (i: number, j: number) => boolean;
  label?: ReactNode;
  bars?: boolean;
  /** shu ustundan keyin vertikal ajratuvchi chiziq (Sarrus, kengaytirilgan matritsa) */
  splitAfter?: number;
}) {
  const n = M[0]?.length ?? 0;
  return (
    <div className="matgrid-wrap">
      {label && <div className="matgrid-label">{label}</div>}
      <div className={"matgrid" + (bars ? " bars" : "")} style={{ gridTemplateColumns: `repeat(${n}, minmax(2.4em, auto))` } as CSSProperties}>
        {M.map((row, i) =>
          row.map((x, j) => {
            const hi = hiCells?.some(([a, b]) => a === i && b === j);
            const cls = [
              "cell",
              hiRow === i ? "hr" : "",
              hiCol === j ? "hc" : "",
              hi ? (hiTone === "neg" ? "hx neg" : "hx") : "",
              !hi && dim?.(i, j) ? "dim" : "",
              splitAfter !== undefined && j === splitAfter ? "split" : "",
            ].join(" ");
            return (
              <div key={i + "-" + j} className={cls} style={colColors?.[j] ? { color: colColors[j] } : undefined}>
                {hide?.(i, j) ? "" : typeof x === "number" ? fmt(x) : x}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
