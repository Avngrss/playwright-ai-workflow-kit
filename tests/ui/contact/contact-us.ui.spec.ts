import path from "node:path";
import { expect, test } from "../../../src/test/fixtures/test";
import { contactUsFormBuilder } from "../../../src/test/data/builders/contact-us-form.builder";

const uploadFilePath = path.resolve(
  __dirname,
  "../../../src/test/data/assets/contact-us-upload.txt"
);

const validContactData = contactUsFormBuilder.build();

test.describe("Contact Us form", () => {
  test(
    "CU-001 renders Contact Us form controls",
    { tag: ["@ui", "@smoke"] },
    async ({ contactUsPage }) => {
      await test.step("Open Contact Us page", async () => {
        await contactUsPage.open();
      });

      await test.step("Verify page headings are visible", async () => {
        await expect(contactUsPage.pageHeading).toBeVisible();
        await expect(contactUsPage.getInTouchHeading).toBeVisible();
      });

      await test.step("Verify form controls are visible and interactable", async () => {
        await expect(contactUsPage.nameInput).toBeVisible();
        await expect(contactUsPage.emailInput).toBeVisible();
        await expect(contactUsPage.subjectInput).toBeVisible();
        await expect(contactUsPage.messageInput).toBeVisible();
        await expect(contactUsPage.fileInput).toBeVisible();
        await expect(contactUsPage.submitButton).toBeVisible();
      });
    }
  );

  test(
    "CU-002 submits Contact Us form successfully with file upload",
    { tag: ["@ui", "@smoke"] },
    async ({ contactUsPage }) => {
      await test.step("Open Contact Us page", async () => {
        await contactUsPage.open();
      });

      await test.step("Fill the contact form and upload a file", async () => {
        await contactUsPage.fillForm(validContactData);
        await contactUsPage.uploadFile(uploadFilePath);
      });

      await test.step("Submit the form and accept confirmation", async () => {
        let dialogMessage = "";
        contactUsPage.page.once("dialog", async (dialog) => {
          dialogMessage = dialog.message();
          await dialog.accept();
        });

        await contactUsPage.submit();
        expect(dialogMessage).toBe("Press OK to proceed!");
      });

      await test.step("Verify success message and post-submit Home action", async () => {
        await expect(contactUsPage.successMessage).toBeVisible();
        await expect(contactUsPage.postSubmitHomeButton).toBeVisible();
      });
    }
  );

  test(
    "CU-003 navigates to Home page after successful submit",
    { tag: ["@ui", "@smoke"] },
    async ({ contactUsPage, homePage }) => {
      await test.step("Open page and submit Contact Us form successfully", async () => {
        await contactUsPage.open();
        await contactUsPage.fillForm(validContactData);
        await contactUsPage.uploadFile(uploadFilePath);

        let dialogMessage = "";
        contactUsPage.page.once("dialog", async (dialog) => {
          dialogMessage = dialog.message();
          await dialog.accept();
        });

        await contactUsPage.submit();
        expect(dialogMessage).toBe("Press OK to proceed!");

        await expect(contactUsPage.postSubmitHomeButton).toBeVisible();
      });

      await test.step("Use post-submit Home button and verify landing page", async () => {
        await expect(contactUsPage.postSubmitHomeButton).toHaveAttribute("href", "/");
        await contactUsPage.postSubmitHomeButton.click();

        // Third-party ad overlays can occasionally keep the page on #google_vignette.
        if (contactUsPage.page.url().includes("#google_vignette")) {
          await contactUsPage.page.goto("/");
        }

        await expect(contactUsPage.page).toHaveURL(/\/$/);
        await expect(homePage.heroBannerText).toBeVisible();
      });
    }
  );

  test(
    "CU-005 blocks submit when required email is empty",
    { tag: ["@ui", "@regression"] },
    async ({ contactUsPage }) => {
      await test.step("Open Contact Us page", async () => {
        await contactUsPage.open();
      });

      await test.step("Fill all fields except email", async () => {
        const dataWithoutEmail = contactUsFormBuilder.build({ email: undefined });
        await contactUsPage.fillForm(dataWithoutEmail);
      });

      await test.step("Attempt submit and verify required-field validation blocks flow", async () => {
        let dialogSeen = false;
        contactUsPage.page.once("dialog", async (dialog) => {
          dialogSeen = true;
          await dialog.dismiss();
        });

        await contactUsPage.submit();

        const emailIsValid = await contactUsPage.isEmailFieldValid();
        expect(emailIsValid).toBe(false);
        expect(dialogSeen).toBe(false);
        await expect(contactUsPage.successMessage).toBeHidden();
      });
    }
  );

  test(
    "CU-004 keeps form visible when submit confirmation is cancelled",
    { tag: ["@ui", "@regression"] },
    async ({ contactUsPage }) => {
      await test.step("Open Contact Us page and enter valid data", async () => {
        await contactUsPage.open();
        await contactUsPage.fillForm(validContactData);
      });

      await test.step("Submit and cancel confirmation dialog", async () => {
        let dialogMessage = "";
        contactUsPage.page.once("dialog", async (dialog) => {
          dialogMessage = dialog.message();
          await dialog.dismiss();
        });

        await contactUsPage.submit();
        expect(dialogMessage).toBe("Press OK to proceed!");
      });

      await test.step("Verify success state is not shown and form is still available", async () => {
        await expect(contactUsPage.successMessage).toBeHidden();
        await expect(contactUsPage.submitButton).toBeVisible();
      });
    }
  );
});
