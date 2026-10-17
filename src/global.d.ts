interface Window {
  pswp: typeof import('photoswipe').PhotoSwipe;
}

declare global {
  interface History {
    state: {
      back: string;
      /** Set while an artwork lightbox owns the current entry (see createArtworkLightbox). */
      pswp?: boolean;
    };
  }
}

declare module 'photoswipe/lightbox' {
  export default class PhotoSwipeLightbox {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(options: any);

    on(name: string, callback: () => void): void;

    init(): void;

    destroy(): void;

    /** The open viewer, or undefined while none is open. */
    pswp?: { close(): void };
  }
}
