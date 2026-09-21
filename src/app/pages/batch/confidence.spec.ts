import { confidenceRowClass } from './confidence';

describe('confidenceRowClass', () => {
  it('leaves a missing value white', () => {
    expect(confidenceRowClass(null)).toBe('app-confidence-none');
    expect(confidenceRowClass(undefined)).toBe('app-confidence-none');
  });

  it('uses gray for a generated value without confidence', () => {
    expect(confidenceRowClass(1.5)).toBe('app-confidence-perfect');
  });

  it('uses probability colors at their boundaries', () => {
    expect(confidenceRowClass(0)).toBe('app-confidence-low');
    expect(confidenceRowClass(0.69)).toBe('app-confidence-low');
    expect(confidenceRowClass(0.7)).toBe('app-confidence-medium');
    expect(confidenceRowClass(0.89)).toBe('app-confidence-medium');
    expect(confidenceRowClass(0.9)).toBe('app-confidence-high');
    expect(confidenceRowClass(1)).toBe('app-confidence-high');
  });

  it('uses blue for a manually edited value', () => {
    expect(confidenceRowClass(2)).toBe('app-confidence-zero');
  });
});
