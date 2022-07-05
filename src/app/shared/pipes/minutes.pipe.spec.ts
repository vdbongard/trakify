import { MinutesPipe } from './minutes.pipe';

describe('TimePipe', () => {
  it('create an instance', () => {
    const pipe = new MinutesPipe();
    expect(pipe).toBeTruthy();
  });
});
