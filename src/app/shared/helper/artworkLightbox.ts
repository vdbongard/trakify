import PhotoSwipeLightbox from 'photoswipe/lightbox';

/** Handle on a bound artwork lightbox. */
export interface ArtworkLightbox {
  destroy(): void;
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
 * The open viewer also takes a browser-history entry of its own. Without one the back button walks
 * straight out of the page while the viewer is still on screen, and the view transition running
 * for that route change fights the viewer's own closing animation. With it, back resolves to the
 * same URL, so the router ignores it as a same-URL navigation and only the viewer closes. Closing
 * the viewer any other way drops the entry again, so it never costs the user an extra back press.
 */
export function createArtworkLightbox(gallery: HTMLElement): ArtworkLightbox {
  const lightbox = new PhotoSwipeLightbox({
    gallery,
    children: '.image-link',
    pswpModule: (): Promise<unknown> => import('photoswipe'),
  });

  /** Set when back arrives before the opening animation ended: `close()` is a no-op until then,
   *  because PhotoSwipe will not reverse a transition mid-flight, so the close waits for it. */
  let closeAfterOpening = false;

  lightbox.on('beforeOpen', () => {
    closeAfterOpening = false;
    history.pushState({ ...history.state, pswp: true }, '', location.href);
  });

  lightbox.on('openingAnimationEnd', () => {
    if (closeAfterOpening) lightbox.pswp?.close();
  });

  lightbox.on('close', () => {
    closeAfterOpening = false;
    // Back/forward has already left the entry behind; only a viewer closed some other way (its
    // close button, Escape, a background tap) still owns the entry on top and has to drop it. A
    // close during a route change sees the next route's state, which is not ours, and leaves it.
    if (history.state?.pswp) history.back();
  });

  const onPopState = (): void => {
    // The entry this viewer owned is no longer current: the back/forward button closed it.
    if (!lightbox.pswp || history.state?.pswp) return;
    closeAfterOpening = true;
    lightbox.pswp.close();
  };

  window.addEventListener('popstate', onPopState);
  lightbox.init();

  return {
    destroy: (): void => {
      window.removeEventListener('popstate', onPopState);
      lightbox.destroy();
    },
  };
}
