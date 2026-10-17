import { createArtworkLightbox } from './artworkLightbox';

const TRANSPARENT_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/** The artwork arrives well after `init()` on a real page, so the link is inserted on demand. */
function addArtworkLink(gallery: HTMLElement): HTMLAnchorElement {
  const link = document.createElement('a');
  link.className = 'image-link';
  link.href = TRANSPARENT_PNG;
  link.target = '_blank';
  link.dataset['pswpWidth'] = '1';
  link.dataset['pswpHeight'] = '1';
  gallery.appendChild(link);
  return link;
}

function click(link: HTMLAnchorElement): MouseEvent {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  link.dispatchEvent(event);
  return event;
}

describe('createArtworkLightbox', () => {
  let gallery: HTMLElement;
  let lightbox: ReturnType<typeof createArtworkLightbox> | undefined;

  beforeEach(() => {
    gallery = document.createElement('div');
    document.body.appendChild(gallery);
  });

  afterEach(async () => {
    // Drop the entry the open viewer owns before tearing the viewer down, so the next test starts
    // from the same history it did and `destroy` does not race the async pop.
    if (history.state?.pswp) {
      const popped = new Promise<void>((resolve) => {
        window.addEventListener('popstate', () => resolve(), { once: true });
      });
      history.back();
      await popped;
    }
    lightbox?.destroy();
    window.pswp?.destroy();
    // PhotoSwipe tears itself down after the close transition, which never completes in a test;
    // clear the singleton and its element directly so the next test starts from a clean page.
    document.querySelector('.pswp')?.remove();
    delete (window as { pswp?: unknown }).pswp;
    gallery.remove();
  });

  async function openViewer(): Promise<HTMLAnchorElement> {
    const link = addArtworkLink(gallery);
    click(link);
    await vi.waitFor(() => expect(window.pswp).toBeTruthy());
    // PhotoSwipe ignores close() until the opening animation ends, as does a real user by then.
    await vi.waitFor(() => expect(window.pswp.opener.isOpen).toBe(true));
    return link;
  }

  it('ignores a click that is not on an artwork link', () => {
    lightbox = createArtworkLightbox(gallery);

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    gallery.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it('opens an artwork link that is added after the lightbox is initialized', async () => {
    lightbox = createArtworkLightbox(gallery);

    // The artwork only arrives once the page has fetched it, so the link is inserted after
    // `init()`. Binding to the links themselves would miss it and let the click fall through to
    // the browser, opening the image in a new tab instead of the lightbox.
    const link = addArtworkLink(gallery);

    const event = click(link);

    await vi.waitFor(() => expect(window.pswp).toBeTruthy());
    // The click is intercepted, so the browser does not follow the link.
    expect(event.defaultPrevented).toBe(true);
  });

  it('gives the open viewer its own history entry', async () => {
    lightbox = createArtworkLightbox(gallery);

    await openViewer();

    expect(history.state?.pswp).toBe(true);
  });

  it('closes the viewer when the browser goes back instead of leaving the page', async () => {
    lightbox = createArtworkLightbox(gallery);
    await openViewer();
    const close = vi.spyOn(window.pswp, 'close');

    history.back();

    // Back resolves to the same URL, so it does not leave the page: it only closes the viewer.
    await vi.waitFor(() => expect(close).toHaveBeenCalled());
    close.mockRestore();
  });

  it('closes the viewer when back arrives while it is still opening', async () => {
    lightbox = createArtworkLightbox(gallery);
    const link = addArtworkLink(gallery);
    click(link);
    await vi.waitFor(() => expect(window.pswp).toBeTruthy());

    history.back();

    // close() is a no-op mid-open, so the viewer closes as soon as the opening animation ends.
    await vi.waitFor(() => expect(window.pswp.opener.isClosing).toBe(true));
  });

  it('drops its history entry when the viewer is closed another way', async () => {
    lightbox = createArtworkLightbox(gallery);
    await openViewer();

    window.pswp.close();

    // The entry is popped again, so the closed viewer never costs an extra back press.
    await vi.waitFor(() => expect(history.state?.pswp).toBeFalsy());
  });

  it('leaves the entry alone when the viewer is torn down as its route changes', async () => {
    lightbox = createArtworkLightbox(gallery);
    await openViewer();
    // Stand in for a route change: the current entry's state is no longer the viewer's.
    history.replaceState({ back: '' }, '');
    const back = vi.spyOn(history, 'back');

    window.pswp.close();

    expect(back).not.toHaveBeenCalled();
    back.mockRestore();
  });
});
