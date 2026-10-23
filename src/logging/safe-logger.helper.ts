/** The one place test code may write to the console. Never pass secrets, tokens or personal data. */
export const safeLogger = {
  info(message: string): void {
    console.info(message);
  },
};
