import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { METACHECK_API_BASE_URL } from '../../services/metacheck-api.service';
import { Batch } from './batch';

describe('Batch', () => {
  let fixture: ComponentFixture<Batch>;
  let http: HttpTestingController;
  const createObjectUrl = vi.fn(() => 'blob:object-image');
  const revokeObjectUrl = vi.fn();

  beforeEach(async () => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    });

    await TestBed.configureTestingModule({
      imports: [Batch],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        provideRouter([]),
        { provide: METACHECK_API_BASE_URL, useValue: '/api/rest/v1' },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ batchId: '42' }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Batch);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    createObjectUrl.mockClear();
    revokeObjectUrl.mockClear();
  });

  it('should load objects and selected object details for the route batch ID', async () => {
    fixture.detectChanges();

    const request = http.expectOne('/api/rest/v1/object?batchId=42');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        uuid: '6d848d9c-0879-4f84-86db-9f49ea07fb99',
        model: 'page',
        percentage: 0.955,
      },
    ]);

    const imageRequest = http.expectOne(
      '/api/rest/v1/object/image?batchId=42&pid=6d848d9c-0879-4f84-86db-9f49ea07fb99',
    );
    expect(imageRequest.request.method).toBe('GET');
    imageRequest.flush(new Blob(['image'], { type: 'image/png' }));

    const metadataRequest = http.expectOne(
      '/api/rest/v1/object/metadata?batchId=42&pid=6d848d9c-0879-4f84-86db-9f49ea07fb99',
    );
    expect(metadataRequest.request.method).toBe('GET');
    metadataRequest.flush({
      uuid: '6d848d9c-0879-4f84-86db-9f49ea07fb99',
      model: 'page',
      elementsInfoResponse: [
        {
          field: 'title',
          originalValue: 'Original title',
          editedValue: 'Edited title',
          percentage: null,
        },
        {
          field: 'author',
          originalValue: 'Original author',
          editedValue: null,
          percentage: null,
        },
        {
          field: 'pageType',
          originalValue: 'NormalPage',
          editedValue: 'CustomPageType',
          percentage: '0.8',
        },
        {
          field: 'side',
          originalValue: 'left',
          editedValue: null,
          percentage: '0.8',
        },
      ],
    });

    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('as-split')).toBeTruthy();
    expect(compiled.querySelectorAll('as-split-area')).toHaveLength(3);
    expect(compiled.textContent).toContain('Batch 42');
    expect(compiled.textContent).toContain('6d848d9c-0879-4f84-86db-9f49ea07fb99');
    expect(compiled.textContent).toContain('page');
    expect(compiled.textContent).toContain('95,5 %');
    expect(compiled.textContent).toContain('80 %');
    expect(compiled.querySelector('.object-row')?.classList).toContain('confidence-high');
    const metadataRows = compiled.querySelectorAll('.metadata-row');
    expect(metadataRows[0]?.classList).toContain('confidence-perfect');
    expect(metadataRows[1]?.classList).toContain('confidence-zero');
    expect(compiled.querySelector('img')?.getAttribute('src')).toBe('blob:object-image');
    expect(compiled.textContent).toContain('Original title');
    expect(compiled.querySelector<HTMLInputElement>('.metadata-edit-control')?.value).toBe(
      'Edited title',
    );
    const metadataSelects = compiled.querySelectorAll<HTMLSelectElement>('select.metadata-edit-control');
    expect(metadataSelects[0].value).toBe('CustomPageType');
    expect([...metadataSelects[0].options].map((option) => option.value)).toContain('CustomPageType');
    expect([...metadataSelects[1].options].map((option) => option.value)).toContain('right');
    expect(createObjectUrl).toHaveBeenCalledOnce();

    const saveButton = compiled.querySelector<HTMLButtonElement>('.save-metadata-button');
    expect(saveButton?.disabled).toBe(true);

    const editedInput = compiled.querySelector<HTMLInputElement>('input.metadata-edit-control');
    editedInput!.value = 'Changed title';
    editedInput!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(saveButton?.disabled).toBe(false);
    saveButton!.click();

    const updateRequest = http.expectOne('/api/rest/v1/object/metadata');
    expect(updateRequest.request.method).toBe('POST');
    expect(updateRequest.request.body.get('batchId')).toBe('42');
    expect(updateRequest.request.body.get('pid')).toBe('6d848d9c-0879-4f84-86db-9f49ea07fb99');
    expect(JSON.parse(updateRequest.request.body.get('metadata'))).toEqual({
      uuid: '6d848d9c-0879-4f84-86db-9f49ea07fb99',
      model: 'page',
      elementsInfoResponse: [
        {
          field: 'title',
          originalValue: 'Original title',
          editedValue: 'Changed title',
          percentage: null,
        },
        {
          field: 'author',
          originalValue: 'Original author',
          editedValue: null,
          percentage: null,
        },
        {
          field: 'pageType',
          originalValue: 'NormalPage',
          editedValue: 'CustomPageType',
          percentage: '0.8',
        },
        {
          field: 'side',
          originalValue: 'left',
          editedValue: null,
          percentage: '0.8',
        },
      ],
    });
    updateRequest.flush({
      uuid: '6d848d9c-0879-4f84-86db-9f49ea07fb99',
      model: 'page',
      elementsInfoResponse: [
        {
          field: 'title',
          originalValue: 'Original title',
          editedValue: 'Changed title',
          percentage: null,
        },
      ],
    });

    const refreshRequest = http.expectOne('/api/rest/v1/object?batchId=42');
    expect(refreshRequest.request.method).toBe('GET');
    refreshRequest.flush([
      {
        uuid: '6d848d9c-0879-4f84-86db-9f49ea07fb99',
        model: 'page',
        percentage: 1,
      },
    ]);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelector('.object-row')?.classList).toContain('selected-row');
  });
});
