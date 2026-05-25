import { TestBed } from '@angular/core/testing';
import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalStorageService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getObject', () => {
    it('should return undefined when key does not exist', () => {
      expect(service.getObject('nonexistent')).toBeUndefined();
    });

    it('should return parsed value when key exists', () => {
      localStorage.setItem('test', JSON.stringify({ a: 1, b: 2 }));
      expect(service.getObject<{ a: number; b: number }>('test')).toEqual({ a: 1, b: 2 });
    });

    it('should replace empty object values with undefined', () => {
      localStorage.setItem('test', JSON.stringify({ a: {}, b: 1 }));
      expect(service.getObject<{ a: undefined; b: number }>('test')).toEqual({
        a: undefined,
        b: 1,
      });
    });
  });

  describe('setObject', () => {
    it('should store a value in localStorage', () => {
      service.setObject('test', { a: 1 });
      expect(JSON.parse(localStorage.getItem('test')!)).toEqual({ a: 1 });
    });

    it('should replace undefined values with empty objects', () => {
      service.setObject('test', { a: undefined, b: 1 });
      expect(JSON.parse(localStorage.getItem('test')!)).toEqual({ a: {}, b: 1 });
    });

    it('should not store when value is undefined', () => {
      service.setObject('test', undefined);
      expect(localStorage.getItem('test')).toBeNull();
    });

    it('should store non-object values directly', () => {
      service.setObject('test', 42);
      expect(JSON.parse(localStorage.getItem('test')!)).toBe(42);
    });

    it('should handle localStorage quota error gracefully', () => {
      const storageSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(() => service.setObject('test', { a: 1 })).not.toThrow();
      storageSpy.mockRestore();
    });
  });
});
