import { TestBed } from '@angular/core/testing';
import { SyncDataService } from './sync-data.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { LocalStorageService } from '@services/local-storage.service';
import { LocalStorage } from '@type/Enum';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { resetRateLimit } from '@operator/rateLimit';
import { delayedResponse, retryAfter429 } from '@shared/mocks/mockRateLimit';

describe('SyncDataService', () => {
  let service: SyncDataService;
  let localStorageServiceMock: {
    getObject: ReturnType<typeof vi.fn>;
    setObject: ReturnType<typeof vi.fn>;
  };
  let httpMock: {
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    localStorageServiceMock = {
      getObject: vi.fn(),
      setObject: vi.fn(),
    };

    httpMock = {
      get: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: LocalStorageService, useValue: localStorageServiceMock },
        { provide: HttpClient, useValue: httpMock },
      ],
    });

    service = TestBed.inject(SyncDataService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('syncArray', () => {
    it('should initialize signal from local storage', () => {
      localStorageServiceMock.getObject.mockReturnValue([1, 2]);

      const syncData = service.syncArray<number>({ localStorageKey: LocalStorage.FAVORITES });

      expect(syncData.s()).toEqual([1, 2]);
      expect(localStorageServiceMock.getObject).toHaveBeenCalledWith(LocalStorage.FAVORITES);
    });

    it('should sync current value when no url is provided', async () => {
      const syncData = service.syncArray<number>({ localStorageKey: LocalStorage.FAVORITES });
      const current = [3, 4];
      syncData.s.set(current);

      await firstValueFrom(syncData.sync());

      expect(syncData.s()).toEqual([3, 4]);
      expect(syncData.s()).not.toBe(current);
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(
        LocalStorage.FAVORITES,
        syncData.s(),
      );
    });
  });

  describe('syncObject', () => {
    it('should initialize signal from local storage', () => {
      localStorageServiceMock.getObject.mockReturnValue({ a: 1 });

      const syncData = service.syncObject<{ a: number }>({ localStorageKey: LocalStorage.CONFIG });

      expect(syncData.s()).toEqual({ a: 1 });
      expect(localStorageServiceMock.getObject).toHaveBeenCalledWith(LocalStorage.CONFIG);
    });

    it('should sync current value when no url is provided', async () => {
      const syncData = service.syncObject<{ a: number }>({ localStorageKey: LocalStorage.CONFIG });
      const current = { a: 5 };
      syncData.s.set(current);

      await firstValueFrom(syncData.sync());

      expect(syncData.s()).toEqual({ a: 5 });
      expect(syncData.s()).not.toBe(current);
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(
        LocalStorage.CONFIG,
        syncData.s(),
      );
    });
  });

  describe('syncObjectWithDefault', () => {
    it('should use default value when local storage is empty', () => {
      localStorageServiceMock.getObject.mockReturnValue(undefined);

      const syncData = service.syncObjectWithDefault<{ enabled: boolean }>({
        localStorageKey: LocalStorage.CONFIG,
        default: { enabled: true },
      });

      expect(syncData.s()).toEqual({ enabled: true });
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(LocalStorage.CONFIG, {
        enabled: true,
      });
    });

    it('should merge missing values with defaults', () => {
      localStorageServiceMock.getObject.mockReturnValue({ nested: { value: 2 } });

      const syncData = service.syncObjectWithDefault<{
        nested: { value: number; extra: number };
        enabled: boolean;
      }>({
        localStorageKey: LocalStorage.CONFIG,
        default: {
          nested: { value: 1, extra: 3 },
          enabled: true,
        },
      });

      expect(syncData.s()).toEqual({
        nested: { value: 2, extra: 3 },
        enabled: true,
      });
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(LocalStorage.CONFIG, {
        nested: { value: 2, extra: 3 },
        enabled: true,
      });
    });
  });

  describe('syncObjects', () => {
    it('should initialize signal from local storage', () => {
      const id1 = 'id-1';
      localStorageServiceMock.getObject.mockReturnValue({ [id1]: { name: 'stored' } });

      const syncData = service.syncObjects<{ name: string }>({
        localStorageKey: LocalStorage.SHOWS_PROGRESS,
      });

      expect(syncData.s()).toEqual({ [id1]: { name: 'stored' } });
    });

    it('should skip sync when value already exists', async () => {
      const id1 = 'id-1';
      localStorageServiceMock.getObject.mockReturnValue({ [id1]: { name: 'stored' } });
      httpMock.get.mockReturnValue(of({ name: 'fresh' }));

      const syncData = service.syncObjects<{ name: string }>({
        localStorageKey: LocalStorage.SHOWS_PROGRESS,
        url: '/api/%',
      });

      await firstValueFrom(syncData.sync(id1));

      expect(httpMock.get).not.toHaveBeenCalled();
      expect(syncData.s()).toEqual({ [id1]: { name: 'stored' } });
    });

    it('should fetch existing values when force is true', async () => {
      const id1 = 'id-1';
      localStorageServiceMock.getObject.mockReturnValue({ [id1]: { name: 'stored' } });
      httpMock.get.mockReturnValue(of({ name: 'fresh' }));

      const syncData = service.syncObjects<{ name: string }>({
        localStorageKey: LocalStorage.SHOWS_PROGRESS,
        url: '/api/%',
      });

      await firstValueFrom(syncData.sync(id1, { force: true }));

      expect(httpMock.get).toHaveBeenCalledWith('/api/id-1');
      expect(syncData.s()).toEqual({ [id1]: { name: 'fresh' } });
    });

    it('should delete old entries with matching prefix when deleteOld is true', async () => {
      const show1 = 'show-1';
      const show2 = 'show-2';
      const movie1 = 'movie-1';
      const show3 = 'show-3';
      localStorageServiceMock.getObject.mockReturnValue({
        [show1]: { name: 'old 1' },
        [show2]: { name: 'old 2' },
        [movie1]: { name: 'other' },
      });
      httpMock.get.mockReturnValue(of({ name: 'new' }));

      const syncData = service.syncObjects<{ name: string }>({
        localStorageKey: LocalStorage.SHOWS_PROGRESS,
        url: '/api/%',
      });

      await firstValueFrom(syncData.sync(show3, { deleteOld: true, force: true }));

      expect(syncData.s()).toEqual({
        [movie1]: { name: 'other' },
        [show3]: { name: 'new' },
      });
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(
        LocalStorage.SHOWS_PROGRESS,
        syncData.s(),
      );
    });

    it('should fetch mapped data and sync with idFormatter', async () => {
      const user7 = 'user-7';
      httpMock.get.mockReturnValue(of([{ name: 'john' }]));

      const syncData = service.syncObjects<{ name: string }>({
        localStorageKey: LocalStorage.SHOWS_PROGRESS,
        url: '/api/%',
        idFormatter: (id: unknown) => `user-${id as number}`,
        mapFunction: (value) => ({ ...value, name: value.name.toUpperCase() }),
      });

      const result = await firstValueFrom(syncData.fetch(7, true));

      expect(httpMock.get).toHaveBeenCalledWith('/api/7');
      expect(result).toEqual({ name: 'JOHN' });
      expect(syncData.s()).toEqual({ [user7]: { name: 'JOHN' } });
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(
        LocalStorage.SHOWS_PROGRESS,
        syncData.s(),
      );
    });
  });

  describe('syncArrays', () => {
    it('should initialize signal from local storage', () => {
      localStorageServiceMock.getObject.mockReturnValue({ key: [1, 2] });

      const syncData = service.syncArrays<number>({ localStorageKey: LocalStorage.LIST_ITEMS });

      expect(syncData.s()).toEqual({ key: [1, 2] });
    });

    it('should fetch data and sync using idFormatter', async () => {
      const list5 = 'list-5';
      httpMock.get.mockReturnValue(of([1, 2, 3]));

      const syncData = service.syncArrays<number>({
        localStorageKey: LocalStorage.LIST_ITEMS,
        url: '/api/%',
        idFormatter: (id: unknown) => `list-${id as number}`,
      });

      const result = await firstValueFrom(syncData.fetch(5, true));

      expect(httpMock.get).toHaveBeenCalledWith('/api/5');
      expect(result).toEqual([1, 2, 3]);
      expect(syncData.s()).toEqual({ [list5]: [1, 2, 3] });
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(LocalStorage.LIST_ITEMS, {
        [list5]: [1, 2, 3],
      });
    });
  });

  describe('syncMap', () => {
    interface OverviewEntry {
      show: { ids: { trakt: number } };
      progress: { aired: number; completed: number };
    }

    function makeEntry(traktId: number, aired: number): OverviewEntry {
      return {
        show: { ids: { trakt: traktId } },
        progress: { aired, completed: aired - 1 },
      };
    }

    it('should initialize signal from local storage', () => {
      localStorageServiceMock.getObject.mockReturnValue({ 1: { aired: 5, completed: 4 } });

      const syncData = service.syncMap<{ aired: number; completed: number }, OverviewEntry>({
        localStorageKey: LocalStorage.SHOWS_PROGRESS_OVERVIEW,
        url: '/api?page=%&limit=%',
        idFormatter: (item) => String(item.show.ids.trakt),
        mapFunction: (item) => item.progress,
        pageSize: 250,
      });

      expect(syncData.s()).toEqual({ 1: { aired: 5, completed: 4 } });
      expect(localStorageServiceMock.getObject).toHaveBeenCalledWith(
        LocalStorage.SHOWS_PROGRESS_OVERVIEW,
      );
    });

    it('should fetch pages until empty, derive ids and fully replace the store', async () => {
      httpMock.get.mockImplementation((url: string) => {
        if (url.includes('page=1&limit=250')) {
          return of([makeEntry(1, 10), makeEntry(2, 20)]);
        }
        return of([]);
      });

      const syncData = service.syncMap<{ aired: number; completed: number }, OverviewEntry>({
        localStorageKey: LocalStorage.SHOWS_PROGRESS_OVERVIEW,
        url: '/api?page=%&limit=%',
        idFormatter: (item) => String(item.show.ids.trakt),
        mapFunction: (item) => item.progress,
        pageSize: 250,
      });

      await firstValueFrom(syncData.sync());

      expect(httpMock.get).toHaveBeenCalledWith('/api?page=1&limit=250');
      expect(httpMock.get).toHaveBeenCalledWith('/api?page=2&limit=250');
      expect(syncData.s()).toEqual({
        1: { aired: 10, completed: 9 },
        2: { aired: 20, completed: 19 },
      });
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(
        LocalStorage.SHOWS_PROGRESS_OVERVIEW,
        syncData.s(),
      );
    });

    it('should walk multiple pages and concatenate them in order', async () => {
      httpMock.get.mockImplementation((url: string) => {
        if (url.includes('page=1')) return of([makeEntry(1, 10)]);
        if (url.includes('page=2')) return of([makeEntry(2, 20)]);
        return of([]);
      });

      const syncData = service.syncMap<{ aired: number; completed: number }, OverviewEntry>({
        localStorageKey: LocalStorage.SHOWS_PROGRESS_OVERVIEW,
        url: '/api?page=%&limit=%',
        idFormatter: (item) => String(item.show.ids.trakt),
        mapFunction: (item) => item.progress,
        pageSize: 250,
      });

      await firstValueFrom(syncData.sync());

      expect(httpMock.get).toHaveBeenCalledTimes(3);
      expect(syncData.s()).toEqual({
        1: { aired: 10, completed: 9 },
        2: { aired: 20, completed: 19 },
      });
    });

    it('should replace existing entries with the fresh full page set', async () => {
      localStorageServiceMock.getObject.mockReturnValue({ 9: { aired: 99, completed: 98 } });
      httpMock.get.mockImplementation((url: string) =>
        url.includes('page=1') ? of([makeEntry(1, 10)]) : of([]),
      );

      const syncData = service.syncMap<{ aired: number; completed: number }, OverviewEntry>({
        localStorageKey: LocalStorage.SHOWS_PROGRESS_OVERVIEW,
        url: '/api?page=%&limit=%',
        idFormatter: (item) => String(item.show.ids.trakt),
        mapFunction: (item) => item.progress,
        pageSize: 250,
      });

      await firstValueFrom(syncData.sync());

      expect(syncData.s()).toEqual({ 1: { aired: 10, completed: 9 } });
      expect(syncData.s()[9]).toBeUndefined();
    });
  });

  describe('syncArrayPaged', () => {
    it('should initialize signal from local storage', () => {
      localStorageServiceMock.getObject.mockReturnValue([1, 2]);

      const syncData = service.syncArrayPaged<number>({
        localStorageKey: LocalStorage.SHOWS_WATCHED,
        url: '/api?page=%&limit=%',
        pageSize: 250,
      });

      expect(syncData.s()).toEqual([1, 2]);
      expect(localStorageServiceMock.getObject).toHaveBeenCalledWith(LocalStorage.SHOWS_WATCHED);
    });

    it('should fetch pages until empty, concatenate them in order and persist', async () => {
      httpMock.get.mockImplementation((url: string) => {
        if (url.includes('page=1&limit=250')) {
          return of([1, 2]);
        }
        if (url.includes('page=2&limit=250')) {
          return of([3, 4]);
        }
        return of([]);
      });

      const syncData = service.syncArrayPaged<number>({
        localStorageKey: LocalStorage.SHOWS_WATCHED,
        url: '/api?page=%&limit=%',
        pageSize: 250,
      });

      await firstValueFrom(syncData.sync());

      expect(httpMock.get).toHaveBeenCalledWith('/api?page=1&limit=250');
      expect(httpMock.get).toHaveBeenCalledWith('/api?page=2&limit=250');
      expect(httpMock.get).toHaveBeenCalledWith('/api?page=3&limit=250');
      expect(syncData.s()).toEqual([1, 2, 3, 4]);
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(
        LocalStorage.SHOWS_WATCHED,
        syncData.s(),
      );
    });

    it('should stop cleanly on an empty page without extra requests', async () => {
      httpMock.get.mockImplementation((url: string) =>
        url.includes('page=1&limit=250') ? of([1]) : of([]),
      );

      const syncData = service.syncArrayPaged<number>({
        localStorageKey: LocalStorage.SHOWS_WATCHED,
        url: '/api?page=%&limit=%',
        pageSize: 250,
      });

      await firstValueFrom(syncData.sync());

      expect(httpMock.get).toHaveBeenCalledTimes(2);
      expect(syncData.s()).toEqual([1]);
    });

    it('should fully replace existing stored entries', async () => {
      localStorageServiceMock.getObject.mockReturnValue([9]);
      httpMock.get.mockImplementation((url: string) =>
        url.includes('page=1&limit=250') ? of([1, 2]) : of([]),
      );

      const syncData = service.syncArrayPaged<number>({
        localStorageKey: LocalStorage.SHOWS_WATCHED,
        url: '/api?page=%&limit=%',
        pageSize: 250,
      });

      expect(syncData.s()).toEqual([9]);

      await firstValueFrom(syncData.sync());

      expect(syncData.s()).toEqual([1, 2]);
    });

    it('should throw when no url is provided', () => {
      const syncData = service.syncArrayPaged<number>({
        localStorageKey: LocalStorage.SHOWS_WATCHED,
        pageSize: 250,
      });

      expect(() => syncData.sync()).toThrow('Url is empty (fetch)');
    });
  });

  describe('rate limiting at the fetch layer', () => {
    beforeEach(() => {
      resetRateLimit();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('never exceeds 8 sync requests in flight', async () => {
      vi.useFakeTimers();
      const tracking = { inFlight: 0, maxInFlight: 0 };
      httpMock.get.mockImplementation(() => delayedResponse([], 100, tracking));

      const syncData = service.syncArray<number>({
        url: '/api/%',
        localStorageKey: LocalStorage.FAVORITES,
      });
      const resultsPromise = Promise.all(
        Array.from({ length: 12 }, () => firstValueFrom(syncData.sync())),
      );

      await vi.advanceTimersByTimeAsync(1000);
      await resultsPromise;

      expect(tracking.maxInFlight).toBeLessThanOrEqual(8);
      expect(tracking.maxInFlight).toBe(8);
      expect(httpMock.get).toHaveBeenCalledTimes(12);
      expect(syncData.s()).toEqual([]);
    });

    it('retries a scripted 429 honoring Retry-After and succeeds after backoff', async () => {
      vi.useFakeTimers();
      let attempts = 0;
      // The mock counts subscriptions, matching real HttpClient semantics where each
      // retry resubscribes and re-sends the request.
      httpMock.get.mockImplementation(
        () =>
          new Observable<{ name: string }>((subscriber) => {
            attempts += 1;
            if (attempts < 3) {
              subscriber.error(retryAfter429('1'));
              return;
            }
            subscriber.next({ name: 'fresh' });
            subscriber.complete();
          }),
      );

      const syncData = service.syncObjects<{ name: string }>({
        url: '/api/%',
        localStorageKey: LocalStorage.SHOWS_PROGRESS,
      });
      const promise = firstValueFrom(syncData.sync(1, { force: true }));

      await vi.advanceTimersByTimeAsync(0);
      expect(attempts).toBe(1);

      // Jitter keeps the first retry within [500, 1500)ms and the second within [1000, 3000)ms.
      await vi.advanceTimersByTimeAsync(1500);
      expect(attempts).toBe(2);
      await vi.advanceTimersByTimeAsync(3500);
      await promise;

      expect(attempts).toBe(3);
      expect(syncData.s()).toEqual({ '1': { name: 'fresh' } });
    });

    it('drops a sync request after 3 consecutive 429 responses', async () => {
      vi.useFakeTimers();
      let attempts = 0;
      httpMock.get.mockImplementation(
        () =>
          new Observable<unknown>((subscriber) => {
            attempts += 1;
            subscriber.error(retryAfter429('1'));
          }),
      );

      const syncData = service.syncObjects<{ name: string }>({
        url: '/api/%',
        localStorageKey: LocalStorage.SHOWS_PROGRESS,
      });
      const promise = firstValueFrom(syncData.sync(1, { force: true }));
      const rejection = expect(promise).rejects.toMatchObject({ status: 429 });

      await vi.advanceTimersByTimeAsync(5000);
      await rejection;

      expect(attempts).toBe(3);
    });

    it('does not retry a 404 response (no retry storm)', async () => {
      let calls = 0;
      httpMock.get.mockImplementation(() => {
        calls += 1;
        return throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }));
      });

      const syncData = service.syncObjects<{ name: string }>({
        url: '/api/%',
        localStorageKey: LocalStorage.SHOWS_PROGRESS,
      });

      await expect(firstValueFrom(syncData.sync(1, { force: true }))).rejects.toMatchObject({
        status: 404,
      });
      expect(calls).toBe(1);
    });

    it('does not retry a generic non-429 failure (no retry storm)', async () => {
      let calls = 0;
      httpMock.get.mockImplementation(() => {
        calls += 1;
        return throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' }));
      });

      const syncData = service.syncObjects<{ name: string }>({
        url: '/api/%',
        localStorageKey: LocalStorage.SHOWS_PROGRESS,
      });

      await expect(firstValueFrom(syncData.sync(1, { force: true }))).rejects.toMatchObject({
        status: 500,
      });
      expect(calls).toBe(1);
    });
  });
});
