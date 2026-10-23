import type { BrowserContext } from "@playwright/test";

/**
 * Messages the app announces — toasts, snackbars, alerts (role "alert" or "status") — recorded as
 * they appear, in every tab of the test. A toast closes itself after a few seconds, so by the time a
 * failed check gives up it is often gone: the failure quotes what the app said meanwhile ("Name
 * already exists") instead of only "not found". Part of the template's page layer
 * (src/fixtures/pages.fixture.ts); a test checks a message with expectToast().
 */
const BINDING = "__aqaAppMessage";
const KEPT = 20;

export async function recordAppMessages(context: BrowserContext): Promise<string[]> {
  const messages: string[] = [];
  await context.exposeBinding(BINDING, (_source, text: string) => {
    if (messages.at(-1) === text) return;
    messages.push(text);
    if (messages.length > KEPT) messages.shift();
  });
  await context.addInitScript((binding: string) => {
    const SELECTOR = "[role=alert], [role=status]";
    const said = new WeakMap<Element, string>();
    // The text is read a moment later: a toast often gets its text right after it is added.
    const report = (element: Element) =>
      setTimeout(() => {
        const text = (element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
        if (!text || said.get(element) === text) return;
        said.set(element, text);
        (window as unknown as Record<string, ((text: string) => void) | undefined>)[binding]?.(text);
      }, 100);
    new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(SELECTOR)) report(node);
          node.querySelectorAll(SELECTOR).forEach(report);
        });
        const changed = record.target instanceof Element ? record.target : record.target.parentElement;
        const host = changed?.closest(SELECTOR);
        if (host) report(host);
      }
    }).observe(document, { childList: true, subtree: true, characterData: true });
  }, BINDING);
  return messages;
}
