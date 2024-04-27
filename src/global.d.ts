declare module 'photoswipe/lightbox' {
  export default class PhotoSwipeLightbox {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    constructor(options: any);

    init(): void;

    destroy(): void;
  }
}

declare global {
  interface History {
    state: {
      back: string;
    };
  }
}
