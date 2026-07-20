import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { APP_VERSION } from '../../app-version';
import { ApplicationInfo, MetacheckApiService } from '../../services/metacheck-api.service';

@Component({
  selector: 'app-about',
  imports: [MatButtonModule, MatDialogModule, TranslatePipe],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  private readonly api = inject(MetacheckApiService);
  protected readonly clientVersion = APP_VERSION;
  protected readonly info = signal<ApplicationInfo | null>(null);

  ngOnInit(): void {
    this.getData();
  }

  private getData(): void {
    this.api
      .getApplicationInfo()
      .subscribe({
        next: (info) => {
          this.info.set(info);
        },
        error: (error: unknown) => {
          console.error(error);
        },
      });
  }
}
