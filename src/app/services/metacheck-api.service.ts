import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable } from 'rxjs';

interface MetacheckGlobalConfig {
  apiUrl?: string | null;
}

declare global {
  interface Window {
    METACHECK_GLOBAL?: MetacheckGlobalConfig;
  }
}

const DEFAULT_API_URL = '/api';

function getConfiguredApiBaseUrl(): string {
  const apiUrl =
    typeof window === 'undefined' ? DEFAULT_API_URL : window.METACHECK_GLOBAL?.apiUrl;

  return `${(apiUrl || DEFAULT_API_URL).replace(/\/$/, '')}/rest/v1`;
}

export const METACHECK_API_BASE_URL = new InjectionToken<string>('METACHECK_API_BASE_URL', {
  providedIn: 'root',
  factory: getConfiguredApiBaseUrl,
});

export type BatchState =
  | 'EMPTY'
  | 'PLANNED'
  | 'GENERATING'
  | 'GENERATED'
  | 'EDITING'
  | 'EDITED'
  | 'STOPPED'
  | 'FAILED';

export type SortOrder = 'asc' | 'desc';
export type ObjectImageType = 'original' | 'preview' | 'thumbnail';

export type ElementInfoType =
  | 'abstrakt'
  | 'author'
  | 'dateIssued'
  | 'edition'
  | 'editor'
  | 'endDate'
  | 'genre'
  | 'illustrator'
  | 'keywords'
  | 'manufacturePlaceTerm'
  | 'manufacturePublisher'
  | 'pageIndex'
  | 'pageIndexEnd'
  | 'pageIndexStart'
  | 'pageNumber'
  | 'pageType'
  | 'partName'
  | 'partNumber'
  | 'placeTerm'
  | 'publisher'
  | 'redaktor'
  | 'seriesName'
  | 'seriesNumber'
  | 'side'
  | 'startDate'
  | 'subTitle'
  | 'title'
  | 'translator';

export interface Engine {
  name: string | null;
  description: string | null;
  version: string | null;
  defaultEngine: boolean | null;
  active: boolean | null;
}

export interface AddBatchForm {
  path: string;
  engine?: string | null;
  proarcBatchId?: number | null;
}

export interface ApplicationInfo {
  applicationName: string | null;
  version: string | null;
  database: string | null;
  databaseSchemaVersion: string | null;
  status: string | null;
}

export interface ClientConfig {
  standaloneApp?: boolean | null;
}

export interface Batch {
  batchId?: number | null;
  createDate?: string | null;
  updateDate?: string | null;
  state?: BatchState | null;
  proarcBatchId?: number | null;
  path?: string | null;
  log?: string | null;
}

export interface BatchListResponse {
  status: number;
  startRow: number;
  endRow: number;
  total: number;
  data: Batch[];
}

export interface ListBatchesParams {
  batchId?: number;
  state?: BatchState;
  path?: string;
  folder?: string;
  log?: string;
  proarcBatchId?: number;
  createDateFrom?: string;
  createDateTo?: string;
  updateDateFrom?: string;
  updateDateTo?: string;
  startRow?: number;
  size?: number;
  sortBy?: string;
  sort?: SortOrder;
}

export interface DeleteBatchesParams {
  batchId?: readonly number[];
  state?: readonly BatchState[];
  proarcBatchId?: number;
}

export interface ObjectInfo {
  uuid: string;
  model: string;
  percentage?: number | null;
  elementsInfoResponse?: ObjectElementInfo[];
}

export interface ObjectElementInfo {
  field?: ElementInfoType;
  value?: string | null;
}

export interface MetadataResponse {
  uuid: string;
  model: string;
  elementsInfoResponse: ElementInfo[];
}

export interface ElementInfo {
  field?: ElementInfoType;
  originalValue?: string | null;
  edited: boolean;
  editedValue?: string | null;
  percentage?: string | null;
}

export interface UpdateObjectMetadataForm {
  batchId: number;
  pid: string;
  metadata: MetadataResponse | string;
}

export interface BulkMetadataUpdate {
  pid: string;
  metadata: MetadataResponse;
}

export interface UpdateObjectMetadataBulkForm {
  batchId: number;
  updates: readonly BulkMetadataUpdate[];
}

type QueryPrimitive = string | number | boolean;
type QueryValue = QueryPrimitive | readonly QueryPrimitive[] | null | undefined;
type FormValue = string | number | null | undefined;

@Injectable({
  providedIn: 'root',
})
export class MetacheckApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(METACHECK_API_BASE_URL).replace(/\/$/, '');
  private readonly formHeaders = new HttpHeaders({
    'Content-Type': 'application/x-www-form-urlencoded',
  });

  getApplicationInfo(): Observable<ApplicationInfo> {
    return this.http.get<ApplicationInfo>(this.url('/application'));
  }

  getClientConfig(): Observable<ClientConfig> {
    return this.http.get<ClientConfig>(this.url('/application/clientConfig'));
  }

  listBatches(params: ListBatchesParams = {}): Observable<BatchListResponse> {
    return this.http.get<BatchListResponse>(this.url('/batch'), {
      params: this.queryParams({
        batchId: params.batchId,
        state: params.state,
        folder: params.folder ?? params.path,
        log: params.log,
        proarcBatchId: params.proarcBatchId,
        createDateFrom: params.createDateFrom,
        createDateTo: params.createDateTo,
        updateDateFrom: params.updateDateFrom,
        updateDateTo: params.updateDateTo,
        _startRow: params.startRow,
        _size: params.size,
        _sortBy: params.sortBy,
        _sort: params.sort,
      }),
    });
  }

  addNewBatch(form: AddBatchForm): Observable<Batch> {
    return this.http.post<Batch>(
      this.url('/batch'),
      this.formBody({
        folder: form.path,
        engine: form.engine,
        proarcBatchId: form.proarcBatchId,
      }),
      { headers: this.formHeaders },
    );
  }

  deleteBatches(params: DeleteBatchesParams): Observable<BatchListResponse> {
    return this.http.delete<BatchListResponse>(this.url('/batch'), {
      params: this.queryParams({
        batchId: params.batchId,
        state: params.state,
        proarcBatchId: params.proarcBatchId,
      }),
    });
  }

  listFolder(parentFolder = ''): Observable<string[]> {
    return this.http.get<string[]>(this.url('/batch/folder'), {
      params: this.queryParams({ parentFolder }),
    });
  }

  listObjects(batchId: number): Observable<ObjectInfo[]> {
    return this.http.get<ObjectInfo[]>(this.url('/object'), {
      params: this.queryParams({ batchId }),
    });
  }

  getObjectMetadata(batchId: number, pid: string): Observable<MetadataResponse> {
    return this.http.get<MetadataResponse>(this.url('/object/metadata'), {
      params: this.queryParams({ batchId, pid }),
    });
  }

  updateObjectMetadata(form: UpdateObjectMetadataForm): Observable<MetadataResponse> {
    const metadata = typeof form.metadata === 'string' ? form.metadata : JSON.stringify(form.metadata);

    return this.http.post<MetadataResponse>(
      this.url('/object/metadata'),
      this.formBody({
        batchId: form.batchId,
        pid: form.pid,
        metadata,
      }),
      { headers: this.formHeaders },
    );
  }

  stopBatch(batchId: number): Observable<Batch> {
    return this.http.post<Batch>(this.url(`/batch/${batchId}/stop`), null);
  }

  updateObjectMetadataBulk(form: UpdateObjectMetadataBulkForm): Observable<MetadataResponse[]> {
    return this.http.post<MetadataResponse[]>(
      this.url('/object/metadata/bulk'),
      this.formBody({
        batchId: form.batchId,
        updates: JSON.stringify(form.updates),
      }),
      { headers: this.formHeaders },
    );
  }

  restartBatch(batchId: number): Observable<Batch> {
    return this.http.post<Batch>(this.url(`/batch/${batchId}/restart`), null);
  }

  getObjectAlto(batchId: number, pid: string): Observable<string> {
    return this.http.get(this.url('/object/alto'), {
      params: this.queryParams({ batchId, pid }),
      responseType: 'text',
    });
  }

  getObjectImage(batchId: number, pid: string, typ?: ObjectImageType): Observable<Blob> {
    return this.http.get(this.url('/object/image'), {
      params: this.queryParams({ batchId, pid, typ }),
      responseType: 'blob',
    });
  }

  getObjectImageUrl(batchId: number, pid: string, typ?: ObjectImageType): string {
    const params = this.queryParams({ batchId, pid, typ }).toString();

    return `${this.url('/object/image')}${params ? `?${params}` : ''}`;
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  public getApiUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private queryParams(params: Record<string, QueryValue>): HttpParams {
    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          httpParams = httpParams.append(key, String(item));
        }

        continue;
      }

      httpParams = httpParams.set(key, String(value));
    }

    return httpParams;
  }

  private formBody(fields: Record<string, FormValue>): HttpParams {
    let body = new HttpParams();

    for (const [key, value] of Object.entries(fields)) {
      if (value === null || value === undefined) {
        continue;
      }

      body = body.set(key, String(value));
    }

    return body;
  }

  getEngines(): Observable<Engine[]> {
    return this.http.get<Engine[]>(this.url('/batch/engines'));
  }
}
