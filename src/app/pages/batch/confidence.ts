export type ConfidenceRowClass =
  | 'app-confidence-none'
  | 'app-confidence-zero'
  | 'app-confidence-low'
  | 'app-confidence-medium'
  | 'app-confidence-high'
  | 'app-confidence-perfect';

export const GENERATED_CONFIDENCE = 1.5;
export const EDITED_CONFIDENCE = 2;
export const LOW_CONFIDENCE_LIMIT = 0.7;
export const MEDIUM_CONFIDENCE_LIMIT = 0.9;

export function confidenceRowClass(
  percentage: number | null | undefined,
): ConfidenceRowClass {
  if (percentage === null || percentage === undefined) {
    return 'app-confidence-none';
  }

  if (percentage >= EDITED_CONFIDENCE) {
    return 'app-confidence-zero';
  }

  if (percentage > 1) {
    return 'app-confidence-perfect';
  }

  if (percentage < LOW_CONFIDENCE_LIMIT) {
    return 'app-confidence-low';
  }

  if (percentage < MEDIUM_CONFIDENCE_LIMIT) {
    return 'app-confidence-medium';
  }

  return 'app-confidence-high';
}
