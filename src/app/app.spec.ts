import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { App } from './app';
import { routes } from './app.routes';
import { METACHECK_API_BASE_URL } from './services/metacheck-api.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
        { provide: METACHECK_API_BASE_URL, useValue: '/api/rest/v1' },
      ],
    }).compileComponents();

    const translator = TestBed.inject(TranslateService);
    translator.setTranslation('en', {
      footer: {
        apiVersion: 'API version',
        client: 'Metacheck client',
        clientVersion: 'Client version',
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
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/rest/v1/application/clientConfig').flush({
      standaloneApp: true,
    });
    http.expectOne('/api/rest/v1/application').flush({
      applicationName: 'Metacheck',
      version: '2.0.0',
      database: 'PostgreSQL',
      databaseSchemaVersion: '1',
      status: 'OK',
    });

    expect(app).toBeTruthy();
    http.verify();
  });

  it('should render the navigation and footer', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/rest/v1/application/clientConfig').flush({
      standaloneApp: true,
    });
    http.expectOne('/api/rest/v1/application').flush({
      applicationName: 'Metacheck',
      version: '2.0.0',
      database: 'PostgreSQL',
      databaseSchemaVersion: '1',
      status: 'OK',
    });

    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-logo img')?.getAttribute('alt')).toBe('Metacheck');
    expect(compiled.querySelector('nav')?.textContent).toContain('Batches');
    expect(compiled.querySelector('nav')?.textContent).toContain('Imports');
    expect(compiled.querySelector('nav')?.textContent).toContain('About');
    expect(compiled.querySelector('footer')?.textContent).toContain('Metacheck client');
    expect(compiled.querySelector('footer')?.textContent).toContain('Client version: 1.0.1');
    expect(compiled.querySelector('footer')?.textContent).toContain('API version: 2.0.0');
    http.verify();
  });
});
