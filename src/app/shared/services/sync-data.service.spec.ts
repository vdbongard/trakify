import { TestBed } from '@angular/core/testing';
import { SyncDataService } from './sync-data.service';
import { HttpClient } from '@angular/common/http';
import { LocalStorageService } from '@services/local-storage.service';
import { LocalStorage } from '@type/Enum';
import { firstValueFrom, of } from 'rxjs';

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
});
