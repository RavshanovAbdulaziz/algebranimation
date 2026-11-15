import type { ComponentType } from "react";
import { VektorLesson, AmallarLesson, KombinatsiyaLesson, BoglikLesson, SkalyarLesson } from "./vectors";
import { ChiziqLesson } from "./line";
import { MatritsaLesson, AlmashtirishLesson, KopaytmaLesson, DeterminantLesson, Det3Lesson } from "./matrices";
import { SistemaLesson, GaussLesson, KramerLesson, TeskariLesson, RangLesson } from "./systems";
import { XosLesson } from "./eigen";

export const LESSONS: Record<string, ComponentType> = {
  vektor: VektorLesson,
  amallar: AmallarLesson,
  kombinatsiya: KombinatsiyaLesson,
  boglik: BoglikLesson,
  skalyar: SkalyarLesson,
  chiziq: ChiziqLesson,
  matritsa: MatritsaLesson,
  almashtirish: AlmashtirishLesson,
  kopaytma: KopaytmaLesson,
  determinant: DeterminantLesson,
  det3: Det3Lesson,
  sistema: SistemaLesson,
  gauss: GaussLesson,
  kramer: KramerLesson,
  teskari: TeskariLesson,
  rang: RangLesson,
  xos: XosLesson,
};
