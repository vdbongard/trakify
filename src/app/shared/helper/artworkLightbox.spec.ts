import type { ArtworkName } from '@type/Artwork';
import { createArtworkLightbox } from './artworkLightbox';

const STILL: ArtworkName = 'still';

const TRANSPARENT_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

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
    if (typeof history.state?.pswp === 'number') {
      const popped = new Promise<void>((resolve) => {
        window.addEventListener('popstate', () => resolve(), { once: true });
      });
      history.back();
      await popped;
    }
    lightbox?.destroy();
    window.pswp?.destroy();
    if (window.pswp) await vi.waitFor(() => expect(window.pswp).toBeFalsy(), { timeout: 5000 });
    document.querySelector('.pswp')?.remove();
    delete (window as { pswp?: unknown }).pswp;
    if (location.hash) {
      history.replaceState(history.state, '', `${location.pathname}${location.search}`);
    }
    gallery.remove();
  });

  async function openViewer(): Promise<HTMLAnchorElement> {
    const link = addArtworkLink(gallery);
    click(link);
    await waitForOpenViewer();
    return link;
  }

  async function waitForOpenViewer(): Promise<void> {
    await vi.waitFor(() => expect(window.pswp).toBeTruthy());
    await vi.waitFor(() => expect(window.pswp?.opener.isOpen).toBe(true));
  }

  it('ignores a click that is not on an artwork link', () => {
    lightbox = createArtworkLightbox(gallery, STILL);

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    gallery.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it('opens an artwork link that is added after the lightbox is initialized', async () => {
    lightbox = createArtworkLightbox(gallery, STILL);

    const link = addArtworkLink(gallery);

    const event = click(link);

    await vi.waitFor(() => expect(window.pswp).toBeTruthy());
    expect(event.defaultPrevented).toBe(true);
  });

  it('names the open viewer in the URL and takes a history entry', async () => {
    lightbox = createArtworkLightbox(gallery, STILL);

    await openViewer();

    expect(location.hash).toBe('#artwork=still');
    expect(history.state?.pswp).toBe(0);
  });

  it('closes the viewer when the browser goes back instead of leaving the page', async () => {
    lightbox = createArtworkLightbox(gallery, STILL);
    await openViewer();
    const close = vi.spyOn(window.pswp, 'close');

    history.back();

    await vi.waitFor(() => expect(close).toHaveBeenCalled());
    await vi.waitFor(() => expect(location.hash).toBe(''));
    close.mockRestore();
  });

  it('closes the viewer when back arrives while it is still opening', async () => {
    lightbox = createArtworkLightbox(gallery, STILL);
    const link = addArtworkLink(gallery);
    click(link);
    await vi.waitFor(() => expect(window.pswp).toBeTruthy());

    history.back();

    await vi.waitFor(() => expect(window.pswp?.opener.isClosing).toBe(true));
  });

  it('gives the entry back when the viewer is closed another way', async () => {
    lightbox = createArtworkLightbox(gallery, STILL);
    await openViewer();

    window.pswp.close();

    await vi.waitFor(() => expect(history.state?.pswp).toBeUndefined());
    expect(location.hash).toBe('');
  });

  it('opens the viewer named by the URL on load', async () => {
    history.replaceState(null, '', '#artwork=still');
    addArtworkLink(gallery);

    lightbox = createArtworkLightbox(gallery, STILL);

    await waitForOpenViewer();
  });

  it('stops naming the viewer when one opened from a shared link is closed', async () => {
    history.replaceState(null, '', '#artwork=still');
    addArtworkLink(gallery);
    lightbox = createArtworkLightbox(gallery, STILL);
    await waitForOpenViewer();

    window.pswp.close();

    await vi.waitFor(() => expect(location.hash).toBe(''));
  });

  it('opens nothing for a URL that only looks like it names the viewer', async () => {
    history.replaceState(null, '', '#artwork=');
    addArtworkLink(gallery);

    lightbox = createArtworkLightbox(gallery, STILL);
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(window.pswp).toBeFalsy();
  });

  it('opens nothing when the URL names a different artwork', async () => {
    history.replaceState(null, '', '#artwork=poster');
    addArtworkLink(gallery);

    lightbox = createArtworkLightbox(gallery, STILL);
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(window.pswp).toBeFalsy();
  });

  it('reopens the item the entry recorded when the page loads on a named entry', async () => {
    history.pushState({ pswp: 1 }, '', '#artwork=still');
    addArtworkLink(gallery);
    addArtworkLink(gallery);

    lightbox = createArtworkLightbox(gallery, STILL);
    await waitForOpenViewer();

    expect(window.pswp?.currIndex).toBe(1);
  });

  it('opens the viewer again when the browser goes forward onto a named entry', async () => {
    lightbox = createArtworkLightbox(gallery, STILL);
    await openViewer();
    history.back();
    await vi.waitFor(() => expect(window.pswp).toBeFalsy());

    history.forward();

    await waitForOpenViewer();
    expect(location.hash).toBe('#artwork=still');

    history.back();
    await vi.waitFor(() => expect(window.pswp).toBeFalsy());
    expect(location.hash).toBe('');
  });

  it('does not give back an entry left by an older release', async () => {
    lightbox = createArtworkLightbox(gallery, STILL);
    await openViewer();
    history.replaceState(
      { ...history.state, pswp: true },
      '',
      `${location.pathname}${location.search}`,
    );
    const back = vi.spyOn(history, 'back');

    window.pswp.close();

    expect(back).not.toHaveBeenCalled();
    back.mockRestore();
  });

  it('leaves the entry alone when the viewer is torn down as its route changes', async () => {
    lightbox = createArtworkLightbox(gallery, STILL);
    await openViewer();
    history.replaceState({ back: '' }, '', `${location.pathname}${location.search}`);
    const back = vi.spyOn(history, 'back');

    window.pswp.close();

    expect(back).not.toHaveBeenCalled();
    back.mockRestore();
  });
});
