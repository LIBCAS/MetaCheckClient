import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { METACHECK_API_BASE_URL, MetacheckApiService } from './metacheck-api.service';

describe('MetacheckApiService', () => {
  let service: MetacheckApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MetacheckApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: METACHECK_API_BASE_URL, useValue: '/api/rest/v1' },
      ],
    });

    service = TestBed.inject(MetacheckApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should request application info from the API base path', () => {
    service.getApplicationInfo().subscribe();

    const request = http.expectOne('/api/rest/v1/application');
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('should request client config from the API base path', () => {
    service.getClientConfig().subscribe();

    const request = http.expectOne('/api/rest/v1/application/clientConfig');
    expect(request.request.method).toBe('GET');
    request.flush({ standaloneApp: true });
  });

  it('should encode batch filters as query parameters', () => {
    service
      .listBatches({
        state: 'GENERATED',
        path: 'proarc_users/batch-1',
        startRow: 10,
        size: 25,
        sortBy: 'createDate',
        sort: 'desc',
      })
      .subscribe();

    const request = http.expectOne((req) => req.url === '/api/rest/v1/batch');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('state')).toBe('GENERATED');
    expect(request.request.params.get('folder')).toBe('proarc_users/batch-1');
    expect(request.request.params.get('_startRow')).toBe('10');
    expect(request.request.params.get('_size')).toBe('25');
    expect(request.request.params.get('_sortBy')).toBe('createDate');
    expect(request.request.params.get('_sort')).toBe('desc');
    request.flush({ status: 0, startRow: 10, endRow: 34, total: 0, data: [] });
  });

  it('should serialize new batch form parameters according to the API contract', () => {
    service
      .addNewBatch({
        path: 'proarc_users/batch-1',
        engine: 'Engine A',
        proarcBatchId: 42,
      })
      .subscribe();

    const request = http.expectOne('/api/rest/v1/batch');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
    expect(request.request.body.get('folder')).toBe('proarc_users/batch-1');
    expect(request.request.body.get('engine')).toBe('Engine A');
    expect(request.request.body.get('proarcBatchId')).toBe('42');
    request.flush({ batchId: 1, path: 'proarc_users/batch-1' });
  });

  it('should pass batch id as a path parameter when stopping and restarting a batch', () => {
    service.stopBatch(7).subscribe();
    service.restartBatch(7).subscribe();

    const stopRequest = http.expectOne('/api/rest/v1/batch/7/stop');
    expect(stopRequest.request.method).toBe('POST');
    expect(stopRequest.request.body).toBeNull();
    stopRequest.flush({ batchId: 7, state: 'STOPPED' });

    const restartRequest = http.expectOne('/api/rest/v1/batch/7/restart');
    expect(restartRequest.request.method).toBe('POST');
    expect(restartRequest.request.body).toBeNull();
    restartRequest.flush({ batchId: 7, state: 'PLANNED' });
  });

  it('should pass object image type as the typ query parameter', () => {
    service.getObjectImage(7, '6d848d9c-0879-4f84-86db-9f49ea07fb99', 'thumbnail').subscribe();

    const request = http.expectOne((req) => req.url === '/api/rest/v1/object/image');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('batchId')).toBe('7');
    expect(request.request.params.get('pid')).toBe('6d848d9c-0879-4f84-86db-9f49ea07fb99');
    expect(request.request.params.get('typ')).toBe('thumbnail');
    request.flush(new Blob());
  });

  it('should serialize metadata updates as form data', () => {
    service
      .updateObjectMetadata({
        batchId: 7,
        pid: '6d848d9c-0879-4f84-86db-9f49ea07fb99',
        metadata: {
          uuid: '6d848d9c-0879-4f84-86db-9f49ea07fb99',
          model: 'page',
          elementsInfoResponse: [{ field: 'title', editedValue: 'Updated title' }],
        },
      })
      .subscribe();

    const request = http.expectOne('/api/rest/v1/object/metadata');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
    expect(request.request.body.get('batchId')).toBe('7');
    expect(request.request.body.get('pid')).toBe('6d848d9c-0879-4f84-86db-9f49ea07fb99');
    expect(request.request.body.get('metadata')).toContain('"editedValue":"Updated title"');
    request.flush({ uuid: '6d848d9c-0879-4f84-86db-9f49ea07fb99', model: 'page', elementsInfoResponse: [] });
  });
});
