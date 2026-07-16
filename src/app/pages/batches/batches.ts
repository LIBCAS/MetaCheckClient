import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { debounceTime, finalize, map, startWith } from 'rxjs';

import { AppStateService } from '../../services/app-state.service';
import {
  Batch,
  BatchState,
  ListBatchesParams,
  MetacheckApiService,
  SortOrder,
} from '../../services/metacheck-api.service';
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { batchStateKey } from '../../i18n/metacheck-translation-keys';

type BatchSortColumn =
  | 'batchId'
  | 'state'
  | 'path'
  | 'proarcBatchId'
  | 'createDate'
  | 'updateDate';

interface BatchFiltersForm {
  batchId: FormControl<string>;
  state: FormControl<BatchState | ''>;
  path: FormControl<string>;
  log: FormControl<string>;
  proarcBatchId: FormControl<string>;
}

@Component({
  selector: 'app-batches',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe
],
  templateUrl: './batches.html',
  styleUrl: './batches.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Batches implements OnInit {
  private readonly api = inject(MetacheckApiService);
  private readonly appState = inject(AppStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translator = inject(TranslateService);

  protected readonly displayedColumns = [
    'batchId',
    'state',
    'path',
    'proarcBatchId',
    'createDate',
    'updateDate',
    'log',
  ];
  protected readonly batchStates: readonly BatchState[] = [
    'EMPTY',
    'PLANNED',
    'GENERATING',
    'GENERATED',
    'EDITING',
    'EDITED',
    'STOPPED',
    'FAILED',
  ];
  protected readonly filterForm = new FormGroup<BatchFiltersForm>({
    batchId: new FormControl('', { nonNullable: true }),
    state: new FormControl<BatchState | ''>('', { nonNullable: true }),
    path: new FormControl('', { nonNullable: true }),
    log: new FormControl('', { nonNullable: true }),
    proarcBatchId: new FormControl('', { nonNullable: true }),
  });
  protected readonly batches = signal<readonly Batch[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sortActive = signal<BatchSortColumn>('createDate');
  protected readonly sortDirection = signal<SortDirection>('desc');
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(25);
  protected readonly batchStateKey = batchStateKey;
  private readonly editableBatchStates: readonly BatchState[] = ['GENERATED', 'EDITING', 'EDITED'];

  ngOnInit(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pageIndex.set(0);
        this.loadBatches();
      });

    this.loadBatches();
  }

  protected refresh(): void {
    this.loadBatches();
  }

  protected clearFilters(): void {
    this.filterForm.reset({
      batchId: '',
      state: '',
      path: '',
      log: '',
      proarcBatchId: '',
    });
  }

  protected readonly filterValues = toSignal(
    this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.getRawValue()),
      map(() => this.filterForm.getRawValue()),
    ),
    { initialValue: this.filterForm.getRawValue() },
  );

  protected readonly hasActiveFilters = computed(() => {
    const filters = this.filterValues();
    return Boolean(
      filters.batchId.trim() ||
      filters.state ||
      filters.path.trim() ||
      filters.log.trim() ||
      filters.proarcBatchId.trim()
    );
  });

  protected onSortChange(sort: Sort): void {
    if (this.isBatchSortColumn(sort.active)) {
      this.sortActive.set(sort.active);
      this.sortDirection.set(sort.direction);
      this.pageIndex.set(0);
      this.loadBatches();
    }
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadBatches();
  }

  protected openBatch(batch: Batch): void {
    if (batch.batchId === null || batch.batchId === undefined) {
      return;
    }

    if (!this.isEditableBatch(batch)) {
      this.snackBar.open(
        this.translator.instant('batches.message.stateNotEditable'),
        this.translator.instant('common.close'),
        {
        duration: 10000,
        panelClass: ['app-snackbar-error'],
        verticalPosition: 'top',
        },
      );
      return;
    }

    this.appState.setCurrentBatch(batch);
    void this.router.navigate(['/batches', batch.batchId]);
  }

  protected openBatchFromKeyboard(event: Event, batch: Batch): void {
    event.preventDefault();
    this.openBatch(batch);
  }

  restartBatch(batchId: number) {
    if (batchId === null) {
      return;
    }

    this.loading.set(true);

    this.api
      .restartBatch(batchId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (updatedMetadata) => {
          this.loadBatches()
        },
        error: (error: unknown) => {
          alert(this.describeError(error));
        },
      });
  }

  stopBatch(batchId: number) {

    if (batchId === null) {
      return;
    }

    this.loading.set(true);

    this.api
      .stopBatch(batchId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (updatedMetadata) => {
          this.loadBatches()
        },
        error: (error: unknown) => {
          alert(this.describeError(error));
        },
      });
  }

  private loadBatches(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api
      .listBatches(this.buildListParams())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.batches.set(response.data);
          this.total.set(response.total);
        },
        error: (error: unknown) => {
          this.batches.set([]);
          this.total.set(0);
          this.error.set(this.describeError(error));
        },
      });
  }

  private buildListParams(): ListBatchesParams {
    const filters = this.filterForm.getRawValue();
    const sortDirection = this.sortDirection();

    return {
      batchId: this.numberParam(filters.batchId),
      state: filters.state || undefined,
      path: this.textParam(filters.path),
      log: this.textParam(filters.log),
      proarcBatchId: this.numberParam(filters.proarcBatchId),
      startRow: this.pageIndex() * this.pageSize(),
      size: this.pageSize(),
      sortBy: sortDirection ? this.sortActive() : undefined,
      sort: this.sortOrder(sortDirection),
    };
  }

  private numberParam(value: string): number | undefined {

    const trimmedValue = (value+'').trim();

    if (!trimmedValue) {
      return undefined;
    }

    const numberValue = Number(trimmedValue);
    return Number.isFinite(numberValue) ? numberValue : undefined;
  }

  private textParam(value: string): string | undefined {
    const trimmedValue = value.trim();
    return trimmedValue || undefined;
  }

  private sortOrder(direction: SortDirection): SortOrder | undefined {
    return direction === 'asc' || direction === 'desc' ? direction : undefined;
  }

  private isBatchSortColumn(value: string): value is BatchSortColumn {
    return ['batchId', 'state', 'path', 'proarcBatchId', 'createDate', 'updateDate'].includes(value);
  }

  private isEditableBatch(batch: Batch): boolean {
    return batch.state !== null && batch.state !== undefined && this.editableBatchStates.includes(batch.state);
  }

  private describeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }

      return error.message;
    }

    return this.translator.instant('batches.error.loadBatches');
  }
}
