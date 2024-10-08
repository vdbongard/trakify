interface Window {
  pswp: typeof import('photoswipe').PhotoSwipe;
}

declare global {
  interface History {
    state: {
      back: string;
    };
  }
}

declare module 'photoswipe/lightbox' {
  export default class PhotoSwipeLightbox {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    constructor(options: any);

    init(): void;

    destroy(): void;
  }
}
