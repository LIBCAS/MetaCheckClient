import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SplitAreaComponent, SplitComponent } from 'angular-split';
import { finalize } from 'rxjs';

import { AppStateService } from '../../services/app-state.service';
import {
  Batch as BatchInfo,
  ElementInfo,
  MetadataResponse,
  MetacheckApiService,
  ObjectElementInfo,
  ObjectInfo,
} from '../../services/metacheck-api.service';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltip, MatTooltipModule } from "@angular/material/tooltip";
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  batchStateKey,
  elementFieldKey,
  metadataValueKey,
  objectModelKey,
} from '../../i18n/metacheck-translation-keys';

type ObjectViewType = 'list' | 'images';

@Component({
  selector: 'app-batch',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatCardModule,
    MatProgressBarModule,
    MatTableModule,
    RouterLink,
    SplitAreaComponent,
    SplitComponent,
    MatChipsModule,
    MatTooltipModule,
    TranslatePipe
],
  templateUrl: './batch.html',
  styleUrl: './batch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Batch implements OnInit, OnDestroy {
  public readonly api = inject(MetacheckApiService);
  private readonly appState = inject(AppStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly translator = inject(TranslateService);
  private readonly percentFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

  @ViewChild('objectsScroll') private objectsScroll?: ElementRef<HTMLElement>;

  protected readonly displayedObjectColumns = [
    'model',
    'percentage',
    'pageType',
    'pageNumber',
    'pageSide',
    'pageIndex',
    'uuid',
  ];
  protected readonly displayedMetadataColumns = ['field', 'editedValue', 'originalValue', 'percentage'];
  protected readonly pageTypeOptions = [
    '',
    'Abstract',
    'Advertisement',
    'Appendix',
    'BackCover',
    'BackEndPaper',
    'BackEndSheet',
    'Bibliography',
    'Blank',
    'CalibrationTable',
    'Cover',
    'CustomInclude',
    'Dedication',
    'Edge',
    'Errata',
    'FlyLeaf',
    'FragmentsOfBookbinding',
    'FrontCover',
    'FrontEndPaper',
    'FrontEndSheet',
    'FrontJacket',
    'Frontispiece',
    'Illustration',
    'Impressum',
    'Imprimatur',
    'Index',
    'Jacket',
    'ListOfIllustrations',
    'ListOfMaps',
    'ListOfTables',
    'Map',
    'NormalPage',
    'Obituary',
    'Preface',
    'SheetMusic',
    'Spine',
    'Table',
    'TableOfContents',
    'TitlePage'
  ];
  protected readonly sideOptions = [
    '',
    'left',
    'right',
    'single_page'
  ];
  protected readonly batchId = signal<number | null>(null);
  protected readonly objects = signal<readonly ObjectInfo[]>([]);
  protected readonly selectedObject = signal<ObjectInfo | null>(null);
  protected readonly imageUrl = signal<string | null>(null);
  protected readonly metadata = signal<MetadataResponse | null>(null);
  protected readonly loadingObjects = signal(false);
  protected readonly loadingImage = signal(false);
  protected readonly loadingMetadata = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly imageError = signal<string | null>(null);
  protected readonly metadataError = signal<string | null>(null);
  protected readonly metadataDirty = signal(false);
  protected readonly savingMetadata = signal(false);
  protected readonly batchStateKey = batchStateKey;
  protected readonly elementFieldKey = elementFieldKey;
  protected readonly objectModelKey = objectModelKey;
  protected readonly currentBatch = computed(() => {
    const currentBatch = this.appState.currentBatch();
    const batchId = this.batchId();

    if (currentBatch?.batchId !== batchId) {
      return null;
    }

    return currentBatch;
  });
  protected readonly currentBatchPathName = computed(() => this.pathName(this.currentBatch()?.path));

  viewType: ObjectViewType = 'images';

  ngOnInit(): void {
    const batchId = this.parseBatchId(this.route.snapshot.paramMap.get('batchId'));

    if (batchId === null) {
      this.error.set(this.translator.instant('batchDetail.error.invalidBatchId'));
      return;
    }

    this.batchId.set(batchId);
    this.loadBatchInfo(batchId);
    this.loadObjects(batchId);
  }

  ngOnDestroy(): void {
    this.revokeImageUrl();
  }

  setViewType(type: ObjectViewType): void {
    this.viewType = type;
  }

  protected refreshObjects(): void {
    const batchId = this.batchId();

    if (batchId !== null) {
      this.loadObjects(batchId);
    }
  }

  protected selectObject(object: ObjectInfo): void {
    const batchId = this.batchId();

    if (batchId === null) {
      return;
    }

    this.selectedObject.set(object);
    this.metadata.set(null);
    this.metadataDirty.set(false);
    this.imageError.set(null);
    this.metadataError.set(null);
    this.revokeImageUrl();
    this.loadObjectImage(batchId, object.uuid);
    this.loadObjectMetadata(batchId, object.uuid);
  }

  protected selectObjectFromKeyboard(event: Event, object: ObjectInfo): void {
    event.preventDefault();
    this.selectObject(object);
  }

  protected isSelectedObject(object: ObjectInfo): boolean {
    return this.selectedObject()?.uuid === object.uuid;
  }

  protected confidenceRowClass(percentage: number | null | undefined): string | null {
    if (percentage === null || percentage === undefined) {
      return null;
    }

    if (percentage <= 0) {
      return 'app-confidence-zero';
    }

    if (percentage < 0.7) {
      return 'app-confidence-low';
    }

    if (percentage < 0.9) {
      return 'app-confidence-medium';
    }

    if (percentage < 1) {
      return 'app-confidence-high';
    }

    return 'app-confidence-perfect';
  }

  protected hasConfidenceRowClass(
    percentage: string | number | null | undefined,
    className: string,
  ): boolean {
    return this.confidenceRowClass(this.parsePercentage(percentage)) === className;
  }

  protected hasMetadataConfidenceRowClass(element: ElementInfo, className: string): boolean {
    return this.metadataConfidenceRowClass(element) === className;
  }

  protected metadataConfidenceRowClass(element: ElementInfo): string | null {
    if (this.hasValue(element.editedValue)) {
      return this.confidenceRowClass(1);
    }

    const percentage = this.parsePercentage(element.percentage);

    if (percentage === null && this.hasValue(element.originalValue)) {
      return this.confidenceRowClass(0);
    }

    return this.confidenceRowClass(percentage);
  }

  protected updateEditedValue(element: ElementInfo, value: string): void {
    const metadata = this.metadata();

    if (metadata === null || this.editedValue(element) === value) {
      return;
    }

    element.editedValue = value;
    this.metadata.set({ ...metadata });
    this.metadataDirty.set(true);
    this.metadataError.set(null);
  }

  protected saveMetadata(): void {
    const batchId = this.batchId();
    const selectedObject = this.selectedObject();
    const metadata = this.metadata();

    if (
      batchId === null ||
      selectedObject === null ||
      metadata === null ||
      !this.metadataDirty() ||
      this.savingMetadata()
    ) {
      return;
    }

    this.savingMetadata.set(true);
    this.metadataError.set(null);

    this.api
      .updateObjectMetadata({
        batchId,
        pid: selectedObject.uuid,
        metadata,
      })
      .pipe(finalize(() => this.savingMetadata.set(false)))
      .subscribe({
        next: (updatedMetadata) => {
          if (this.selectedObject()?.uuid !== selectedObject.uuid) {
            return;
          }

          this.metadata.set(updatedMetadata);
          this.metadataDirty.set(false);
          this.refreshObjectsAfterMetadataSave(batchId, selectedObject.uuid);
        },
        error: (error: unknown) => {
          if (this.selectedObject()?.uuid === selectedObject.uuid) {
            this.metadataError.set(this.describeError(error));
          }
        },
      });
  }

  protected metadataEditOptions(element: ElementInfo): readonly string[] | null {
    if (element.field === 'pageType') {
      return this.withCurrentValue(this.pageTypeOptions, element.editedValue);
    }

    if (element.field === 'side') {
      return this.withCurrentValue(this.sideOptions, element.editedValue);
    }

    return null;
  }

  protected editedValue(element: ElementInfo): string {
    return element.editedValue ?? '';
  }

  protected formatConfidence(percentage: string | number | null | undefined): string {
    const parsedPercentage = this.parsePercentage(percentage);

    if (parsedPercentage === null) {
      return '-';
    }

    return `${this.percentFormatter.format(parsedPercentage * 100)} %`;
  }

  protected isPageObject(object: ObjectInfo): boolean {
    return object.model.toLowerCase() === 'page';
  }

  protected displayObjectValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    return String(value);
  }

  protected objectElementValue(
    object: ObjectInfo,
    field: ObjectElementInfo['field'],
  ): string | number | null | undefined {
    return object.elementsInfoResponse?.find((element) => element.field === field)?.value;
  }

  protected objectElementValueKey(
    object: ObjectInfo,
    field: ObjectElementInfo['field'],
  ): string {
    return metadataValueKey(field, this.objectElementValue(object, field));
  }

  protected metadataElementValueKey(element: ElementInfo, value: string | null | undefined): string {
    return metadataValueKey(element.field, value);
  }

  private loadObjects(batchId: number): void {
    this.loadingObjects.set(true);
    this.error.set(null);

    this.api
      .listObjects(batchId)
      .pipe(finalize(() => this.loadingObjects.set(false)))
      .subscribe({
        next: (objects) => {
          this.objects.set(objects);
          this.selectInitialObject(objects);
        },
        error: (error: unknown) => {
          this.objects.set([]);
          this.clearSelectedObject();
          this.error.set(this.describeError(error));
        },
      });
  }

  private loadBatchInfo(batchId: number): void {
    if (this.currentBatch()?.batchId === batchId) {
      return;
    }

    this.api.listBatches({ batchId, size: 1 }).subscribe({
      next: (response) => {
        const batch = response.data.find((item) => item.batchId === batchId);

        if (batch) {
          this.appState.setCurrentBatch(batch);
        }
      },
      error: () => {
        // Batch objects can still be reviewed if the summary lookup fails.
      },
    });
  }

  private refreshObjectsAfterMetadataSave(batchId: number, selectedUuid: string): void {
    const scrollState = this.captureObjectsScroll();

    this.loadingObjects.set(true);
    this.error.set(null);

    this.api
      .listObjects(batchId)
      .pipe(finalize(() => this.loadingObjects.set(false)))
      .subscribe({
        next: (objects) => {
          this.objects.set(objects);

          const selectedObject = objects.find((object) => object.uuid === selectedUuid);
          if (selectedObject) {
            this.selectedObject.set(selectedObject);
          } else {
            this.selectInitialObject(objects);
          }

          this.restoreObjectsScroll(scrollState);
        },
        error: (error: unknown) => {
          this.error.set(this.describeError(error));
          this.restoreObjectsScroll(scrollState);
        },
      });
  }

  private selectInitialObject(objects: readonly ObjectInfo[]): void {
    const selectedUuid = this.selectedObject()?.uuid;
    const selectedObject = objects.find((object) => object.uuid === selectedUuid) ?? objects[0];

    if (selectedObject) {
      this.selectObject(selectedObject);
      return;
    }

    this.clearSelectedObject();
  }

  public getThumbUrl(pid: string) {
    const url = `/object/image?typ=thumbnail&batchId=${this.batchId()}&pid=${pid}`
    return this.api.getApiUrl(url)
  }

  private loadObjectImage(batchId: number, pid: string): void {
    this.loadingImage.set(true);

    this.api
      .getObjectImage(batchId, pid)
      .pipe(
        finalize(() => {
          if (this.selectedObject()?.uuid === pid) {
            this.loadingImage.set(false);
          }
        }),
      )
      .subscribe({
        next: (image) => {
          if (this.selectedObject()?.uuid !== pid) {
            return;
          }

          this.revokeImageUrl();
          this.imageUrl.set(URL.createObjectURL(image));
        },
        error: (error: unknown) => {
          if (this.selectedObject()?.uuid !== pid) {
            return;
          }

          this.imageError.set(this.describeError(error));
        },
      });
  }

  private loadObjectMetadata(batchId: number, pid: string): void {
    this.loadingMetadata.set(true);

    this.api
      .getObjectMetadata(batchId, pid)
      .pipe(
        finalize(() => {
          if (this.selectedObject()?.uuid === pid) {
            this.loadingMetadata.set(false);
          }
        }),
      )
      .subscribe({
        next: (metadata) => {
          if (this.selectedObject()?.uuid === pid) {
            this.metadata.set(metadata);
            this.metadataDirty.set(false);
          }
        },
        error: (error: unknown) => {
          if (this.selectedObject()?.uuid === pid) {
            this.metadataError.set(this.describeError(error));
          }
        },
      });
  }

  private clearSelectedObject(): void {
    this.selectedObject.set(null);
    this.metadata.set(null);
    this.metadataDirty.set(false);
    this.savingMetadata.set(false);
    this.imageError.set(null);
    this.metadataError.set(null);
    this.loadingImage.set(false);
    this.loadingMetadata.set(false);
    this.revokeImageUrl();
  }

  private parseBatchId(value: string | null): number | null {
    if (value === null || value.trim() === '') {
      return null;
    }

    const batchId = Number(value);
    return Number.isInteger(batchId) && batchId >= 0 ? batchId : null;
  }

  private describeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }

      return error.message;
    }

    return this.translator.instant('batchDetail.error.loadObjects');
  }

  private revokeImageUrl(): void {
    const imageUrl = this.imageUrl();

    if (imageUrl !== null) {
      URL.revokeObjectURL(imageUrl);
      this.imageUrl.set(null);
    }
  }

  private parsePercentage(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const percentage = Number(value);
    return Number.isFinite(percentage) ? percentage : null;
  }

  private hasValue(value: string | null | undefined): boolean {
    return value !== null && value !== undefined && value.trim() !== '';
  }

  private pathName(path: BatchInfo['path']): string {
    const normalizedPath = path?.trim().replace(/[\\/]+$/, '');

    if (!normalizedPath) {
      return '-';
    }

    return normalizedPath.split(/[\\/]/).pop() || normalizedPath;
  }

  private withCurrentValue(options: readonly string[], value: string | null | undefined): readonly string[] {
    const currentValue = value?.trim();

    if (!currentValue || options.includes(currentValue)) {
      return options;
    }

    return [currentValue, ...options];
  }

  private captureObjectsScroll(): { left: number; top: number } {
    const element = this.objectsScroll?.nativeElement;

    return {
      left: element?.scrollLeft ?? 0,
      top: element?.scrollTop ?? 0,
    };
  }

  private restoreObjectsScroll(scrollState: { left: number; top: number }): void {
    window.setTimeout(() => {
      const element = this.objectsScroll?.nativeElement;

      if (element) {
        element.scrollLeft = scrollState.left;
        element.scrollTop = scrollState.top;
      }
    });
  }
}
