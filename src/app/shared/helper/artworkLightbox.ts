import PhotoSwipeLightbox from 'photoswipe/lightbox';

/** Handle on a bound artwork lightbox. */
export interface ArtworkLightbox {
  destroy(): void;
}

/** The class both artworks are rendered with. */
const ARTWORK_LINK = '.image-link';

/** The hash an open artwork viewer is named by, as in `#photo=0`. */
const OPEN_HASH = '#photo=';

/** The page URL the router tracks: path and query, with no fragment. */
function routeUrl(): string {
  return `${location.pathname}${location.search}`;
}

/** The URL that names `index` as the open item. */
function viewerUrl(index: number): string {
  return `${routeUrl()}${OPEN_HASH}${index}`;
}

/** The item index the current URL names as open, or undefined when it names none. */
function openIndexFromUrl(): number | undefined {
  if (!location.hash.startsWith(OPEN_HASH)) return undefined;
  const named = location.hash.slice(OPEN_HASH.length);
  return /^\d+$/.test(named) ? Number(named) : undefined;
}

/**
 * Binds a PhotoSwipe lightbox to every artwork link inside `gallery`.
 *
 * PhotoSwipe attaches its click listener to the element(s) it is handed: with
 * `gallery: '.image-link'` those are the artwork links themselves, which therefore have to be in
 * the DOM the moment `init()` runs. The artwork only arrives with its own TMDB request, so on a
 * slow or cold connection the link is not there yet, no listener is attached, and the click falls
 * through to the browser and opens the image in a new tab. The fixed timeouts both pages used to
 * wait out were a race against that request.
 *
 * Binding to `gallery` (a container that always exists) and resolving the items through `children`
 * on each click removes the dependency on when the artwork renders: a link added after `init()`
 * is picked up because the listener sits on the container and the items are queried at click time.
 *
 * The open viewer is named by the URL — `#photo=<index>` — which is the one place its state lives,
 * so the state can be shared: opening the same link elsewhere opens the same artwork, and going
 * forward onto an entry that named it opens it again. Opening also gives the viewer a history entry
 * of its own, so the back button closes it instead of walking out of the page while it is still on
 * screen; the view transition that route change would run is what made the artwork glitch. Closing
 * the viewer any other way gives the entry back, so it never costs the user an extra back press.
 */
export function createArtworkLightbox(gallery: HTMLElement): ArtworkLightbox {
  const lightbox = new PhotoSwipeLightbox({
    gallery,
    children: ARTWORK_LINK,
    pswpModule: (): Promise<unknown> => import('photoswipe'),
  });

  /** Set when back arrives before the opening animation ended: `close()` is a no-op until then,
   *  because PhotoSwipe will not reverse a transition mid-flight, so the close waits for it. */
  let closeAfterOpening = false;
  /** Item an open is waiting for, while the artwork or an earlier viewer is still in the way. */
  let pendingIndex: number | undefined;
  /** Watches for the artwork to render while an open waits on it. */
  let artworkWatch: MutationObserver | undefined;

  lightbox.on('beforeOpen', () => {
    closeAfterOpening = false;
    const index = lightbox.options?.index ?? 0;
    // A click opens the viewer on a URL that does not name it yet, so give it an entry of its own.
    // A forward, or a page opened straight from a shared link, arrives on a URL that already names
    // it: that entry is already there and a second one would cost the user an extra back press.
    if (openIndexFromUrl() === undefined) {
      history.pushState(
        // Angular reads `ɵrouterUrl` on back and forward. With the page URL in it, Angular keeps
        // out of the way instead of navigating to the viewer's own URL, which would push a second
        // entry and run a view transition over the viewer's animation.
        { ...history.state, pswp: index, ɵrouterUrl: routeUrl() },
        '',
        viewerUrl(index),
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
      // The open viewer took an entry of its own, so closing it gives that entry back. Only an
      // entry opened here names an index; anything else in `pswp` (an older release left a boolean)
      // belongs to someone else and giving it back would skip a back press.
      history.back();
    } else if (openIndexFromUrl() !== undefined) {
      // Opened straight from a shared link: there is no entry of ours to give back, so stop naming
      // the viewer without leaving the page.
      history.replaceState(history.state, '', routeUrl());
    }
  });

  const onPopState = (): void => {
    const index = openIndexFromUrl();
    if (index === undefined) {
      if (lightbox.pswp) {
        closeAfterOpening = true;
        lightbox.pswp.close();
      }
    } else {
      open(index);
    }
  };

  /** Opens the viewer on `index` once the artwork and any closing viewer are out of the way. */
  function open(index: number): void {
    pendingIndex = index;
    openWhenReady();
  }

  function openWhenReady(): void {
    if (pendingIndex === undefined || window.pswp) return;
    if (!gallery.querySelector(ARTWORK_LINK)) {
      // The artwork has not arrived yet; open as soon as it is rendered.
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
    // A viewer that is still closing clears window.pswp only after this listener runs.
    queueMicrotask(openWhenReady);
  });

  window.addEventListener('popstate', onPopState);
  lightbox.init();

  const named = openIndexFromUrl();
  if (named !== undefined) open(named);

  return {
    destroy: (): void => {
      window.removeEventListener('popstate', onPopState);
      artworkWatch?.disconnect();
      lightbox.destroy();
    },
  };
}
