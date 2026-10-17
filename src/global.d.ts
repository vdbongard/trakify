interface Window {
  pswp: typeof import('photoswipe').PhotoSwipe;
}

declare global {
  interface History {
    state: {
      back: string;
      /** Item the open artwork lightbox is showing (see createArtworkLightbox). */
      pswp?: number;
    };
  }
}

declare module 'photoswipe/lightbox' {
  export default class PhotoSwipeLightbox {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(options: any);

    on(name: string, callback: () => void): void;

    /** Opens the viewer on the item at `index`, once the module has loaded. */
    loadAndOpen(index: number): boolean;

    init(): void;

    destroy(): void;

    /** The options the viewer is opened with; `index` is the item it is showing. */
    options?: { index?: number };

    /** The open viewer, or undefined while none is open. */
    pswp?: { close(): void };
  }
}
