import { CreatedByPipe } from './createdBy.pipe';

describe('CreatorPipe', () => {
  it('create an instance', () => {
    const pipe = new CreatedByPipe();
    expect(pipe).toBeTruthy();
  });
});
