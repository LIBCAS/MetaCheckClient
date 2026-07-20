import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet } from '@angular/router';

import { NavBar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { AppStateService } from './services/app-state.service';
import { MetacheckApiService } from './services/metacheck-api.service';

@Component({
  selector: 'app-root',
  imports: [MatButtonModule, NavBar, RouterOutlet, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly api = inject(MetacheckApiService);
  private readonly appState = inject(AppStateService);

  ngOnInit(): void {
    this.api.getClientConfig().subscribe({
      next: (config) => {
        this.appState.setClientConfig(config);
      },
      error: (error: unknown) => {
        console.error(error);
      },
    });
  }
}
