import path from "node:path";

const assetsDirectory = path.resolve(
  process.cwd(),
  "src/test/assets/files",
);

export const contactUploadAssets = {
  validEmptyTxt: path.join(assetsDirectory, "contact-empty-attachment.txt"),
  invalidNonEmptyTxt: path.join(
    assetsDirectory,
    "contact-non-empty-attachment.txt",
  ),
  invalidExtensionPdf: path.join(
    assetsDirectory,
    "contact-invalid-extension.pdf",
  ),
} as const;
