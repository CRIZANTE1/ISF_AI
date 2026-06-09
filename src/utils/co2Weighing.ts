/**
 * Critério de pesagem CO2: perda máxima 10% da carga nominal.
 */

export const CO2_AGENT_VALUE = 'CO2';

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Carga nominal: preferir capacidade (kg); senão PC − PV se ambos existirem.
 */
export function calcCargaNominal(
  pc: number | null | undefined,
  pv: number | null | undefined,
  capacidade: number | null | undefined
): number | null {
  if (capacidade != null && capacidade > 0 && Number.isFinite(capacidade)) {
    return capacidade;
  }
  if (pc != null && pv != null && Number.isFinite(pc) && Number.isFinite(pv)) {
    const v = pc - pv;
    return v > 0 && Number.isFinite(v) ? round3(v) : null;
  }
  return null;
}

/** Perda = PC − peso medido do conjunto (kg). */
export function calcPerda(pc: number, pesado: number): number {
  return round3(pc - pesado);
}

/** Aprovado se perda ≤ 10% da carga nominal (com tolerância numérica). */
export function isAprovado(perda: number, carga: number, toleranciaMin = 0.001): boolean {
  if (carga <= 0 || !Number.isFinite(carga)) return false;
  const limite = 0.1 * carga;
  return perda <= limite + toleranciaMin;
}

/** Próxima pesagem semestral (+6 meses), formato YYYY-MM-DD. */
export function getNextPesagemDate(date: string): string {
  try {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      const fallback = new Date();
      fallback.setMonth(fallback.getMonth() + 6);
      return fallback.toISOString().split('T')[0];
    }
    parsed.setMonth(parsed.getMonth() + 6);
    return parsed.toISOString().split('T')[0];
  } catch {
    const fallback = new Date();
    fallback.setMonth(fallback.getMonth() + 6);
    return fallback.toISOString().split('T')[0];
  }
}

export type Co2WeighingEvaluation = {
  cargaNominal: number | null;
  perda: number;
  limite: number | null;
  aprovado: boolean;
};

export function evaluateCo2Weighing(
  pc: number | null | undefined,
  pv: number | null | undefined,
  capacidade: number | null | undefined,
  pesoMedido: number | null | undefined
): Co2WeighingEvaluation {
  const cargaNominal = calcCargaNominal(pc, pv, capacidade);

  if (pc == null || !Number.isFinite(pc) || pesoMedido == null || !Number.isFinite(pesoMedido)) {
    return { cargaNominal, perda: 0, limite: null, aprovado: false };
  }

  const perda = calcPerda(pc, pesoMedido);

  if (cargaNominal == null || cargaNominal <= 0) {
    return { cargaNominal, perda, limite: null, aprovado: false };
  }

  const limite = round3(0.1 * cargaNominal);
  const aprovado = isAprovado(perda, cargaNominal);

  return { cargaNominal, perda, limite, aprovado };
}
