import { TestBed } from '@angular/core/testing';
import { ParamService } from './param.service';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { z } from 'zod';
import type { LoadingState } from '@type/Loading';
import type { Params } from '@angular/router';

describe('ParamService', () => {
  let service: ParamService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ParamService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('params$', () => {
    it('should emit parsed params when valid', () => {
      vi.spyOn(console, 'debug').mockImplementation(() => {});
      const schema = z.object({ id: z.string() });
      const params: Params = { id: '123' };
      const pageStates: ReturnType<typeof signal<LoadingState>>[] = [];

      const result: unknown[] = [];
      service.params$(of(params), schema, pageStates).subscribe((v) => result.push(v));

      expect(result).toEqual([{ id: '123' }]);
    });

    it('should emit each unique value including duplicates with different references', () => {
      vi.spyOn(console, 'debug').mockImplementation(() => {});
      const schema = z.object({ id: z.string() });
      const params1: Params = { id: '123' };
      const params2: Params = { id: '456' };
      const pageStates: ReturnType<typeof signal<LoadingState>>[] = [];

      const result: unknown[] = [];
      service
        .params$(of(params1, params1, params2), schema, pageStates)
        .subscribe((v) => result.push(v));

      expect(result).toEqual([{ id: '123' }, { id: '123' }, { id: '456' }]);
    });

    it('should complete without emitting on invalid params', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const schema = z.object({ id: z.string() });
      const params: Params = { invalid: true };
      const pageStates: ReturnType<typeof signal<LoadingState>>[] = [];

      const result: unknown[] = [];
      service.params$(of(params), schema, pageStates).subscribe({
        next: (v) => result.push(v),
      });

      expect(result).toEqual([]);
    });
  });
});
