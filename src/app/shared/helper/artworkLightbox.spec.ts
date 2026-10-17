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
    // Give back the entry the open viewer took before tearing it down, so the next test starts from
    // the same history it did and the close does not race the pop.
    if (history.state?.pswp !== undefined) {
      const popped = new Promise<void>((resolve) => {
        window.addEventListener('popstate', () => resolve(), { once: true });
      });
      history.back();
      await popped;
    }
    lightbox?.destroy();
    window.pswp?.destroy();
    // PhotoSwipe tears itself down after a transition; wait for that to finish, because a destroy
    // that lands late would clear the next test's viewer out from under it.
    if (window.pswp) await vi.waitFor(() => expect(window.pswp).toBeFalsy(), { timeout: 5000 });
    // The close transition never completes in a test, so drop the leftover element directly.
    document.querySelector('.pswp')?.remove();
    delete (window as { pswp?: unknown }).pswp;
    if (location.hash) {
      history.replaceState(history.state, '', `${location.pathname}${location.search}`);
    }
    gallery.remove();
  });

  /** Clicks an artwork link and waits for the viewer behind it to be fully open. */
  async function openViewer(): Promise<HTMLAnchorElement> {
    const link = addArtworkLink(gallery);
    click(link);
    await waitForOpenViewer();
    return link;
  }

  async function waitForOpenViewer(): Promise<void> {
    await vi.waitFor(() => expect(window.pswp).toBeTruthy());
    // PhotoSwipe ignores close() until the opening animation ends, as does a real user by then.
    await vi.waitFor(() => expect(window.pswp?.opener.isOpen).toBe(true));
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

  it('names the open viewer in the URL and takes a history entry', async () => {
    lightbox = createArtworkLightbox(gallery);

    await openViewer();

    expect(location.hash).toBe('#photo=0');
    expect(history.state?.pswp).toBe(0);
  });

  it('closes the viewer when the browser goes back instead of leaving the page', async () => {
    lightbox = createArtworkLightbox(gallery);
    await openViewer();
    const close = vi.spyOn(window.pswp, 'close');

    history.back();

    // Back gives the viewer's entry up, so it closes the viewer and leaves a clean URL.
    await vi.waitFor(() => expect(close).toHaveBeenCalled());
    await vi.waitFor(() => expect(location.hash).toBe(''));
    close.mockRestore();
  });

  it('closes the viewer when back arrives while it is still opening', async () => {
    lightbox = createArtworkLightbox(gallery);
    const link = addArtworkLink(gallery);
    click(link);
    await vi.waitFor(() => expect(window.pswp).toBeTruthy());

    history.back();

    // close() is a no-op mid-open, so the viewer closes as soon as the opening animation ends.
    await vi.waitFor(() => expect(window.pswp?.opener.isClosing).toBe(true));
  });

  it('gives the entry back when the viewer is closed another way', async () => {
    lightbox = createArtworkLightbox(gallery);
    await openViewer();

    window.pswp.close();

    // The entry is popped again, so the closed viewer never costs an extra back press.
    await vi.waitFor(() => expect(history.state?.pswp).toBeUndefined());
    expect(location.hash).toBe('');
  });

  it('opens the viewer named by the URL on load', async () => {
    history.replaceState(null, '', '#photo=0');
    // The shared link names the artwork, so it is already on the page when the lightbox binds.
    addArtworkLink(gallery);

    lightbox = createArtworkLightbox(gallery);

    await waitForOpenViewer();
  });

  it('stops naming the viewer when one opened from a shared link is closed', async () => {
    history.replaceState(null, '', '#photo=0');
    addArtworkLink(gallery);
    lightbox = createArtworkLightbox(gallery);
    await waitForOpenViewer();

    window.pswp.close();

    // There is no entry of ours to give back, so the name is dropped from the URL instead of the
    // close leaving the page.
    await vi.waitFor(() => expect(location.hash).toBe(''));
  });

  it('opens nothing for a URL that only looks like it names the viewer', async () => {
    history.replaceState(null, '', '#photo=');
    addArtworkLink(gallery);

    lightbox = createArtworkLightbox(gallery);
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(window.pswp).toBeFalsy();
  });

  it('opens the viewer again when the browser goes forward onto a named entry', async () => {
    lightbox = createArtworkLightbox(gallery);
    await openViewer();
    history.back();
    await vi.waitFor(() => expect(window.pswp).toBeFalsy());

    history.forward();

    await waitForOpenViewer();
    expect(location.hash).toBe('#photo=0');

    // One back still closes it: going forward left no second entry behind.
    history.back();
    await vi.waitFor(() => expect(window.pswp).toBeFalsy());
    expect(location.hash).toBe('');
  });

  it('leaves the entry alone when the viewer is torn down as its route changes', async () => {
    lightbox = createArtworkLightbox(gallery);
    await openViewer();
    // Stand in for a route change: the current entry no longer names the viewer.
    history.replaceState({ back: '' }, '', `${location.pathname}${location.search}`);
    const back = vi.spyOn(history, 'back');

    window.pswp.close();

    expect(back).not.toHaveBeenCalled();
    back.mockRestore();
  });
});
