import { Injectable, signal } from '@angular/core';

import { Batch, ClientConfig } from './metacheck-api.service';

@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  private readonly currentBatchState = signal<Batch | null>(null);
  private readonly clientConfigState = signal<ClientConfig>({ standaloneApp: true });

  readonly currentBatch = this.currentBatchState.asReadonly();
  readonly clientConfig = this.clientConfigState.asReadonly();

  setCurrentBatch(batch: Batch): void {
    this.currentBatchState.set(batch);
  }

  clearCurrentBatch(): void {
    this.currentBatchState.set(null);
  }

  setClientConfig(config: ClientConfig): void {
    this.clientConfigState.set(config);
  }
}
