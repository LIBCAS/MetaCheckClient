import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AppStateService } from '../../services/app-state.service';
import { METACHECK_API_BASE_URL } from '../../services/metacheck-api.service';
import { Batches } from './batches';

describe('Batches', () => {
  let fixture: ComponentFixture<Batches>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Batches],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        provideRouter([]),
        { provide: METACHECK_API_BASE_URL, useValue: '/api/rest/v1' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Batches);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should load and render batches in the table', async () => {
    fixture.detectChanges();

    const request = http.expectOne(
      '/api/rest/v1/batch?_startRow=0&_size=25&_sortBy=createDate&_sort=desc',
    );
    request.flush({
      status: 0,
      startRow: 0,
      endRow: 0,
      total: 1,
      data: [
        {
          batchId: 42,
          state: 'GENERATED',
          path: 'proarc_users/batch-1',
          proarcBatchId: 7,
          createDate: '2026-05-15T07:00:00',
          updateDate: '2026-05-15T07:05:00',
          log: 'Ready',
        },
      ],
    });

    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('42');
    expect(compiled.textContent).toContain('GENERATED');
    expect(compiled.textContent).toContain('proarc_users/batch-1');
    expect(compiled.querySelector('.batch-row')?.getAttribute('aria-label')).toBe('Open batch 42');

    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    compiled.querySelector<HTMLElement>('.batch-row')?.click();
    expect(TestBed.inject(AppStateService).currentBatch()).toEqual({
      batchId: 42,
      state: 'GENERATED',
      path: 'proarc_users/batch-1',
      proarcBatchId: 7,
      createDate: '2026-05-15T07:00:00',
      updateDate: '2026-05-15T07:05:00',
      log: 'Ready',
    });
  });
});
