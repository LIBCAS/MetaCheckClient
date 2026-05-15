import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  path: string;
  exact: boolean;
}

@Component({
  selector: 'app-nav-bar',
  imports: [MatButtonModule, MatToolbarModule, RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavBar {
  protected readonly navItems: readonly NavItem[] = [
    { label: 'Home', path: '/home', exact: true },
    { label: 'Batches', path: '/batches', exact: false },
    { label: 'About', path: '/about', exact: false },
  ];
}
