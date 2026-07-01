import { Injectable, signal } from '@angular/core';

import { Batch } from './metacheck-api.service';

@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  private readonly currentBatchState = signal<Batch | null>(null);
  readonly currentBatch = this.currentBatchState.asReadonly();

  setCurrentBatch(batch: Batch): void {
    this.currentBatchState.set(batch);
  }

  clearCurrentBatch(): void {
    this.currentBatchState.set(null);
  }
}
