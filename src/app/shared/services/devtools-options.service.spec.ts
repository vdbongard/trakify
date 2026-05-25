import { TestBed } from '@angular/core/testing';
import { DevtoolsOptionsService } from './devtools-options.service';

describe('DevtoolsOptionsService', () => {
  let service: DevtoolsOptionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DevtoolsOptionsService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return "auto" when debug param is not set', () => {
    vi.spyOn(URLSearchParams.prototype, 'get').mockReturnValue(null);
    expect(service.isDebug()).toBe('auto');
  });

  it('should return true when debug=1 is in URL', () => {
    vi.spyOn(URLSearchParams.prototype, 'get').mockReturnValue('1');
    expect(service.isDebug()).toBe(true);
  });

  it('should return "auto" when debug=0 is in URL', () => {
    vi.spyOn(URLSearchParams.prototype, 'get').mockReturnValue('0');
    expect(service.isDebug()).toBe('auto');
  });
});
