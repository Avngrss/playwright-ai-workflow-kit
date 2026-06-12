let uniqueEmailCounter = 0;

export function generateUniqueEmail(prefix = "registration.user"): string {
  uniqueEmailCounter += 1;

  return `${prefix}.${Date.now()}.${uniqueEmailCounter}@example.test`;
}
