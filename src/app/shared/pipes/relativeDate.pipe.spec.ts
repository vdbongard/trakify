import { RelativeDatePipe } from './relativeDate.pipe';

describe('RelativePipe', () => {
  it('create an instance', () => {
    const pipe = new RelativeDatePipe();
    expect(pipe).toBeTruthy();
  });
});
