import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';

const CONFIDENCE_LEVELS = [
  { id: 'none', className: 'confidence-none' },
  { id: 'low', className: 'confidence-low' },
  { id: 'medium', className: 'confidence-medium' },
  { id: 'high', className: 'confidence-high' },
  { id: 'generated', className: 'confidence-generated' },
  { id: 'edited', className: 'confidence-edited' },
] as const;

@Component({
  selector: 'app-confidence-help-dialog',
  imports: [MatButtonModule, MatDialogModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'batchDetail.confidenceDialog.title' | translate }}</h2>
    <mat-dialog-content>
      <p class="confidence-intro">
        {{ 'batchDetail.confidenceDialog.intro' | translate }}
      </p>
      <ul class="confidence-levels">
        @for (level of levels; track level.id) {
          <li>
            <span
              [class]="'confidence-swatch ' + level.className"
              aria-hidden="true"
            ></span>
            <div>
              <div class="confidence-heading">
                <strong>
                  {{ 'batchDetail.confidenceDialog.levels.' + level.id + '.label' | translate }}
                </strong>
                <span class="confidence-range">
                  {{ 'batchDetail.confidenceDialog.levels.' + level.id + '.range' | translate }}
                </span>
              </div>
              <p>
                {{
                  'batchDetail.confidenceDialog.levels.' + level.id + '.description'
                    | translate
                }}
              </p>
            </div>
          </li>
        }
      </ul>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>{{ 'common.close' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content {
      width: min(36rem, 85vw);
      max-width: 85vw;
    }

    .confidence-intro {
      margin-block-start: 0;
    }

    .confidence-levels {
      display: grid;
      gap: 12px;
      margin: 20px 0 0;
      padding: 0;
      list-style: none;
    }

    .confidence-levels li {
      display: grid;
      grid-template-columns: 24px minmax(0, 1fr);
      gap: 12px;
      align-items: start;
    }

    .confidence-swatch {
      width: 24px;
      height: 24px;
      border: 1px solid var(--app-color-gray-4);
      border-radius: 2px;
    }

    .confidence-none {
      background: #fff;
    }

    .confidence-low {
      background: #f59a9f;
    }

    .confidence-medium {
      background: #f4d35e;
    }

    .confidence-high {
      background: #7edfa1;
    }

    .confidence-generated {
      background: #b0b8c1;
    }

    .confidence-edited {
      background: #6fa8dc;
    }

    .confidence-heading {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 12px;
      align-items: baseline;
    }

    .confidence-range {
      color: var(--app-color-gray-6);
    }

    .confidence-levels p {
      margin: 2px 0 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfidenceHelpDialog {
  protected readonly levels = CONFIDENCE_LEVELS;
}

@Component({
  selector: 'app-confidence-help',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe],
  template: `
    <button
      matIconButton
      type="button"
      [class.app-primary]="primary()"
      [attr.aria-label]="'batchDetail.actions.showConfidenceHelp' | translate"
      [matTooltip]="'batchDetail.actions.showConfidenceHelp' | translate"
      (click)="showHelp($event)"
    >
      <mat-icon aria-hidden="true">info</mat-icon>
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    button {
      width: 30px;
      height: 30px;
      padding: 3px;
    }

    .app-primary {
      color: var(--mat-sys-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfidenceHelp {
  private readonly dialog = inject(MatDialog);
  readonly primary = input(false);

  protected showHelp(event: Event): void {
    event.stopPropagation();
    this.dialog.open(ConfidenceHelpDialog, {
      maxHeight: '80vh',
      maxWidth: '95vw',
      width: '640px',
    });
  }
}
