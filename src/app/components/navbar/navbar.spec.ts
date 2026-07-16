import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { routes } from '../../app.routes';
import { NavBar } from './navbar';

describe('NavBar', () => {
  let fixture: ComponentFixture<NavBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavBar],
      providers: [provideRouter(routes), provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    }).compileComponents();

    const translator = TestBed.inject(TranslateService);
    translator.setTranslation('en', {
      navbar: {
        about: 'About',
        batches: 'Batches',
        import: 'Imports',
        lang: {
          code: { en: 'EN' },
          desc: { cs: 'Czech', en: 'English' },
        },
      },
    });
    translator.use('en');
    fixture = TestBed.createComponent(NavBar);
  });

  it('should render the brand and navigation links', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-logo img')?.getAttribute('alt')).toBe('Metacheck');
    expect(compiled.querySelector('mat-toolbar')).toBeTruthy();
    expect(compiled.querySelector('nav')?.textContent).toContain('Batches');
    expect(compiled.querySelector('nav')?.textContent).toContain('Imports');
    expect(compiled.querySelector('nav')?.textContent).toContain('About');
    expect(compiled.querySelector('nav')?.textContent).toContain('EN');
  });
});
