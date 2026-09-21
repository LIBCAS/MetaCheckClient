import { metadataValueKey } from './metacheck-translation-keys';

describe('metadataValueKey', () => {
  it('returns translation keys for representative page values', () => {
    expect(metadataValueKey('genre', 'reprePage')).toBe('metadata.value.genre.reprePage');
    expect(metadataValueKey('genre', 'page')).toBe('metadata.value.genre.page');
  });
});
