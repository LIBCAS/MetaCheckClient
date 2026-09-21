import {
  ALTERNATE_LEFT_RIGHT,
  ALTERNATE_RIGHT_LEFT,
  resolveBulkPageSide,
} from './bulk-page-edit';

describe('resolveBulkPageSide', () => {
  it('alternates left and right starting with left', () => {
    expect([0, 1, 2, 3].map((index) => resolveBulkPageSide(ALTERNATE_LEFT_RIGHT, index)))
      .toEqual(['left', 'right', 'left', 'right']);
  });

  it('alternates right and left starting with right', () => {
    expect([0, 1, 2, 3].map((index) => resolveBulkPageSide(ALTERNATE_RIGHT_LEFT, index)))
      .toEqual(['right', 'left', 'right', 'left']);
  });

  it('preserves a fixed side', () => {
    expect(resolveBulkPageSide('single_page', 3)).toBe('single_page');
  });
});
