let uniqueCounter = 0;

export function generateUniqueEmail(prefix = "ae-user"): string {
  uniqueCounter += 1;
  return `${prefix}-${Date.now()}-${uniqueCounter}@example.com`;
}
