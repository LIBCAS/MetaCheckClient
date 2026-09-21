import { BatchState, ElementInfoType } from '../services/metacheck-api.service';

type ServerValue = string | number | null | undefined;

export function batchStateKey(state: BatchState | null | undefined): string {
  return serverValueKey('batch.state', state);
}

export function elementFieldKey(field: ElementInfoType | 'uuid' | null | undefined): string {
  return serverValueKey('metadata.field', field);
}

export function objectModelKey(model: string | null | undefined): string {
  return serverValueKey('object.model', model);
}

export function metadataValueKey(
  field: ElementInfoType | 'uuid' | null | undefined,
  value: ServerValue,
): string {
  if (isEmpty(value)) {
    return 'common.empty';
  }

  if (field === 'pageType' || field === 'side' || field === 'genre') {
    return serverValueKey(`metadata.value.${field}`, value);
  }

  return String(value);
}

function serverValueKey(prefix: string, value: ServerValue): string {
  if (isEmpty(value)) {
    return 'common.empty';
  }

  return `${prefix}.${value}`;
}

function isEmpty(value: ServerValue): boolean {
  return value === null || value === undefined || value === '';
}
