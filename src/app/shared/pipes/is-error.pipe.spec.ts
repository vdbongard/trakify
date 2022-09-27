import { IsErrorPipe } from './is-error.pipe';

describe('IsErrorPipe', () => {
  it('create an instance', () => {
    const pipe = new IsErrorPipe();
    expect(pipe).toBeTruthy();
  });
});
