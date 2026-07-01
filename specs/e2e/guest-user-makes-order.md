# Guest User Makes Order E2E Journey

## Goal

Verify that a guest user can browse a product, add it to cart, proceed through guest checkout, complete a deterministic test payment flow, and reach a stable order confirmation state.

## Journey Summary

An anonymous user opens the storefront, selects an in-stock product, adds it to cart, continues as guest through checkout billing, pays with Cash on Delivery through the application’s internal payment check, and sees order confirmation with an invoice number.

## Business Value

This journey validates the core revenue path end-to-end across catalog, cart, guest checkout, billing, payment, and order confirmation. Lower-level API/UI coverage cannot prove this full browser journey and persisted order outcome together.

## E2E Boundary

Covered by E2E:
- guest storefront to product selection through UI;
- add to cart and cart review through UI;
- guest checkout identity step through UI;
- billing address step through UI;
- deterministic Cash on Delivery payment and order confirmation through UI.

Not covered by E2E:
- product catalog sorting, filtering, and search behaviors;
- cart and checkout API contract/schema validation;
- checkout field-level validation matrices and negative permutations;
- visual checkpoint coverage.

## Entry Point

Anonymous user on storefront landing page (`/`) with no authenticated session and empty cart.

## Expected Outcome

User completes guest checkout and sees the order confirmation container with a success message and generated invoice number.

## Determinism Guarantees

- Payment uses **Cash on Delivery** (`cash-on-delivery`) with empty `payment_details`; no card fields, no bank fields, and no third-party payment redirect.
- Payment is validated only through the application’s internal `POST /payment/check` mock endpoint (default API URL). There is no 3DS, captcha, or external payment provider interaction.
- Billing address uses deterministic postcode lookup input: country `Netherlands (the)`, postal code `1234AA`, house number `42`. Street, city, and state are auto-filled by the built-in postcode lookup driver.
- Product selection uses the first visible in-stock product card on the catalog (exclude cards showing `Out of stock`).
- Guest identity uses generated unique email plus fixed first/last name values for the scenario.
- Checkout step order is stable: Cart → Sign in (guest) → Billing Address → Payment → Confirmation.
- Final confirmation is rendered in a stable `#order-confirmation` container after invoice creation.

## Final Assertion Marker

Primary markers for final journey success:

- `#order-confirmation` container is visible on `/checkout` after payment confirmation.
- Confirmation text matches: `Thanks for your order! Your invoice number is <invoice_number>.`
- Invoice number in confirmation text matches pattern `INV-` followed by digits (example contract shape: `INV-2022000002`).

Supporting readiness markers during the flow (not final assertion):

- Cart step: `data-test="cart-total"` is visible before proceeding.
- Guest step: guest continuation summary text is visible after guest submit.
- Payment step: `data-test="payment-method"` is set to `cash-on-delivery` before `data-test="finish"` is clicked.

## Data Strategy

- Product: select first in-stock product at runtime from storefront catalog; do not use products marked `Out of stock`.
- Guest identity: generate unique email; use deterministic guest names (`Guest`, `Buyer`).
- Billing address: use deterministic lookup values (`Netherlands (the)`, `1234AA`, `42`) and accept auto-filled street/city/state from postcode lookup.
- Payment: use `cash-on-delivery` only for this E2E journey.

## Setup / Preconditions

- Start from anonymous browser session on demo/training environment (`PRACTICE_TESTING_URL`).
- No API shortcut for business actions. Browse, add to cart, guest checkout, billing, payment, and confirmation must remain visible UI steps.
- API may be used only for optional cleanup support, not to replace cart/checkout/payment actions.

## Cleanup Strategy

Cleanup is not required.

Reason: guest orders are disposable training data in the demo environment. Each run uses a unique guest email and isolated cart/order state, so parallel runs do not depend on shared mutable accounts.

## External Dependencies And Blockers

External dependencies:

- storefront UI at `PRACTICE_TESTING_URL`;
- internal payment check API at default `API_BASE_URL` `/payment/check` (mock, in-app);
- internal postcode lookup for billing autofill.

Blockers: none.

Required unblockers: none.

## Status

- ready to implement now

## Implementation Target

Test location:
- tests/e2e/checkout/guest-user-makes-order.e2e.spec.ts

Tags:
- @e2e
- @regression

## Implementation Notes

- Keep the full business flow visible in UI `test.step` phases.
- Use Cash on Delivery as the only payment method for this journey.
- Do not replace cart, guest checkout, billing, or payment actions with API calls.
- Reuse existing `ProductsPage` where possible; add checkout page objects only as needed for cart/checkout/payment steps.
- Key UI contracts for implementation:
  - `data-test="add-to-cart"`
  - `data-test="proceed-1"`
  - guest tab + `data-test="guest-email"`, `guest-first-name`, `guest-last-name`, `guest-submit`
  - `data-test="proceed-2-guest"`
  - `data-test="country"`, `postal_code`, `house_number`, `proceed-3`
  - `data-test="payment-method"` value `cash-on-delivery`, then `data-test="finish"`
  - final assertion on `#order-confirmation` with invoice confirmation text
- Assert meaningful final outcome (confirmation container + invoice message), not URL change alone.
