/* eslint-disable @typescript-eslint/naming-convention */
import { User } from '@type/Trakt';

export const mockUser: User = {
  ids: {
    slug: 'test-user',
  },
  name: 'Test User',
  private: false,
  username: 'testUser',
  vip: true,
  vip_ep: false,
};
