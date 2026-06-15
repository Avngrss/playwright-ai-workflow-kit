import { expect } from "@playwright/test";

type SortDirection = "asc" | "desc";

function isMonotonicAscending<T>(values: T[], compare: (left: T, right: T) => number): boolean {
  for (let index = 1; index < values.length; index += 1) {
    if (compare(values[index - 1], values[index]) > 0) {
      return false;
    }
  }

  return true;
}

function isMonotonicDescending<T>(values: T[], compare: (left: T, right: T) => number): boolean {
  for (let index = 1; index < values.length; index += 1) {
    if (compare(values[index - 1], values[index]) < 0) {
      return false;
    }
  }

  return true;
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function getUniqueCount<T>(values: T[]): number {
  return new Set(values).size;
}

export function getNameSortComparabilityIssue(names: string[]): string | null {
  const normalizedNames = names.map(normalizeName);

  if (normalizedNames.length < 2) {
    return "Insufficient visible name values to compare sorting";
  }

  if (getUniqueCount(normalizedNames) < 2) {
    return "Comparable name values are not available on visible product cards";
  }

  return null;
}

export function getPriceSortComparabilityIssue(prices: number[]): string | null {
  if (prices.length < 2) {
    return "Insufficient visible price values to compare sorting";
  }

  if (prices.some((price) => Number.isNaN(price))) {
    return "Some visible product price values could not be parsed reliably";
  }

  if (getUniqueCount(prices) < 2) {
    return "Comparable price values are not available on visible product cards";
  }

  return null;
}

export function getCo2SortComparabilityIssue(ratings: string[]): string | null {
  const normalizedRatings = ratings.map((rating) => rating.trim().toUpperCase());

  if (normalizedRatings.length < 2) {
    return "Insufficient visible CO2 values to compare sorting";
  }

  if (normalizedRatings.some((rating) => rating.length === 0)) {
    return "CO2 values are not visible or not reliably readable from visible product cards";
  }

  if (getUniqueCount(normalizedRatings) < 2) {
    return "Comparable CO2 values are not available on visible product cards";
  }

  return null;
}

export function expectNamesSorted(names: string[], direction: SortDirection): void {
  const normalizedNames = names.map(normalizeName);
  const comparator = (left: string, right: string): number => left.localeCompare(right);

  if (direction === "asc") {
    expect(isMonotonicAscending(normalizedNames, comparator)).toBeTruthy();
    return;
  }

  expect(isMonotonicDescending(normalizedNames, comparator)).toBeTruthy();
}

export function expectPricesSorted(prices: number[], direction: SortDirection): void {
  const comparator = (left: number, right: number): number => left - right;

  if (direction === "asc") {
    expect(isMonotonicAscending(prices, comparator)).toBeTruthy();
    return;
  }

  expect(isMonotonicDescending(prices, comparator)).toBeTruthy();
}

export function expectCo2RatingsSorted(ratings: string[], direction: SortDirection): void {
  const normalizedRatings = ratings.map((rating) => rating.trim().toUpperCase());
  const comparator = (left: string, right: string): number => left.localeCompare(right);

  if (direction === "asc") {
    expect(isMonotonicAscending(normalizedRatings, comparator)).toBeTruthy();
    return;
  }

  expect(isMonotonicDescending(normalizedRatings, comparator)).toBeTruthy();
}
