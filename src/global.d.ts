interface Window {
  pswp: typeof import('photoswipe').PhotoSwipe;
}

declare global {
  interface History {
    state: {
      back: string;
      pswp?: number;
    };
  }
}

declare module 'photoswipe/lightbox' {
  export default class PhotoSwipeLightbox {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(options: any);

    on(name: string, callback: () => void): void;

    loadAndOpen(index: number): boolean;

    init(): void;

    destroy(): void;

    options?: { index?: number };

    pswp?: { close(): void };
  }
}
