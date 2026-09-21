import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';

export interface BatchLogDialogData {
  batchId: number | null;
  log: string;
  path: string;
}

@Component({
  selector: 'app-batch-log',
  imports: [MatButtonModule, MatDialogModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>
      {{
        'batches.logDialog.title'
          | translate: { id: data.batchId ?? '-', path: data.path || '-' }
      }}
    </h2>
    <mat-dialog-content>
      <pre>{{ data.log || ('common.empty' | translate) }}</pre>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>{{ 'common.close' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content {
      min-width: min(64rem, 85vw);
      max-width: 85vw;
    }

    pre {
      margin: 0;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      user-select: text;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchLog {
  protected readonly data = inject<BatchLogDialogData>(MAT_DIALOG_DATA);
}
