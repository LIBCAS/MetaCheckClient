import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { APP_VERSION } from '../../app-version';
import { MetacheckApiService } from '../../services/metacheck-api.service';

@Component({
  selector: 'app-footer',
  imports: [TranslatePipe],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  private readonly api = inject(MetacheckApiService);

  protected readonly currentYear = new Date().getFullYear();
  protected readonly clientVersion = APP_VERSION;
  protected readonly apiVersion = signal<string | null>(null);

  ngOnInit(): void {
    this.api.getApplicationInfo().subscribe({
      next: (info) => {
        this.apiVersion.set(info.version);
      },
      error: (error: unknown) => {
        console.error(error);
      },
    });
  }
}
