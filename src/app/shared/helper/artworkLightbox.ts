import PhotoSwipeLightbox from 'photoswipe/lightbox';
import type { ArtworkName } from '@type/Artwork';

export interface ArtworkLightbox {
  destroy(): void;
}

const ARTWORK_LINK = '.image-link';

const OPEN_HASH = '#artwork=';

function routeUrl(): string {
  return `${location.pathname}${location.search}`;
}

function artworkNameFromUrl(): string | undefined {
  const name = location.hash.startsWith(OPEN_HASH) ? location.hash.slice(OPEN_HASH.length) : '';
  return name || undefined;
}

export function createArtworkLightbox(
  gallery: HTMLElement,
  artworkName: ArtworkName,
): ArtworkLightbox {
  const lightbox = new PhotoSwipeLightbox({
    gallery,
    children: ARTWORK_LINK,
    pswpModule: (): Promise<unknown> => import('photoswipe'),
  });

  let closeAfterOpening = false;
  let pendingIndex: number | undefined;
  let artworkWatch: MutationObserver | undefined;

  function namesViewer(): boolean {
    return artworkNameFromUrl() === artworkName;
  }

  lightbox.on('beforeOpen', () => {
    closeAfterOpening = false;
    if (!namesViewer()) {
      history.pushState(
        { ...history.state, pswp: lightbox.options?.index ?? 0, ɵrouterUrl: routeUrl() },
        '',
        `${routeUrl()}${OPEN_HASH}${artworkName}`,
      );
    }
  });

  lightbox.on('openingAnimationEnd', () => {
    if (closeAfterOpening) lightbox.pswp?.close();
  });

  lightbox.on('close', () => {
    closeAfterOpening = false;
    pendingIndex = undefined;
    if (typeof history.state?.pswp === 'number') {
      history.back();
    } else if (namesViewer()) {
      history.replaceState(history.state, '', routeUrl());
    }
  });

  const onPopState = (): void => {
    if (namesViewer()) {
      open(entryIndex());
    } else if (lightbox.pswp) {
      closeAfterOpening = true;
      lightbox.pswp.close();
    }
  };

  function entryIndex(): number {
    return typeof history.state?.pswp === 'number' ? history.state.pswp : 0;
  }

  function open(index: number): void {
    pendingIndex = index;
    openWhenReady();
  }

  function openWhenReady(): void {
    if (pendingIndex === undefined || window.pswp) return;
    if (!gallery.querySelector(ARTWORK_LINK)) {
      artworkWatch ??= new MutationObserver(() => {
        if (!gallery.querySelector(ARTWORK_LINK)) return;
        artworkWatch?.disconnect();
        artworkWatch = undefined;
        openWhenReady();
      });
      artworkWatch.observe(gallery, { childList: true, subtree: true });
      return;
    }
    const index = pendingIndex;
    pendingIndex = undefined;
    lightbox.loadAndOpen(index);
  }

  lightbox.on('destroy', () => {
    queueMicrotask(openWhenReady);
  });

  window.addEventListener('popstate', onPopState);
  lightbox.init();

  if (namesViewer()) open(entryIndex());

  return {
    destroy: (): void => {
      window.removeEventListener('popstate', onPopState);
      artworkWatch?.disconnect();
      lightbox.destroy();
    },
  };
}
