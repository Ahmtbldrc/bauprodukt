# Swiss VFG Product Approval Scenario

### TL;DR

This document defines the backend approval workflow for Swiss VFG product data, focusing on scraping, waitlisting, and admin approval via utility processes. Live products remain visible until manual approval promotes waitlisted updates. The system enforces pricing and variant completeness rules and tracks all status changes—no UI or public API is included in this scope.

---

## Goals

### Business Goals

- Achieve ≥99% technical validation success rate across all scraped products.

- Reduce time-to-publish approved updates to under 24 hours from scrape.

- Maintain 0% of published products with discount price ≥ base price.

- Ensure 100% variant parity with the Swiss VFG source for products that have variants.

### User Goals

- Guarantee customers see accurate, approved product data at all times.

- Prevent price integrity issues by blocking invalid discounts before publication.

- Maintain complete variant coverage so users can purchase all available options.

- Ensure catalog stability by isolating unapproved changes from live listings.

### Non-Goals

- Building a UI or public API for admin review (handled in separate projects).

- Real-time automatic publishing without manual approval.

- Scraping of non-product content (e.g., marketing pages, reviews).

---

## User Stories

- Admin (Operations)

  - As an Admin, I want newly scraped or changed products to enter a waitlist, so that I can review and approve them before they go live.

  - As an Admin, I want to see differences between the current live version and the pending version, so that I can make accurate approval decisions.

  - As an Admin, I want rejected updates to be retained for audit, so that I can trace decision history.

- Data Engineer

  - As a Data Engineer, I want clear validation errors (e.g., discount price >= price, variant mismatch), so that I can quickly fix mapping or scraping issues.

  - As a Data Engineer, I want a deterministic status model, so that downstream jobs can be predictable and idempotent.

- Compliance Auditor

  - As an Auditor, I want a complete status history of each product, so that I can demonstrate controlled changes and approvals.

- Customer (Indirect)

  - As a Customer, I want consistent, accurate prices and variants, so that I can trust the offering and complete purchases without surprises.

---

## Functional Requirements

- Scraping & Detection (Priority: High) -- Source Fetching: Collect products from Swiss VFG source, capturing name, description, price, discount price, variants, availability, and identifiers. -- Change Detection: Compare scraped snapshot to the last approved version to determine new vs changed products. -- Changeable Check: Respect “changeable” flag; skip waitlisting for non-changeable items.

- Waitlisting & Status Management (Priority: High) -- Waitlist Creation: Insert or update a waitlist record with status waiting_approval for new/changed products. -- Live Preservation: Do not alter the active product record until approval. -- Status Transitions: Support transitions between waiting_approval → active | rejected | passive and track with timestamps and actor metadata.

- Validation & Business Rules (Priority: High) -- Price Validation: Enforce discount_price < price on all records; block approvals on violations. -- Variant Parity: If the Swiss VFG product has variants, our product must match number, attributes, and SKUs (where applicable). -- Required Fields: Enforce presence of name, price, currency, status, static brand ("VFG"), and primary identifiers.

- Admin Utility Actions (Priority: Medium) -- Approve Update: Promote waitlisted record to active; archive prior active as version history. -- Reject Update: Mark waitlisted record as rejected; retain live record unchanged. -- Passive State: Allow products to be marked passive (not visible) without deleting data.

- Logging, Metrics, and Reports (Priority: Medium) -- Validation Metrics: Log validation outcomes per product; compute technical success rate. -- Approval Metrics: Track approval/rejection counts, lead times, and backlog size. -- Audit Trail: Persist status history and diff summaries between versions.

---

## User Experience

- This project delivers backend utilities only. Admin review occurs via an external tool or database utility; end users are not directly interacting with this workflow.

### Product Approval Scenario Overview

- Purpose: Ensure that only validated, approved Swiss VFG product data becomes visible in the live catalog.

- Context: The pipeline separates scraping, waitlisting, and manual approval. Live data remains untouched until approval.

- Scope: Backend logic for scraping, waitlisting, validating, and status management. No UI or public API is included.

### Step 1: Scraping & Waitlisting

- The scraper fetches product data from Swiss VFG.

- For each product:

  - Determine if it’s new (no prior record) or changed (diff from last active).

  - If changeable:

    - Create/update a waitlist record with status waiting_approval.

    - Run validations (pricing rule, variant parity, required fields). Flag failures.

  - If non-changeable:

    - Do not create a waitlist entry; keep the live record unchanged.

- If a product already has an active version:

  - Keep the active version visible.

  - Store the new snapshot as a pending update in waiting_approval.

### Step 2: Admin Review Process

- Admin reviews waitlisted products using an external admin utility process (manual; not a UI/API in this project).

- Admin compares:

  - Current active record vs pending waitlisted record.

  - Validation results, including price rule and variant parity.

  - Diff of key fields (price, discount price, variants, availability, attributes).

- Admin decides to approve, reject, or mark passive as needed.

### Step 3: Approval or Rejection Actions

- Approve:

  - Transition waitlisted record to active.

  - Replace prior active as archived version (with full history).

  - Publish the new active version for end-user visibility.

- Reject:

  - Set waitlisted record to rejected.

  - Keep existing active record unchanged and visible.

- Passive:

  - Set product to passive when it should not appear in the catalog (e.g., discontinued).

  - Preserve historical records for audit.

### Step 4: Resulting Product States

- Status and visibility:

  - active: Visible to end users; represents the authoritative product version.

  - waiting_approval: Not visible; pending admin review.

  - rejected: Not visible; retained for audit and diagnostics.

  - passive: Not visible; can be reactivated via future approvals.

Table: States and Visibility

- active | Visible | Source of truth for customers

- waiting_approval | Hidden | Requires admin action

- rejected | Hidden | Audit only; no customer impact

- passive | Hidden | Delisted; can hold a pending update

### Example Approval Flow Diagram (Text)

- Scrape source → Detect new/changed → Is changeable?

  - No → Skip (keep current active as-is)

  - Yes → Create/Update waitlist (waiting_approval) → Run validations

    - Validation failure? → waiting_approval with errors → Admin review

    - Validation pass → waiting_approval → Admin review

- Admin decision:

  - Approve → Promote to active → Archive prior active → Visible

  - Reject → Mark as rejected → Keep current active visible

  - Mark passive → Product becomes passive (hidden)

### Key Principles & Business Rules

- Live products remain visible until approval; pending updates never affect the live catalog.

- Only approved products are published to end users.

- Non-changeable products are never overwritten by the scraper.

- All status changes are tracked with timestamps and actor metadata.

- Pricing rule: discount price must be strictly less than price.

- Variant rule: if the Swiss VFG product has variants, our product must match variant count and structure.

- Static brand is always set to “VFG” for all records in this scope.

**Entry Point & First-Time User Experience**

- Operators run the scraper and admin utility via internal processes or scheduled jobs.

- Configuration includes source credentials/URLs, throttling, and validation toggles.

**Core Experience**

- Step 1: Run scraper

  - Collect product data; normalize fields; attach static brand “VFG”.

  - Validate pricing and variant parity; log outcomes.

  - Write pending updates to waitlist with waiting_approval.

- Step 2: Review queue

  - Admin pulls a batch of waiting_approval records.

  - Admin compares active vs pending data and validation flags.

- Step 3: Decision

  - Approve: promote pending to active; archive prior active.

  - Reject: mark pending as rejected; capture reason.

  - Passive: set product to passive when needed.

- Step 4: Publish

  - Only active records are visible to end users (outside this backend scope).

**Advanced Features & Edge Cases**

- Duplicate detection: Handle products that merge/split SKUs between scrapes.

- Variant churn: If variants change shape (e.g., size to color-size), flag for manual review.

- Price format issues: Normalize currencies, decimal separators, and tax-inclusive vs tax-exclusive prices.

- Source outages: Retry with backoff; preserve prior active data.

- Anti-bot defenses: Respect crawl delays; handle HTML/structure changes gracefully.

**UI/UX Highlights**

- Not applicable; no UI is included in this project.

- Operational clarity via logs and metrics: clear error messages, correlation IDs, and diff summaries.

---

## Narrative

The merchandising team relies on timely updates from Swiss VFG, but direct publishing of scraped data risks exposing customers to mistakes—incorrect discounts, missing variants, or partial updates. To prevent this, the team adopts a controlled approval workflow. A backend scraper gathers product snapshots and, when it detects a new or changed item, places that version into a waitlist. The live product remains visible and untouched, preserving a stable customer experience.

An admin then reviews each waitlisted item using an internal utility process. The system provides clear validation signals: the discounted price must be lower than the base price, and any product with variants must exactly match the Swiss VFG variant structure. Differences between the live and pending versions are summarized for quick decisions. When the admin approves an item, the pending version becomes the new active record, and the prior version is archived for audit. Rejections are recorded with reasons, and non-changeable products are never overwritten.

As a result, customers see only validated, approved products; the business reduces catalog errors and accelerates time-to-publish without sacrificing control. The team gains a robust audit trail, consistent variant coverage, and price integrity, all while keeping the workflow lean and decoupled from UI concerns.

---

## Success Metrics

- Validation pass rate ≥ 99% across scraped products.

- 100% adherence to discount_price < price on all active products.

- 100% variant parity for products that have variants in Swiss VFG.

- Median approval lead time ≤ 24 hours from scrape to activation.

- Zero incidents of unapproved data affecting live listings.

### User-Centric Metrics

- Catalog error rate visible to customers: 0 critical incidents per month.

- Customer-facing variant completeness: 100% for products with variants.

- Customer support tickets related to pricing/variants: ≤ 1 per month.

### Business Metrics

- Reduction in manual rework due to bad publishes: ≥ 80%.

- Time-to-publish improvement vs baseline: ≥ 50%.

- SLA adherence for merchandising updates: ≥ 95% within 24 hours.

### Technical Metrics

- Discount price validation: 100% compliance on active products; <1% failures on waitlisted items.

- Variant completeness success rate: ≥ 99% across products with variants.

- Processing reliability: ≥ 99.9% job success rate across scrape and waitlist steps.

- Data integrity: 100% required field presence on active records.

- Error budget: <0.1% of products failing any validation without resolution within 48 hours.

### Tracking Plan

- product_scraped (product_id, timestamp, fields_count)

- product_change_detected (product_id, change_type: new|update)

- waitlist_created_or_updated (product_id, status: waiting_approval)

- validation_passed (product_id) / validation_failed (product_id, reason: price_rule|variant_mismatch|required_field_missing)

- admin_approved (product_id, from_status, to_status: active)

- admin_rejected (product_id, reason)

- product_activated (product_id, version_id)

- product_passivated (product_id)

- variant_parity_checked (product_id, parity: true|false, details)

- price_rule_checked (product_id, compliant: true|false)

---

## Technical Considerations

### Technical Needs

- Data ingestion: Scraper module to fetch and normalize Swiss VFG product data.

- Comparison engine: Diff pending snapshot against last active version.

- Validation engine: Pricing rule, variant parity, and required-field checks.

- Persistence: Product, Variant, Waitlist/Pending, and StatusHistory records.

- Admin utility hooks: Functions or scripts to approve, reject, or passivate items.

- Metrics & logging: Structured logs and counters for observability.

### Integration Points

- Swiss VFG source site or feed (read-only).

- External admin utility or data ops interface (manual process; out of scope for UI/API).

- Internal monitoring/alerting for job failures and validation anomalies.

### Data Storage & Privacy

- Store product data, variants, prices, and status history with immutable versioning.

- Limit PII collection (none expected); store only product catalog data.

- Maintain audit trails for all status transitions and admin actions.

### Scalability & Performance

- Expected volume: Up to tens of thousands of SKUs; daily scrapes.

- Target latency: Scrape and waitlist job completion within scheduled windows.

- Idempotency: Safe re-runs without duplicating waitlist entries.

- Backpressure: Queue-based or batched processing to handle spikes.

### Potential Challenges

- Source HTML/structure changes causing scraper breakage.

- Currency and tax normalization across products.

- Complex variant structures requiring robust reconciliation.

- Anti-bot and rate limiting from the source.

- Ensuring deterministic merges when SKUs split or consolidate.

---

## Milestones & Sequencing

- Phase 1: Scraper & Normalization (1 week)

  - Key Deliverables: Engineering—scrape Swiss VFG, normalize fields, static brand assignment.

  - Dependencies: Source access, sample data.

- Phase 2: Waitlist & Validation (1 week)

  - Key Deliverables: Engineering—waitlist model, status transitions, pricing and variant validation, logging.

  - Dependencies: Phase 1 data structures.

- Phase 3: Admin Utility Actions & Metrics (0.5–1 week)

  - Key Deliverables: Engineering—approve/reject/passivate scripts, metrics counters, audit history.

  - Dependencies: Phases 1–2.

### Project Estimate

- Small: 1–2 weeks for MVP; up to 2.5–3 weeks including metrics and hardening.

### Team Size & Composition

- Small Team: 1–2 total people

  - Product/Tech Lead (1): Requirements, architecture, implementation.

  - Support Engineer (optional, 0–1): Testing, metrics, and ops scripts.

### Suggested Phases (Example for Medium Project - remember to propose a smaller team and simpler phases, you tend to overestimate the team size and timeline. Use a lean startup mentality.)

\*\* Foundation & Scraper (1 week)\*\*

- Key Deliverables: Engineer—scraper, normalization, static brand “VFG”.

- Dependencies: Access to Swiss VFG source.

\*\* Waitlist, Validation & Statuses (1 week)\*\*

- Key Deliverables: Engineer—waitlist, validation rules (price/variants), status transitions, status history.

- Dependencies: Foundation & Scraper.

\*\* Admin Utilities & Metrics (0.5–1 week)\*\*

- Key Deliverables: Engineer—approve/reject/passivate utilities, logs/metrics, reports.

- Dependencies: Waitlist, Validation & Statuses.
