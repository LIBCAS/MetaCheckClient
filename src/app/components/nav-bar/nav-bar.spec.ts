import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { routes } from '../../app.routes';
import { NavBar } from './nav-bar';

describe('NavBar', () => {
  let fixture: ComponentFixture<NavBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavBar],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(NavBar);
  });

  it('should render the brand and navigation links', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand')?.textContent).toContain('Metacheck');
    expect(compiled.querySelector('mat-toolbar')).toBeTruthy();
    expect(compiled.querySelector('nav')?.textContent).toContain('Home');
    expect(compiled.querySelector('nav')?.textContent).toContain('Batches');
    expect(compiled.querySelector('nav')?.textContent).toContain('About');
  });
});
