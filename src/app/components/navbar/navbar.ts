import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { About } from '../../dialogs/about/about';
import { AppStateService } from '../../services/app-state.service';

interface NavItem {
  labelKey: string;
  path: string;
  exact: boolean;
  dialog?: boolean;
}

@Component({
  selector: 'app-navbar',
  imports: [
    MatButtonModule,
    MatToolbarModule,
    MatMenuModule,
    RouterLink,
    RouterLinkActive,
    MatDialogModule,
    TranslatePipe,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavBar implements OnInit {
  private static readonly languageStorageKey = 'metacheck.lang';

  readonly dialog = inject(MatDialog);
  readonly translator = inject(TranslateService);
  private readonly appState = inject(AppStateService);

  protected readonly languages = ['cs', 'en'];
  protected readonly currentLang = computed(() => this.translator.currentLang() ?? 'cs');
  protected readonly navItems = computed<readonly NavItem[]>(() => {
    const items: NavItem[] = [
      { labelKey: 'navbar.batches', path: '/batches', exact: false },
    ];

    if (this.appState.clientConfig()?.standaloneApp === true) {
      items.push({ labelKey: 'navbar.import', path: '/import', exact: true });
    }

    items.push({ labelKey: 'navbar.about', path: '/about', exact: false, dialog: true });

    return items;
  });

  ngOnInit(): void {
    const savedLanguage = localStorage.getItem(NavBar.languageStorageKey);

    if (savedLanguage && this.languages.includes(savedLanguage)) {
      this.translator.use(savedLanguage);
    }
  }

  protected onLanguageChanged(lang: string): void {
    localStorage.setItem(NavBar.languageStorageKey, lang);
    this.translator.use(lang);
  }

  protected openAboutDialog(): void {
    this.dialog.open(About, {
      width: '250px',
    });
  }
}
