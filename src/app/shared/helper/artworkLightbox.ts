import PhotoSwipeLightbox from 'photoswipe/lightbox';

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
 */
export function createArtworkLightbox(gallery: HTMLElement): PhotoSwipeLightbox {
  const lightbox = new PhotoSwipeLightbox({
    gallery,
    children: '.image-link',
    pswpModule: (): Promise<unknown> => import('photoswipe'),
  });
  lightbox.init();
  return lightbox;
}
