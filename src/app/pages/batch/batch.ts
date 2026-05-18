import { DecimalPipe, NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SplitAreaComponent, SplitComponent } from 'angular-split';
import { finalize } from 'rxjs';

import {
  ElementInfo,
  MetadataResponse,
  MetacheckApiService,
  ObjectInfo,
} from '../../services/metacheck-api.service';

@Component({
  selector: 'app-batch',
  imports: [
    DecimalPipe,
    NgClass,
    MatButtonModule,
    MatProgressBarModule,
    MatTableModule,
    RouterLink,
    SplitAreaComponent,
    SplitComponent,
  ],
  templateUrl: './batch.html',
  styleUrl: './batch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Batch implements OnInit, OnDestroy {
  private readonly api = inject(MetacheckApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly displayedObjectColumns = ['uuid', 'model', 'percentage'];
  protected readonly displayedMetadataColumns = ['field', 'originalValue', 'editedValue', 'percentage'];
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

  ngOnInit(): void {
    const batchId = this.parseBatchId(this.route.snapshot.paramMap.get('batchId'));

    if (batchId === null) {
      this.error.set('Invalid batch ID.');
      return;
    }

    this.batchId.set(batchId);
    this.loadObjects(batchId);
  }

  ngOnDestroy(): void {
    this.revokeImageUrl();
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
      return 'confidence-zero';
    }

    if (percentage < 0.7) {
      return 'confidence-low';
    }

    if (percentage < 0.9) {
      return 'confidence-medium';
    }

    if (percentage < 1) {
      return 'confidence-high';
    }

    return 'confidence-perfect';
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

  private selectInitialObject(objects: readonly ObjectInfo[]): void {
    const selectedUuid = this.selectedObject()?.uuid;
    const selectedObject = objects.find((object) => object.uuid === selectedUuid) ?? objects[0];

    if (selectedObject) {
      this.selectObject(selectedObject);
      return;
    }

    this.clearSelectedObject();
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

    return 'Unable to load batch objects.';
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
}
