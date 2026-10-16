import { createArtworkLightbox } from './artworkLightbox';

const TRANSPARENT_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('createArtworkLightbox', () => {
  let gallery: HTMLElement;
  let lightbox: ReturnType<typeof createArtworkLightbox> | undefined;

  beforeEach(() => {
    gallery = document.createElement('div');
    document.body.appendChild(gallery);
  });

  afterEach(() => {
    lightbox?.destroy();
    window.pswp?.destroy();
    // PhotoSwipe tears itself down after the close transition, which never completes in a test;
    // clear the singleton and its element directly so the next test starts from a clean page.
    document.querySelector('.pswp')?.remove();
    delete (window as { pswp?: unknown }).pswp;
    gallery.remove();
  });

  it('ignores a click that is not on an artwork link', () => {
    lightbox = createArtworkLightbox(gallery);

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    gallery.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(false);
  });

  it('opens an artwork link that is added after the lightbox is initialized', async () => {
    lightbox = createArtworkLightbox(gallery);

    // The artwork only arrives once the page has fetched it, so the link is inserted after
    // `init()`. Binding to the links themselves would miss it and let the click fall through to
    // the browser, opening the image in a new tab instead of the lightbox.
    const link = document.createElement('a');
    link.className = 'image-link';
    link.href = TRANSPARENT_PNG;
    link.target = '_blank';
    link.dataset['pswpWidth'] = '1';
    link.dataset['pswpHeight'] = '1';
    gallery.appendChild(link);

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(click);

    await vi.waitFor(() => expect(window.pswp).toBeTruthy());
    // The click is intercepted, so the browser does not follow the link.
    expect(click.defaultPrevented).toBe(true);
  });
});
