import { Injectable } from '@angular/core';
import {
  MissingTranslationHandler,
  MissingTranslationHandlerParams,
} from '@ngx-translate/core';

@Injectable()
export class MetacheckMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams): string {
    return this.serverValueFromKey(params.key) ?? params.key;
  }

  private serverValueFromKey(key: string): string | null {
    const dynamicPrefixes = [
      'batch.state.',
      'metadata.field.',
      'metadata.value.pageType.',
      'metadata.value.side.',
      'object.model.',
    ];
    const prefix = dynamicPrefixes.find((item) => key.startsWith(item));

    if (!prefix) {
      return null;
    }

    return key.slice(prefix.length) || '-';
  }
}
