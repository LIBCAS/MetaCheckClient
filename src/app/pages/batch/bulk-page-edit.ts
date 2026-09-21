import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import {
  ElementInfo,
  ElementInfoType,
  MetacheckApiService,
  ObjectInfo,
} from '../../services/metacheck-api.service';

type NumberingSequence =
  | 'ARABIC_SERIES'
  | 'ROMAN_UPPER_SERIES'
  | 'ROMAN_LOWER_SERIES'
  | 'ALPHABET_UPPER_SERIES'
  | 'ALPHABET_LOWER_SERIES';

export const ALTERNATE_LEFT_RIGHT = 'ALTERNATE_LEFT_RIGHT';
export const ALTERNATE_RIGHT_LEFT = 'ALTERNATE_RIGHT_LEFT';

export function resolveBulkPageSide(side: string, index: number): string {
  if (side === ALTERNATE_LEFT_RIGHT) {
    return index % 2 === 0 ? 'left' : 'right';
  }
  if (side === ALTERNATE_RIGHT_LEFT) {
    return index % 2 === 0 ? 'right' : 'left';
  }
  return side;
}

export function shouldApplyBulkPage(index: number, applyEvery: number, includeFirst: boolean): boolean {
  if (applyEvery <= 1) {
    return true;
  }
  const offset = includeFirst ? 0 : applyEvery - 1;
  return index % applyEvery === offset;
}

@Component({
  selector: 'app-bulk-page-edit',
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './bulk-page-edit.html',
  styleUrl: './bulk-page-edit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkPageEdit {
  private readonly api = inject(MetacheckApiService);
  private readonly translator = inject(TranslateService);

  readonly batchId = input.required<number>();
  readonly pages = input.required<readonly ObjectInfo[]>();
  readonly pageTypeOptions = input.required<readonly string[]>();
  readonly sideOptions = input.required<readonly string[]>();
  readonly saved = output<void>();

  protected readonly numberingOptions: readonly { value: NumberingSequence; label: string }[] = [
    { value: 'ARABIC_SERIES', label: '1, 2, 3, 4' },
    { value: 'ROMAN_UPPER_SERIES', label: 'I, II, III, IV' },
    { value: 'ROMAN_LOWER_SERIES', label: 'i, ii, iii, iv' },
    { value: 'ALPHABET_UPPER_SERIES', label: 'A - Z, AA - AZ' },
    { value: 'ALPHABET_LOWER_SERIES', label: 'a - z, aa - az' },
  ];
  protected readonly applyEveryOptions = Array.from({ length: 10 }, (_, index) => index + 1);
  protected readonly form = new FormGroup({
    pageType: new FormControl('', { nonNullable: true }),
    pageIndex: new FormControl<number | null>(null, [Validators.min(0)]),
    pageNumberPrefix: new FormControl('', { nonNullable: true }),
    pageNumberFrom: new FormControl('', { nonNullable: true }),
    pageNumberSuffix: new FormControl('', { nonNullable: true }),
    pageNumberIncrement: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    pageNumberSequence: new FormControl<NumberingSequence>('ARABIC_SERIES', {
      nonNullable: true,
    }),
    useBrackets: new FormControl(false, { nonNullable: true }),
    side: new FormControl('', { nonNullable: true }),
    genre: new FormControl('', { nonNullable: true }),
    applyEvery: new FormControl(1, { nonNullable: true }),
    includeFirst: new FormControl(true, { nonNullable: true }),
  });
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected canSave(): boolean {
    const pageIndex = this.form.controls.pageIndex.value;
    const numberFrom = this.form.controls.pageNumberFrom.value.trim();
    const increment = this.form.controls.pageNumberIncrement.value;
    const indexValid = pageIndex === null || (Number.isInteger(pageIndex) && pageIndex >= 0);
    const numberingValid =
      !numberFrom ||
      (this.numberStartValid() && Number.isInteger(increment) && increment >= 1);

    return indexValid && numberingValid && this.hasChanges() && !this.saving();
  }

  protected numberStartValid(): boolean {
    const value = this.form.controls.pageNumberFrom.value.trim();
    if (!value) {
      return true;
    }

    switch (this.form.controls.pageNumberSequence.value) {
      case 'ARABIC_SERIES':
        return /^\d+$/.test(value);
      case 'ROMAN_UPPER_SERIES':
      case 'ROMAN_LOWER_SERIES':
        return /^[IVXLCDM]+$/i.test(value);
      case 'ALPHABET_UPPER_SERIES':
      case 'ALPHABET_LOWER_SERIES':
        return /^[A-Z]+$/i.test(value);
    }
  }

  protected numberingExample(): string {
    if (!this.form.controls.pageNumberFrom.value.trim() || !this.numberStartValid()) {
      return '';
    }
    return [0, 1, 2, 3].map((index) => this.pageNumber(index)).join(', ');
  }

  protected save(): void {
    if (!this.canSave()) {
      return;
    }

    const values = this.form.getRawValue();
    const pages = this.pages().filter((_, index) =>
      shouldApplyBulkPage(index, values.applyEvery, values.includeFirst),
    );
    const updates = pages.map((page, index) => {
      const elementsInfoResponse: ElementInfo[] = [];
      const add = (field: ElementInfoType, editedValue: string) => {
        elementsInfoResponse.push({ field, edited: true, editedValue });
      };

      if (values.pageType) {
        add('pageType', values.pageType);
      }
      if (values.pageIndex !== null) {
        add('pageIndex', String(values.pageIndex + index));
      }
      if (values.pageNumberFrom.trim()) {
        add('pageNumber', this.pageNumber(index));
      }
      if (values.side) {
        add('side', resolveBulkPageSide(values.side, index));
      }
      if (values.genre) {
        add('genre', values.genre);
      }

      return {
        pid: page.uuid,
        metadata: {
          uuid: page.uuid,
          model: page.model,
          elementsInfoResponse,
        },
      };
    });

    this.saving.set(true);
    this.error.set(null);
    this.api
      .updateObjectMetadataBulk({ batchId: this.batchId(), updates })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.saved.emit(),
        error: (error: unknown) => this.error.set(this.describeError(error)),
      });
  }

  protected reset(): void {
    this.form.reset({
      pageType: '',
      pageIndex: null,
      pageNumberPrefix: '',
      pageNumberFrom: '',
      pageNumberSuffix: '',
      pageNumberIncrement: 1,
      pageNumberSequence: 'ARABIC_SERIES',
      useBrackets: false,
      side: '',
      genre: '',
      applyEvery: 1,
      includeFirst: true,
    });
    this.error.set(null);
  }

  private hasChanges(): boolean {
    const values = this.form.getRawValue();
    return Boolean(
      values.pageType ||
        values.pageIndex !== null ||
        values.pageNumberFrom.trim() ||
        values.side ||
        values.genre,
    );
  }

  private pageNumber(index: number): string {
    const values = this.form.getRawValue();
    const start = this.numberToIndex(values.pageNumberFrom, values.pageNumberSequence);
    const number = start + values.pageNumberIncrement * index;
    let result = `${values.pageNumberPrefix}${this.indexToNumber(number, values.pageNumberSequence)}${values.pageNumberSuffix}`;

    if (values.useBrackets) {
      result = `[${result}]`;
    }
    return result;
  }

  private numberToIndex(value: string, sequence: NumberingSequence): number {
    if (sequence === 'ARABIC_SERIES') {
      return Number.parseInt(value, 10);
    }
    if (sequence === 'ROMAN_UPPER_SERIES' || sequence === 'ROMAN_LOWER_SERIES') {
      return this.romanToNumber(value.toUpperCase());
    }
    return this.alphabetToNumber(value.toUpperCase());
  }

  private indexToNumber(value: number, sequence: NumberingSequence): string {
    switch (sequence) {
      case 'ARABIC_SERIES':
        return String(value);
      case 'ROMAN_UPPER_SERIES':
        return this.numberToRoman(value);
      case 'ROMAN_LOWER_SERIES':
        return this.numberToRoman(value).toLowerCase();
      case 'ALPHABET_UPPER_SERIES':
        return this.numberToAlphabet(value);
      case 'ALPHABET_LOWER_SERIES':
        return this.numberToAlphabet(value).toLowerCase();
    }
  }

  private romanToNumber(value: string): number {
    const values: Readonly<Record<string, number>> = {
      I: 1,
      V: 5,
      X: 10,
      L: 50,
      C: 100,
      D: 500,
      M: 1000,
    };
    let result = 0;
    for (let index = 0; index < value.length; index += 1) {
      const current = values[value[index]];
      const next = values[value[index + 1]] ?? 0;
      result += current < next ? -current : current;
    }
    return result;
  }

  private numberToRoman(value: number): string {
    const numerals: readonly [number, string][] = [
      [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
      [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
    ];
    let remaining = value;
    let result = '';
    for (const [amount, numeral] of numerals) {
      while (remaining >= amount) {
        result += numeral;
        remaining -= amount;
      }
    }
    return result;
  }

  private alphabetToNumber(value: string): number {
    return [...value].reduce((result, character) => result * 26 + character.charCodeAt(0) - 64, 0);
  }

  private numberToAlphabet(value: number): string {
    let remaining = value;
    let result = '';
    while (remaining > 0) {
      remaining -= 1;
      result = String.fromCharCode(65 + (remaining % 26)) + result;
      remaining = Math.floor(remaining / 26);
    }
    return result;
  }

  private describeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }
      return error.message;
    }
    return this.translator.instant('batchDetail.bulk.error');
  }
}
