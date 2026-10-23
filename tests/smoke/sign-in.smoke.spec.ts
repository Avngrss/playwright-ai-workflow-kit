import { expect, test } from "src/fixtures/test";
import { expectStatus } from "src/assertions/shared/http";
import { expectAppOpened, expectSentToSignIn, expectSignedIn, sessionCheckUrl } from "src/assertions/shared/sign-in";
import { authConfig, resolve, signInRoles, SINGLE_ACCOUNT } from "src/setup/auth/auth-config";
import { isRegistered, platforms } from "src/setup/platforms";

// Part of the template, never edited — roles, sign-in and "who am I" come from each app's ```auth block.
// Skips are decided before a browser or request starts, so an app without a web UI never needs its URL.
const smoke = { tag: ["@smoke"] };

for (const { slug: platform, ui: webApp } of platforms()) {
  const { configured, roles, ui, api, sessionCheck } = authConfig(platform);
  const single = roles.length === 1 && roles[0] === SINGLE_ACCOUNT;
  const noWebSignIn = webApp ? "The web app has no sign-in" : "The app has no web UI";
  // An app open to visitors is checked on its members-only page: a visitor is sent to sign in, a user stays.
  const guardedPage = () => (ui.membersOnly ? resolve(ui.membersOnly) : "./");
  // One group per app, tagged with it — each app's smoke project runs its own group (from the first app on).
  const perApp = (body: () => void) => (isRegistered() ? test.describe(`${platform} sign-in`, { tag: `@${platform}` }, body) : test.describe(body));

  perApp(() => {
    test.skip(!configured, "Login is not set up yet — the setup skill (/setup) sets it up");

    // A public web app (its block signs in nowhere): "is the stand alive?" is the app opening at its address.
    if (configured && webApp && !roles.length) {
      test.describe("Public web app (smoke)", () => {
        test.use({ role: "none" });

        test("The web app opens", smoke, async ({ page }) => {
          const opened = await test.step("Open the web app", () => page.goto("./"));
          await test.step("Verify the app shows its page", async () => {
            await expectAppOpened(page, opened);
          });
        });
      });
    }

    // "Is the stand alive?" — the first account only; `npm run auth:sign-in -- <app> <role|all>` checks the others.
    for (const role of signInRoles(platform, roles)) {
      const user = single ? "user" : role;

      test.describe(`Sign-in as ${user} (smoke)`, () => {
        test.use({ role });

        test.describe(() => {
          test.skip(ui.mode === "none", noWebSignIn);

          test(`The ${user} is signed in to the web app`, smoke, async ({ page }) => {
            await test.step("Open the web app", async () => {
              await page.goto(guardedPage());
            });
            await test.step("Verify the app opens, not its sign-in page", async () => {
              await expectSignedIn(page, platform);
            });
          });
        });

        test.describe(() => {
          test.skip(api.mode === "none", "The app has no API sign-in");
          // No page here: the API check gets its credentials its own way (a token needs no browser) —
          // Playwright would otherwise sign in through the browser for every test it runs.
          test.use({ storageState: async ({}, use) => use(undefined) });

          // No "who am I" request known yet (an API without its contract): at least credentials are issued.
          if (!sessionCheck) {
            test(`The ${user} gets credentials for data requests`, smoke, async ({ authHeaders }) => {
              await test.step("Get sign-in credentials", async () => {
                expect(Object.keys(authHeaders), "Sign-in credentials").not.toHaveLength(0);
              });
            });
            return;
          }

          test(`The ${user}'s session is accepted for data requests`, smoke, async ({ request, authHeaders }) => {
            await test.step("Ask the server who is signed in", async () => {
              await expectStatus(request.get(sessionCheckUrl(platform), { headers: authHeaders }), 200);
            });
          });
        });
      });
    }

    test.describe("Signed out (smoke)", () => {
      test.use({ role: "none" });
      test.skip(ui.mode === "none", noWebSignIn);

      test("A signed-out visitor is sent to the sign-in page", smoke, async ({ page }) => {
        await test.step("Open the web app without signing in", async () => {
          await page.goto(guardedPage());
        });
        await test.step("Verify the sign-in page is shown instead of the app", async () => {
          await expectSentToSignIn(page, platform);
        });
      });
    });
  });
}
