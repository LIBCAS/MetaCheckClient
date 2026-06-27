import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { About } from '../../dialogs/about/about';

interface NavItem {
  label: string;
  path: string;
  exact: boolean;
}

@Component({
  selector: 'app-navbar',
  imports: [MatButtonModule, MatToolbarModule, RouterLink, RouterLinkActive, MatDialogModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavBar {
  readonly dialog = inject(MatDialog);
  protected readonly navItems: readonly NavItem[] = [
    { label: 'Dávky', path: '/batches', exact: false },
    { label: 'Importy', path: '/import', exact: true },
    { label: 'O aplikaci', path: '/about', exact: false },
  ];

  openAboutDialog() {
    this.dialog.open(About, {
      width: '250px'
    });  
  }
}
