# Payment System with Stripe & DataTrans Integration

### TL;DR

Enable secure, provider-hosted online payments by integrating Stripe Checkout and DataTrans Payment Page (including Twint) into the existing e-commerce flow. Customers choose their preferred provider, are redirected to complete payment, and are returned to the site with clear success or failure outcomes. This solution targets logged-in customers in German-speaking markets and prioritizes compliance, reliability, and a streamlined user experience without storing card data.

---

## Goals

### Business Goals

- Achieve a payment success rate of ≥ 90% for authorized transactions within the first month post-launch.

- Support at least two providers (Stripe, DataTrans) and three methods (cards, wallets via Stripe, Twint via DataTrans) at launch.

- Reduce checkout drop-off by 15% compared to invoice/manual flows (baseline to be captured).

- Ensure 99.9% availability of payment initiation and webhook processing (measured monthly).

### User Goals

- Let customers choose their preferred payment provider (Stripe or DataTrans) with minimal friction.

- Offer familiar, trusted methods: cards and wallets (Apple Pay/Google Pay) via Stripe, and Twint via DataTrans.

- Provide clear, German-language guidance and error feedback on success, cancellation, or failure.

- Complete payment quickly and securely without entering card data on our site.

### Non-Goals

- No custom payment forms or card data storage on our servers (provider-hosted only).

- No refunds, partial captures, or cancellations in v1 (these will be handled manually in provider dashboards).

- No analytics or reporting dashboards in v1 (tracked events only, no UI).

---

## User Stories

Personas:

- Customer (authenticated)

- System (automation/webhook processor)

Customer

- As a Customer, I want to select a payment provider (Stripe or DataTrans), so that I can use my preferred payment method.

- As a Customer, I want to pay with Twint (via DataTrans), so that I can use a familiar local method.

- As a Customer, I want a clear success page after payment, so that I know my order is confirmed.

- As a Customer, I want a clear failure/cancellation page with guidance, so that I can retry or choose an alternative provider.

- As a Customer, I want the checkout in German, so that I fully understand each step.

System

- As the System, I want to create an order before redirecting to the provider, so that I can track payment attempts reliably.

- As the System, I want to process provider webhooks idempotently, so that order status remains correct even if events are retried.

- As the System, I want to store minimal provider metadata (intent/session IDs), so that I can reconcile and troubleshoot payments securely.

- As the System, I want to create a corresponding transaction in Infoniqa ONE 200 after a successful payment, so that financial records are synchronized.

---

## Functional Requirements

- Provider Selection & Methods (Priority: P0)

  - Provider toggle: Show Stripe and DataTrans options on the checkout step.

  - Method support: Enable cards and wallets (Apple Pay/Google Pay) via Stripe Checkout, Twint via DataTrans.

  - Availability logic: If a provider is misconfigured/unavailable, disable it with tooltip explaining why.

- Order Creation (Priority: P0)

  - Draft order: Create an order with status=pending before redirecting to any provider.

  - Price/Stock validation: Validate cart prices and stock at the moment of order creation.

  - Notifications: No emails are sent on order creation. Notifications are triggered only after successful payment.

  - Clarification: Order creation happens before payment; Infoniqa integration is not triggered at this stage.

- Payment Session Handling (Priority: P0)

  - Session creation: Create a provider session (Stripe Checkout Session or DataTrans transaction) server-side using the draft order data.

  - Redirect URLs: Provide success and cancel/failure return URLs carrying orderId and provider context.

  - Session persistence: Store provider_session_id / transaction_id and currency on the order.

- Webhooks & State Sync (Priority: P0)

  - Stripe webhook: Handle checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed, and session.expired.

  - DataTrans webhook/callback: Handle success/failure/timeout callbacks and verify signatures (HMAC).

  - Idempotency: Ensure each webhook updates order state once, even if delivered multiple times.

  - Status mapping: Map provider outcomes to internal payment_status and order status.

- Post-Payment ERP Sync: Infoniqa ONE 200 (Priority: P0)

  - Trigger: After a successful payment (Stripe or DataTrans) and internal update to payment_status=paid, create a corresponding transaction in Infoniqa ONE 200 via its REST API.

  - Authentication: Authenticate to Infoniqa via Auth0.

  - Required fields sent to Infoniqa: order number; customer details (name, email, address); payment amount; payment provider; payment status; transaction date/time.

  - Error handling: If the Infoniqa API call fails, log the error and flag the order for manual reconciliation without blocking customer confirmation.

  - Idempotency: Use the order number as a unique external reference to prevent duplicate transactions on retries.

- Error Logging & Failure Handling (Priority: P0)

  - Error store: Persist payment errors with provider, orderId, code, message, raw payload, and correlation ID.

  - Infoniqa errors: Persist Infoniqa API errors with request/response context; set infoniqa_sync_status=failed and requires_manual_reconciliation=true.

  - Failure page: Redirect users to a failure page on cancel/error with a user-friendly German message and retry options.

  - Admin surfacing: Persist logs for an external admin UI document (UI itself out of scope for this PRD).

- Localization (Priority: P0)

  - German-only: All customer-facing texts, buttons, and pages in German.

- Security & Compliance (Priority: P0)

  - Provider-hosted pages only; no card data on our servers.

  - Verify webhook signatures (Stripe signing secret; DataTrans HMAC).

  - Use HTTPS everywhere, secure env vars, and least-privilege keys.

  - Infoniqa: Use Auth0 for obtaining access tokens; store only necessary Infoniqa identifiers.

- Testing & Sandbox (Priority: P0)

  - Sandbox credentials: Configure and use provider test accounts.

  - Test cases: Cover success, cancellation, failure, and delayed webhooks for both providers.

  - Infoniqa: Add tests for successful sync, idempotent retry, and simulated API failure paths.

- Notifications (Priority: P1)

  - Order completed (post-payment): After verified payment success, automatically send order confirmation emails to (a) the customer and (b) Swiss VFG.

  - Delivery method: Send all notification emails via SMTP with TLS and authentication.

  - Swiss VFG email content: Include all order details required for fulfillment (order number, customer details including address, full product list with quantities and identifiers, totals, payment status=paid, and provider/transaction reference if available) since products are sourced from their website via scraping.

  - Content requirements (both emails): Must include order number, customer details, product list, and payment status; emails are in German.

  - Triggers & idempotency: Post-payment emails trigger exactly once upon transition to payment_status=paid (idempotent against webhook retries).

  - Reliability: Email sending must not be blocked by Infoniqa sync outcomes; failures are logged and retried asynchronously without blocking customer UX.

  - Optional failure notice: Payment failure email remains optional; if implemented, send with retry guidance and alternative options (no links to external assistance). Not required for v1.

---

## User Experience

Entry Point & First-Time User Experience

- Entry: From cart summary (e.g., “Zur Kasse” in CartSummary), authenticated users proceed to /checkout.

- Requirements: If not authenticated, redirect to /login?redirect=/checkout (already implemented).

- Onboarding: No tutorial; provide concise helper text in German on the provider selection step.

Core Experience

- Step 1: Provider selection on /checkout.

  - UI: Two prominent cards/buttons: “Stripe (Kredit-/Debitkarte, Apple Pay, Google Pay)” and “DataTrans (TWINT)”.

  - Validation: If no provider selected, disable “Weiter zur Zahlung”.

  - On select: Show short description and trust badges; clearly indicate redirect to a secure external page.

- Step 2: Create draft order and payment session.

  - Backend: POST /api/orders (draft) to create order with status=pending.

  - Backend: POST /api/payments/{provider}/session to create provider session and return redirect_url.

  - UI: Loading state with clear text: “Wir leiten Sie sicher zur Zahlung weiter …”.

- Step 3: Redirect to provider-hosted checkout page.

  - Stripe Checkout or DataTrans Payment Page opens; user completes payment.

  - Wallet availability: Stripe Checkout dynamically shows Apple Pay/Google Pay where eligible.

- Step 4: Return to success or failure page.

  - Success URL: /checkout/success?orderId=&provider=.

    - UI: “Vielen Dank! Ihre Zahlung war erfolgreich. Bestellnummer: .”

    - State: Show order summary (items, totals) and payment method used.

    - Emails (post-payment): After verified success (via webhook or verified API check), automatically send:

      - Final order confirmation email to the customer (payment status=paid) via SMTP.

      - Fulfillment email to Swiss VFG via SMTP containing all order details (order number, customer details including address, product list with quantities and identifiers, totals, and payment status=paid). Infoniqa sync runs in the background and does not block these emails.

  - Failure/Cancel URL: /checkout/failure?orderId=&provider=&code=.

    - UI: Friendly German copy explaining what went wrong and options to retry or choose another provider.

    - CTA: “Erneut versuchen” and “Anderen Zahlungsanbieter wählen”.

- Step 5: Webhook finalization and reconciliation.

  - If the success page loads before webhook arrival, show “Zahlung wird verarbeitet …” and poll backend for status for up to 30–60 seconds.

  - On webhook confirmation: Update UI to “erfolgreich” state and send post-payment emails (customer + Swiss VFG) via SMTP idempotently.

  - After payment is marked paid: Trigger Infoniqa ONE 200 transaction creation asynchronously; failures are logged and orders flagged for manual reconciliation.

Advanced Features & Edge Cases

- Webhook delays: Success page shows processing until webhook confirms; if no confirmation within timeout, display instructions and log a warning.

- Double-clicks / re-creation: Use idempotency keys on session creation to avoid duplicate sessions.

- Abandoned sessions: If a session expires, set payment_status=expired and allow user to retry.

- Partial/provider mismatch: If the user returns with cancel status, keep order pending and allow switching providers without creating a new order (reuse order if items/prices unchanged).

- Stock changes mid-payment: If stock goes out during payment, handle via failure path with a clear message; allow cart edit and retry.

UI/UX Highlights

- German copy for all labels and messages.

- Trust indicators for providers; clear explanation of redirection to secure pages.

- Accessibility: Keyboard navigable provider selection, sufficient color contrast, focus states.

- Error content design: Provide actionable next steps (retry, alternative provider).

- Mobile responsiveness: Buttons and touch targets optimized for small screens.

---

## Narrative

Lena legt mehrere Produkte in den Warenkorb und klickt auf “Zur Kasse”. Auf der Checkout-Seite wählt sie ihren bevorzugten Zahlungsanbieter: Stripe für Kreditkarte und Wallets oder DataTrans für TWINT. Sie entscheidet sich für TWINT, da sie es täglich nutzt.

Im Hintergrund erstellt das System sofort eine Bestellung mit dem Status “ausstehend” und initialisiert eine sichere Zahlungssitzung bei DataTrans. Lena wird nahtlos auf die DataTrans-Zahlungsseite weitergeleitet, wo sie die Zahlung mit wenigen Schritten bestätigt. Anschließend wird sie zurück zur Erfolgsseite geführt. Dort sieht sie eine klare Bestätigung auf Deutsch inklusive Bestellnummer und Zusammenfassung ihrer Produkte. Kurz darauf erhält sie die Bestellbestätigung per E-Mail (versendet per SMTP).

Nach der erfolgreichen Zahlung erstellt das System automatisch einen entsprechenden Finanzvorgang in Infoniqa ONE 200. Sollte dieser Schritt fehlschlagen, wird der Fehler protokolliert und die Bestellung für eine manuelle Nachbearbeitung markiert – ohne dass dies die Kundenerfahrung beeinträchtigt.

Hätte die Zahlung nicht funktioniert, wäre Lena auf eine gut verständliche Fehlerseite geleitet worden. Diese hätte ihr erklärt, was schiefging, und Optionen angeboten, den Vorgang zu wiederholen oder alternativ Stripe zu wählen. Alle technischen Details des Fehlers sind sicher protokolliert und später in einem separaten Admin-Interface abrufbar.

Am Ende profitiert Lena von einem schnellen, vertrauenswürdigen und lokalen Zahlungsprozess. Das Unternehmen profitiert von höheren Abschlussraten, klarer Fehlerkommunikation und einem robusten, konformen Zahlungs-Backbone, das zuverlässig mit den Anbietern synchronisiert und Finanztransaktionen automatisiert an Infoniqa ONE 200 übergibt.

---

## Success Metrics

- Payment success rate ≥ 90% for initiated sessions (provider-reported).

- Checkout completion uplift ≥ 15% vs. baseline.

- Webhook processing success ≥ 99.9% (no missed/failed events after retries).

- Error rate for payment session creation ≤ 1% of attempts.

- Median time from payment completion to order confirmation ≤ 10 seconds.

### User-Centric Metrics

- Provider selection-to-redirect time (median) ≤ 2 seconds.

- Failure page bounce rate; retry rate after failure ≥ 30%.

- Customer-reported payment issues per 1,000 orders ≤ 3.

### Business Metrics

- Share of Twint payments in CH market segment ≥ 25% (if applicable).

- Gross payment volume processed via online payments vs. manual invoicing.

- Decline reasons distribution to inform future optimizations.

### Technical Metrics

- API uptime (payment initiation, status polling) ≥ 99.9%.

- Webhook latency (receipt to state update) p95 ≤ 5 seconds.

- Idempotency collisions or duplicate order confirmations = 0.

- Infoniqa sync success rate ≥ 99.5% of paid orders with automatic retry logic.

- Infoniqa sync latency (from order paid to Infoniqa transaction creation) p95 ≤ 60 seconds.

### Tracking Plan

- payment_provider_viewed (provider options displayed)

- payment_provider_selected (provider: stripe|datatrans)

- payment_order_created (orderId, amount, items_count)

- payment_session_created (provider, session_id/transaction_id)

- payment_redirect_started (provider)

- payment_returned_success (provider, orderId)

- payment_returned_failure (provider, orderId, code)

- payment_webhook_received (provider, event_type)

- payment_status_updated (orderId, from, to)

- payment_error_logged (provider, code, severity)

- infoniqa_sync_started (orderId, amount, provider)

- infoniqa_sync_succeeded (orderId, infoniqa_transaction_id)

- infoniqa_sync_failed (orderId, error_code)

---

## Technical Considerations

### Technical Needs

- Front-end

  - Provider selection UI on /checkout (German copy).

  - Success page /checkout/success and failure page /checkout/failure with status polling capability.

- Back-end (Next.js API routes)

  - Order creation endpoint that supports draft creation (no emails sent at this stage).

  - Payment session endpoints:

    - POST /api/payments/stripe/session → creates Stripe Checkout Session.

    - POST /api/payments/datatrans/session → initializes DataTrans transaction and returns redirect URL/token.

  - Webhooks:

    - POST /api/webhooks/stripe

    - POST /api/webhooks/datatrans

  - Status polling:

    - GET /api/orders/{orderId} returns latest status (already exists; ensure payment fields included).

  - Post-payment notifications:

    - Enqueue and send customer and Swiss VFG emails upon transition to payment_status=paid (idempotent) via SMTP.

    - Use SMTP with TLS and auth; queue retries for transient SMTP failures.

  - Post-payment ERP sync:

    - Background worker or async job to create Infoniqa ONE 200 transaction after order is paid.

    - Expose POST /api/integrations/infoniqa/sync (internal-only) for manual retry if needed.

- Data model (Supabase)

  - orders table (add fields)

    - payment_provider: text (stripe|datatrans|null)

    - payment_status: text (pending|processing|paid|failed|cancelled|expired)

    - currency: text (default CHF; configurable)

    - provider_session_id: text (Stripe Checkout Session ID or DataTrans transaction ref)

    - provider_payment_id: text (Stripe Payment Intent ID or equivalent)

    - infoniqa_sync_status: text (pending|success|failed|null)

    - infoniqa_transaction_id: text (nullable)

    - requires_manual_reconciliation: boolean (default false)

    - infoniqa_last_error: text (nullable; sanitized)

    - paid_at: timestamptz (when payment confirmed; used for Infoniqa transaction timestamp)

  - payment_events table (new)

    - id, order_id, provider, event_type, status_before, status_after, code, message, raw_payload (jsonb), created_at

  - payment_errors table (new; optional if using payment_events with severity)

    - id, order_id, provider, code, message, context (jsonb), created_at

  - payment_sessions table (optional)

    - id, order_id, provider, session_id, amount, currency, expires_at, created_at

### Integration Points

- Stripe

  - Use server-side SDK/REST to create Checkout Session with success_url and cancel_url.

  - Webhook signature verification; handle checkout.session.completed and related events.

  - Wallets (Apple Pay/Google Pay) are supported within Stripe Checkout; no domain verification needed when using hosted Checkout.

- DataTrans

  - Initialize transaction via REST; redirect user to DataTrans payment page.

  - Support Twint via DataTrans configuration.

  - Validate callback/HMAC; map transaction outcomes to internal statuses.

- Infoniqa ONE 200

  - Purpose: Create a corresponding financial transaction in Infoniqa after successful payment.

  - Authentication: Obtain access token via Auth0; securely store client credentials and audience/issuer.

  - Trigger: On internal transition to payment_status=paid (via webhook), enqueue a job to call Infoniqa.

  - Fields sent (minimum):

    - order number

    - customer name, email, address

    - payment amount and currency

    - payment provider (stripe|datatrans)

    - payment status (paid)

    - transaction date/time (paid_at, UTC)

  - Idempotency: Use order number as external reference; on duplicate response, treat as success.

  - Error handling: On non-2xx/timeout, log structured error, set infoniqa_sync_status=failed, requires_manual_reconciliation=true, and retain last error message.

  - Retry strategy: Exponential backoff with max attempts (e.g., 3); manual retry endpoint (internal-only).

  - Security: Do not include sensitive PII beyond required fields; redact tokens in logs.

### SMTP Email Delivery

- Delivery method: SMTP for all notification emails (customer and Swiss VFG) sent only after successful payment.

- Security: Enforce TLS; authenticate with SMTP credentials; do not send emails over unsecured connections.

- Configuration (environment variables):

  - SMTP_HOST

  - SMTP_PORT

  - SMTP_USERNAME

  - SMTP_PASSWORD

  - SMTP_SECURE (true/false; prefer true/STARTTLS)

  -

  - SMTP_FROM_NAME (e.g., “Bestellung”)

- Reliability:

  - Queue emails for async dispatch; implement retry with exponential backoff on transient failures.

  - Ensure idempotent send keyed on orderId + template to prevent duplicates.

  - Log delivery outcomes (accepted/rejected) and store last error for diagnostics.

### Infoniqa ONE 200 Integration Details

- API Access

  - Auth: Auth0 OAuth2 client credentials flow to retrieve access tokens for Infoniqa ONE 200 REST API.

  - Secrets: Store AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_AUDIENCE, AUTH0_TOKEN_URL, INFONIQA_API_BASE securely.

  - Scope: Limit to necessary permissions for transaction creation.

- Data Mapping

  - Order number → external reference/document number

  - Customer

    - name → customer.name

    - email → customer.email

    - address → customer.address (street, postal code, city, country)

  - Payment

    - amount, currency → totals

    - provider → paymentMethod/provider

    - status → paid

    - transaction date/time → posted/booking date (paid_at)

  - Optional extensions (future): tax breakdown, line items, internal notes with provider_payment_id

- Processing Flow

  1. Webhook marks order payment_status=paid and sets paid_at.

  2. Background job composes Infoniqa payload with required fields.

  3. Obtain Auth0 token; call Infoniqa endpoint to create transaction.

  4. On success: Save infoniqa_transaction_id; set infoniqa_sync_status=success.

  5. On error: Log details; set infoniqa_sync_status=failed and requires_manual_reconciliation=true.

- Observability

  - Emit events: infoniqa_sync_started, infoniqa_sync_succeeded, infoniqa_sync_failed.

  - Include correlation IDs across webhook handling and Infoniqa calls for traceability.

### Data Storage & Privacy

- PII stored as per existing order schema; no cardholder data stored.

- Store only provider IDs, status, and minimal metadata needed for reconciliation.

- Store minimal Infoniqa identifiers (transaction ID and sync status).

- Log payloads securely; redact tokens and PII where unnecessary.

- Comply with GDPR and Swiss data protection by limiting data scope and access.

### Scalability & Performance

- Expect bursts of concurrent sessions; design webhooks to be idempotent and fast.

- Use database indexes on orders.payment_status, orders.provider_session_id for quick lookups.

- Email timing: Send post-payment emails only after payment success is confirmed by webhook (idempotent, queued for retry) via SMTP.

- Run Infoniqa sync asynchronously to avoid blocking customer flows; implement retries with backoff.

### Potential Challenges

- Webhook delays or out-of-order events: Use event creation time and idempotent updates.

- Session expiry and user cancellations: Provide clear retry flows and allow provider switching.

- Stock/pricing drift between cart and order: Lock prices/stock at order creation; reject payment if inconsistencies are detected upon webhook.

- DataTrans configuration nuances for Twint and HMAC validation; ensure correct credentials per environment.

- Email timing and deliverability: Post-payment-only notifications (customer + Swiss VFG) must avoid duplicates and respect state transitions; monitor SMTP delivery health.

- Infoniqa connectivity/authentication via Auth0 (token expiration, scopes) and API timeouts; ensure robust retry and manual reconciliation path.

- Field mapping differences between our schema and Infoniqa; validate required fields and formats.

---

## Milestones & Sequencing

### Project Estimate

- Medium: 2–4 weeks total (including integration, QA, and launch).

### Team Size & Composition

- Small Team: 2 people

  - 1 Full-stack Engineer (backend-first, also handles minimal frontend)

  - 1 Product/QA (writes acceptance criteria, test plans, and performs UAT)

### Suggested Phases

**Phase 1: Setup & Schema (2–3 days)**

- Key Deliverables: Engineer — Environment variables, secrets management, database migrations for payment fields/tables, provider test accounts configured.

- Dependencies: Stripe and DataTrans sandbox accounts, Supabase migrations.

**Phase 2: Order Draft & Payment Session (2–3 days)**

- Key Deliverables: Engineer — Adjust /api/orders to support draft creation; ensure GET /api/orders/{id} returns payment fields; implement /api/payments/{provider}/session endpoints.

- Dependencies: None beyond Phase 1.

**Phase 3: Stripe Checkout Integration (3–4 days)**

- Key Deliverables: Engineer — POST /api/payments/stripe/session, success/cancel URLs, Stripe webhook with signature verification, status mapping, idempotency keys, tests with cards and wallets.

- Dependencies: Publicly reachable webhook endpoint (ngrok or staging domain).

**Phase 4: DataTrans + Twint Integration (3–4 days)**

- Key Deliverables: Engineer — POST /api/payments/datatrans/session, redirect/token handling, HMAC signature validation, callback/webhook endpoint, status mapping, Twint payment tests.

- Dependencies: DataTrans sandbox credentials, Twint enabled in the merchant account.

**Phase 5: Infoniqa ONE 200 Integration (2–3 days)**

- Key Deliverables: Engineer — Auth0 client credentials flow; background job to create transactions in Infoniqa after order is paid; payload mapping; idempotent retries; error logging and manual reconciliation flagging.

- Dependencies: Infoniqa ONE 200 API access, Auth0 credentials, clarified endpoint for transaction creation.

**Phase 6: Post-Payment Notifications (1–2 days)**

- Key Deliverables: Engineer — Implement SMTP-based email dispatch after payment_status=paid to customer and Swiss VFG; idempotent triggers; retry queue; German templates.

- Dependencies: Webhook finalization from Phases 3–4.

**Phase 7: Frontend UX & Localization (2–3 days)**

- Key Deliverables: Engineer — Provider selection UI on /checkout, German copy, success/failure pages with status polling and retry flows.

- Dependencies: Backend session endpoints from Phases 3–4.

**Phase 8: Error Logging & Observability (1–2 days)**

- Key Deliverables: Engineer — Persist payment_events/errors, correlation IDs, structured logs; expose minimal read APIs for future admin UI.

- Dependencies: Database tables from Phase 1.

**Phase 9: QA, UAT, and Launch (3–5 days)**

- Key Deliverables: Product/QA — Test plan execution (success, cancel, failure, delayed webhooks), cross-browser/mobile tests, sandbox to production key switch checklist; Engineer — bug fixes and go-live. Include Infoniqa sync test cases, email idempotency, and manual retry scenarios.

- Dependencies: All prior phases complete; test cards, Twint sandbox flows, Infoniqa sandbox.

---

## Additional Details

### Status Mapping (examples)

- Stripe: checkout.session.completed → payment_status=paid → order.status=paid → send post-payment emails (customer + Swiss VFG via SMTP) → enqueue Infoniqa sync job.

- Stripe: payment_intent.payment_failed or session.expired → payment_status=failed/expired → order.status=pending (allow retry) → log error.

- DataTrans: success callback (OK) → payment_status=paid → order.status=paid → send post-payment emails (customer + Swiss VFG via SMTP) → enqueue Infoniqa sync job.

- DataTrans: failure/timeout callback → payment_status=failed/expired → order.status=pending → log error, show failure page.

### Return URL Structure

- Success: /checkout/success?orderId={id}&provider={stripe|datatrans}

- Cancel/Failure: /checkout/failure?orderId={id}&provider={stripe|datatrans}&code={reason}

### Acceptance Criteria (samples)

- Users can select Stripe or DataTrans on /checkout and are redirected within 2 seconds.

- Upon successful payment, orders are marked paid and post-payment emails are sent via SMTP to the customer and Swiss VFG. The Swiss VFG email contains full order details for fulfillment.

- Upon successful payment, a corresponding transaction is created in Infoniqa ONE 200 using Auth0 authentication with the required fields:

  - order number

  - customer details (name, email, address)

  - payment amount

  - payment provider

  - payment status

  - transaction date/time

- No emails are sent upon order creation (status=pending); notifications are triggered only after payment success.

- Infoniqa sync runs asynchronously and does not block the success page or emails.

- If the Infoniqa API call fails, the error is logged, infoniqa_sync_status=failed is set, and the order is flagged for manual reconciliation.

- Upon cancellation/failure, users see a German failure page with retry options; order remains pending.

- All webhook events are verified and idempotent; duplicate events do not duplicate emails, state changes, or Infoniqa transactions.

- Payment and Infoniqa errors are persisted with sufficient context to troubleshoot without relying on third-party dashboards.
