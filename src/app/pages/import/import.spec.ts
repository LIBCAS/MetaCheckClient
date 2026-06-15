import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { METACHECK_API_BASE_URL } from '../../services/metacheck-api.service';
import { Import } from './import';

describe('Import', () => {
  let component: Import;
  let fixture: ComponentFixture<Import>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Import],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: METACHECK_API_BASE_URL, useValue: '/api/rest/v1' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Import);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne((request) => request.url === '/api/rest/v1/batch/folder').flush(['incoming']);
    await fixture.whenStable();
  });

  afterEach(() => {
    http.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
