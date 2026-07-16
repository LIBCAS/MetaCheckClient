import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    }).compileComponents();

    const translator = TestBed.inject(TranslateService);
    translator.setTranslation('en', {
      footer: {
        client: 'Metacheck client',
        developedBy: 'Developed by',
        version: 'Version',
      },
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
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the navigation and footer', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-logo img')?.getAttribute('alt')).toBe('Metacheck');
    expect(compiled.querySelector('nav')?.textContent).toContain('Batches');
    expect(compiled.querySelector('nav')?.textContent).toContain('Imports');
    expect(compiled.querySelector('nav')?.textContent).toContain('About');
    expect(compiled.querySelector('footer')?.textContent).toContain('Metacheck client');
  });
});
