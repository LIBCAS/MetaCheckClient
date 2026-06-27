import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { ApplicationInfo, MetacheckApiService } from '../../services/metacheck-api.service';

@Component({
  selector: 'app-about',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  public readonly api = inject(MetacheckApiService);
  info = signal<ApplicationInfo | null>(null);

  ngOnInit(): void {
    this.getData();
  }

   getData() {
    this.api
    .getApplicationInfo()
    .subscribe({
      next: (info) => {
        this.info.set(info);
      },
      error: (error: unknown) => {
        console.log(error)
      },
    });
  }
}
