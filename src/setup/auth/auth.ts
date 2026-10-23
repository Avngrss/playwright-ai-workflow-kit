/**
 * The one auth interface tests and fixtures use, whatever way an app logs in:
 *   browserSession(browser, { platform, role }) → a signed-in browser session for UI tests   (browser-session.ts)
 *   ownSession(browser, account) / signInHere(page, account) → a test's own session / its own sign-in step
 *   apiHeaders(browser, { platform, role })     → the headers API requests send                (api-credentials.ts)
 * The way (a form, a token endpoint, a refresh token, the app's sign-in request, a key, or a
 * project's own client in ./project.ts) comes from the app's ```auth block in specs/project-map.md
 * §Auth. Sessions and API headers are shared by all workers and reused across runs (state/); one
 * worker signs an account in while the others wait.
 */
export { browserSession, ownSession, signInHere } from "./browser-session";
export { apiHeaders } from "./api-credentials";
