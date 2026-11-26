import type { PrepTopic } from "./core";
import { T1 } from "./t1";
import { T2 } from "./t2";
import { T3 } from "./t3";
import { T4 } from "./t4";
import { T5 } from "./t5";
import { T6 } from "./t6";

export const PREP: PrepTopic[] = [T1, T2, T3, T4, T5, T6];
export const prepBySlug = Object.fromEntries(PREP.map((t) => [t.slug, t])) as Record<string, PrepTopic>;
export const prepByN = Object.fromEntries(PREP.map((t) => [t.n, t])) as Record<number, PrepTopic>;
