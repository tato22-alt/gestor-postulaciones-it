# Project Status

## Purpose

This file records the current implementation state of the IT Job Search Assistant.

Permanent engineering rules belong in `AGENTS.md`.

Product overview and setup information belong in `README.md`.

Domain concepts and relationships belong in `docs/domain-model.md`.

The actual repository remains the final source of truth.

## Current Milestone

Manual opportunity creation, local persistence, the data-driven dashboard, same-origin cross-tab synchronization, search, status filtering, opportunity editing, and explicit opportunity status management are implemented, audited, committed, and published on `main`.

Opportunity deletion — permanent removal from any status, protected by an explicit confirmation dialog and optimistic-concurrency detection — is implemented, audited, committed, and published on `main`.

The application tracking milestone (explicit application registration from an opportunity and application status management) is implemented and verified on the `feature/application-tracking` branch, pending Luciano's review before merging into `main`.

The UX pass milestone (accent-insensitive search, success feedback, created-under-filter notice, focus management, and Escape to close the form) is implemented and verified. An automated unit-test suite based on the native `node:test` runner was added without new dependencies.

The application can create and edit opportunities, persist them in the current browser origin, rehydrate domain instances after reload, recover safely when stored data is invalid, derive honest metrics from the complete collection, synchronize valid storage changes between same-origin tabs, and derive a visible subset from temporary search and status criteria.

## Implemented

### Technical foundation

* React;
* Vite;
* JavaScript;
* plain CSS;
* Git;
* GitHub remote configuration;
* component-based interface;
* responsive layout.

### Domain model

The object-oriented domain model includes:

* `CandidateProfile`;
* `JobSearchPreferences`;
* `CompanySource`;
* `JobOpportunity`;
* `MatchResult`;
* `Application`.

Controlled domain options are centralized for source statuses, opportunity statuses, application statuses, modalities, employment types, requirement policies, recommendations, salary periods, and notification channels.

### Manual opportunity creation

The current flow supports:

* opening the manual opportunity form;
* canceling the form;
* controlled inputs;
* Spanish validation messages;
* required company, title, and URL fields;
* HTTP/HTTPS URL allowlisting;
* whitespace normalization;
* optional location;
* optional modality;
* optional employment type;
* optional publication date;
* optional description;
* actual `new JobOpportunity(...)` creation;
* domain-generated identifiers;
* domain-generated timestamps;
* immutable React state updates;
* one or multiple opportunity cards;
* immediate dashboard updates after accepted creation;
* conditional optional-field rendering;
* safe external links;
* safe React text rendering.

### Quality corrections

The completed QA review confirmed and corrected:

* horizontal overflow caused by long unbroken company names;
* horizontal overflow caused by long unbroken titles;
* stale documentation about the functional milestone;
* an obsolete unused form component.

The interface has been checked at representative desktop and mobile widths.

Long descriptions and malicious-looking text remain safely contained and rendered as text.

### Local opportunity persistence

The current working tree supports:

* an isolated `LocalStorageOpportunityRepository`;
* dependency injection of the browser storage adapter;
* a stable namespaced storage key;
* a versioned persistence envelope;
* full-collection immutable saves after accepted creation;
* strict validation of the parsed envelope and every opportunity record;
* reconstruction of real `JobOpportunity` instances;
* preservation of identifiers, timestamps, status, optional fields, arrays, and `null` values;
* safe handling of missing storage;
* safe handling of malformed JSON and unsupported versions;
* safe handling of read and write failures;
* preservation of corrupted stored data without automatic overwrite;
* a visible, semantic storage warning;
* shared HTTP/HTTPS URL validation for form and repository boundaries.

The reported reload issue was reproduced as an origin mismatch rather than a repository defect. `http://127.0.0.1:5173` and `http://localhost:5173` use independent browser storage because the hostname is part of the origin. Valid records remained available after normal reload, hard reload, and closing and reopening the exact same URL.

### Data-driven dashboard

The current working tree derives, without separate React or persisted metric state:

* total opportunities;
* opportunities by actual status;
* detected opportunities;
* opportunities with and without a publication date;
* opportunities by modality;
* opportunities by employment type;
* opportunities created during the current local week;
* percentages only when the total is greater than zero.

Application, interview, offer, and follow-up metrics are not inferred from opportunities. The interface identifies those workflows as not implemented.

The pure `calculateDashboardMetrics` application module receives the opportunity collection and an injectable current date. It does not depend on React or browser storage and does not mutate its inputs.

### Same-origin tab synchronization

`App` listens for the browser `storage` event and reacts only to the opportunity storage key. It reloads through `LocalStorageOpportunityRepository`, so external values receive the same schema, URL, and domain validation as startup data.

Valid external changes replace the current collection immutably. Invalid external data remains untouched, the visible collection is preserved, and a safe warning is shown. A later valid load clears the repository block and allows persistence to continue.

This behavior synchronizes tabs that share protocol, hostname, and port. It does not synchronize different origins, browsers, devices, or users, and it is not remote real-time behavior.

### Opportunity search and status filtering

The current working tree supports:

* search by company or title;
* case-insensitive matching;
* leading and trailing whitespace normalization;
* literal string comparison without regular expressions;
* filtering by every centralized opportunity status;
* an `all` option that exists only in the presentation layer;
* combined search and status criteria;
* actions to clear the search or reset all filters;
* visible result counts derived from the source and visible collections;
* distinct empty states for an empty collection and a filtered collection with no matches;
* temporary filters that intentionally reset after a page reload;
* automatic visible-result recalculation after same-origin tab updates.

The pure `filterOpportunities` application function derives a new array without mutating the source collection. It is independent of React, browser storage, and the DOM.

Dashboard metrics continue to use the complete opportunity collection and do not change merely because the visible list is filtered.

### Opportunity editing

The current working tree supports:

* opening an existing opportunity in the shared form;
* preloading an independent temporary draft;
* editing company, title, URL, location, modality, employment type, publication date, description, and status when a valid transition is available;
* canceling without changing React state or persistence;
* preserving `id`, `createdAt`, `detectedAt`, source metadata, and non-editable values;
* advancing `updatedAt` on every accepted edit;
* rebuilding a valid `JobOpportunity` instance;
* replacing only the selected collection element without mutating the source array;
* saving the complete collection through `LocalStorageOpportunityRepository`;
* recalculating search results, filters, and dashboard metrics from the updated source collection;
* receiving valid edits from same-origin tabs;
* detecting a stale same-record edit through the expected `updatedAt` value;
* blocking stale saves while preserving both the local draft and the newer source record.

The pure `updateOpportunity` application function coordinates validation, identity preservation, immutable replacement, and optimistic-concurrency comparison without depending on React, the DOM, or browser storage.

Create and edit modes share input normalization and validation through `opportunityInput.js`. Visual components remain unaware of localStorage details.

### Opportunity status management

The current working tree supports:

* explicit status transitions through dedicated card action buttons;
* a status `<select>` in edit mode showing only the current status and the permitted targets;
* domain-enforced transition policy centralized in `opportunityStatusPolicy.js`: detected may advance to saved, dismissed, or archived; saved may advance to dismissed or archived; dismissed may advance to saved or archived; archived may be restored to detected, saved, or dismissed; self-transitions are always rejected; saved and dismissed cannot return to detected;
* a pure `changeOpportunityStatus` application function that checks optimistic concurrency, validates the transition against the domain policy, applies a monotonic `updatedAt`, and returns a result object without throwing;
* stale-write conflict detection on card-button status changes;
* status transition validation in `updateOpportunity` when the edit form submits a changed status;
* immediate dashboard and filter recalculation after accepted status changes;
* persistence of status changes through `LocalStorageOpportunityRepository`;
* visual de-emphasis of dismissed and archived cards through background, border, and title-color changes — not opacity alone;
* per-status badge colors that supplement the visible text label.

### Opportunity deletion

The current working tree supports:

* permanent removal of an opportunity from the collection from any status;
* an explicit `ConfirmDialog` as the sole barrier before removal, focused on the cancel button by default to reduce accidental deletion;
* a pure `deleteOpportunity` application function that locates the target by identity, applies optimistic-concurrency protection through the expected `updatedAt` value, and returns an immutable result object without throwing;
* detection of a stale-write conflict when the record was modified in another tab while the confirmation dialog was open;
* detection of an already-removed record at confirm time;
* automatic form closure when the record currently open in the edit form is deleted;
* persistence of the updated collection through `LocalStorageOpportunityRepository` after accepted deletion;
* distinct persistence-warning messages for conflict, not-found, and save-failure scenarios;
* `pendingDeletion` state captured at trigger time, not at confirm time, to guarantee conflict detection across the dialog's open duration;
* focus restored to the trigger element after the dialog closes.

### UX pass

The current working tree supports:

* accent-insensitive and case-insensitive search (`gestion` matches `Gestión`);
* a brief success message after create, edit, status change, and delete, announced through a polite live region;
* a notice when a newly created opportunity is hidden by the active search or status filter, with an action to reset the filters;
* Escape closes the opportunity form with the same effect as Cancel: the draft is discarded and nothing is saved; the handler is attached to the form section, so it only reacts while focus is inside the form and never competes with the confirmation dialog;
* focus returns to the control that opened the form (header button, empty-state button, or the card's edit button) after create, edit, cancel, or Escape;
* when that control no longer exists (for example, the edited opportunity was deleted), focus falls back to the header "Agregar oportunidad" button;
* the confirmation dialog keeps keyboard focus inside itself with Tab and Shift+Tab, restores focus to its trigger on close, and falls back to the header button when the trigger was removed;
* long unbroken location values wrap inside the opportunity card instead of causing horizontal overflow.

### Automated tests

`npm test` runs `node --test`, which discovers `tests/**/*.test.js`. No testing dependency was installed. The suite covers:

* the complete 4×4 status-transition matrix and unknown statuses;
* HTTP/HTTPS URL validation, including `javascript:`, `data:`, `file:`, and other rejected schemes;
* form input validation, normalization, and draft creation;
* accent-insensitive search, literal handling of regular-expression characters, status filtering, and non-mutation;
* dashboard metrics, percentages, and the local-week boundary;
* `changeOpportunityStatus`, `updateOpportunity`, and `deleteOpportunity`, including conflicts, not-found, invalid input, and immutability;
* `LocalStorageOpportunityRepository` round-trips, corrupted envelopes, invalid records, unsafe stored URLs, read and write failures, blocked persistence, and preservation of the original stored value.

React components are not covered by automated tests. Browser behavior is verified with a Playwright script executed outside the repository using the browser tooling available in the development environment; it is not a project dependency.

### Application tracking

Approved product decisions:

* an application can be registered only for an opportunity in `detected` or `saved` status;
* an opportunity can have at most one application;
* registering an application does not change the opportunity status;
* application transitions: `applied` → `interview` | `technical_test` | `rejected`; `interview` ↔ `technical_test`; `interview` and `technical_test` → `offer` | `rejected`; `offer` and `rejected` are final.

The current working tree supports:

* a "Registrar postulación" button on eligible opportunity cards;
* an explicit confirmation dialog stating that the action only records an application already submitted and sends nothing to the company;
* `registerApplication`, a pure function that checks the opportunity exists, detects a stale opportunity version through `expectedUpdatedAt`, applies the registration policy, and returns a new collection;
* `changeApplicationStatus`, a pure function with optimistic-concurrency protection and a monotonic `updatedAt`;
* domain policies in `applicationRegistrationPolicy.js` and `applicationStatusPolicy.js`;
* a confirmation dialog before entering a final status, because a misclick could not be undone;
* a real applications section with company, title, registration date, publication link, status badge, and allowed status actions;
* applications whose opportunity is missing are shown as "Oportunidad no disponible" instead of being hidden or deleted;
* opportunity cards show the current application status and replace the delete button with an explanation when an application exists;
* deletion is also re-checked at confirm time, so an application registered in another tab while the dialog was open blocks the deletion;
* `calculateApplicationMetrics` derives total, in-progress, and per-status counts; the dashboard shows them instead of the previous "No implementado" placeholders for applications;
* `LocalStorageApplicationRepository` with its own key `it-job-search-assistant.applications`, a versioned envelope (`schemaVersion: 1`), strict record validation, rejection of duplicated identifiers or duplicated opportunity references, preservation of corrupted data, and same-origin tab synchronization;
* after a registration or final-status confirmation, focus moves to the "Postulaciones" heading, because the triggering button no longer exists.

Supporting refactors:

* `createNextUpdatedAt` is shared by the opportunity and application use cases;
* shape validators shared by both repositories live in `src/infrastructure/storageValidation.js`.

The disabled header button "Registrar postulación" was removed: registration now happens from each opportunity card, and the placeholder claimed the feature was unavailable.

### Documentation

Relevant documentation distinguishes:

* opportunities from applications;
* implemented behavior from planned behavior;
* in-memory state from future persistence;
* domain responsibilities from React coordination.

## Not Implemented

The repository does not yet include:

* duplicate detection;
* editing application dates, notes, or next actions;
* deleting applications;
* functional follow-ups;
* source approval behavior;
* source monitoring;
* opportunity discovery;
* compatibility matching;
* recommendation calculation;
* a backend;
* a remote database;
* authentication;
* authorization;
* artificial intelligence;
* production deployment;
* automated component or browser tests inside the repository.

## Removed Legacy Files

The following legacy components are no longer part of the current source tree:

* `ApplicationForm.jsx`;
* `FiltersBar.jsx`.

They represented an earlier application-centered interface and must not be restored without a current approved use case.

## Current Architecture

### Presentation

React components render the header, statistics, workspace tabs, the shared create/edit opportunity form, opportunity search and status controls, opportunity cards with status action buttons and visual treatment by status, the opportunity section, a confirmation dialog for destructive operations, and the static source, application, and follow-up sections.

### State ownership

`App` owns:

* the opportunity collection;
* opportunity-form visibility;
* the selected edit session and expected `updatedAt` version;
* the current persistence warning;
* the temporary opportunity search query;
* the temporary opportunity status filter;
* the pending deletion target, captured as `{ id, expectedUpdatedAt }` at trigger time.

`OpportunityForm` owns:

* the temporary create or edit draft;
* form validation errors.

Dashboard values are derived from the opportunity collection during rendering. They are not independent state and are not stored in `localStorage`.

Visible opportunities are derived from the same collection and the temporary search and status criteria. The derived array, result count, search query, and status filter are not persisted.

### Domain coordination

`App` coordinates accepted form data, creates `JobOpportunity` instances, selects the edit target, applies status changes from card buttons, orchestrates confirmed deletions, and persists accepted collection changes.

`JobOpportunity` owns default identity, timestamps, and initial opportunity status.

`opportunityStatusPolicy` centralizes the allowed transition table and the `canTransitionOpportunityStatus` and `getAllowedTargetStatuses` functions. It is the single source of truth for transition rules.

`changeOpportunityStatus` is a pure application function that applies a single status transition with optimistic-concurrency protection. It does not coordinate with the collection or persistence layer.

`updateOpportunity` validates editable data, compares the expected record version, validates a submitted status change against the domain policy when present, rebuilds the domain entity while preserving identity, and returns an immutably updated collection.

`opportunityInput` centralizes the shared form draft, validation, and normalization rules used by creation and editing.

`calculateDashboardMetrics` is a pure application-level calculation that transforms validated opportunities into presentation-ready counts and percentages.

`filterOpportunities` is a pure application-level function that applies search and status predicates to the source collection without mutating it.

`deleteOpportunity` is a pure application function that locates the target by identity, applies optimistic-concurrency protection through the expected `updatedAt` value, and returns an immutably filtered collection. It does not depend on React, the DOM, or browser storage.

Presentation components receive data through props and communicate actions through callbacks.

### Infrastructure

`LocalStorageOpportunityRepository` owns browser-storage access and remains outside the presentation and domain layers.

`App` receives repository results and coordinates state updates, but visual components do not access `localStorage` directly.

Persisted records use the key `it-job-search-assistant.opportunities` and a versioned envelope with `schemaVersion: 1`.

Same-origin tab changes are received through the browser `storage` event and reloaded through the repository.

No remote service is connected.

## Current Limitations

* Opportunity creation, editing, explicit status management, permanent deletion, local search, and status filtering are the functional opportunity workflows.
* Source, follow-up, and workspace-tab sections remain static.
* The registration date is the moment the user confirms; it cannot yet be edited to an earlier date.
* Opportunities with an application cannot be deleted; the long-term rule is a pending product decision.
* If application storage is corrupted, the application collection starts empty in memory, so opportunity cards cannot know about stored applications and their deletion is not blocked; the corrupted value itself is preserved.
* Two tabs registering different applications at the same moment, before the `storage` event arrives, follow last-write-wins for the whole collection, as opportunities already do.
* Persistence remains local to one browser origin and device.
* No remote synchronization exists.
* No multi-device data sharing exists.
* Tabs using `localhost`, `127.0.0.1`, or different ports do not share data.
* Corrupted data is preserved and reported, but there is no user-facing repair or export workflow yet.
* Automated tests cover pure domain, application, and repository logic only; React components are verified manually or with external browser scripts.
* Escape closes the form only while keyboard focus is inside it.
* Clearing `localStorage` from another tab (`storage` event with a `null` key) is not synchronized; the current tab keeps its collection and writes it back on the next save.

## Security State

The current implementation:

* validates opportunity URLs;
* accepts only HTTP and HTTPS;
* rejects unsafe URL schemes;
* renders user text through normal React interpolation;
* does not use `dangerouslySetInnerHTML`;
* does not execute user content;
* does not store secrets;
* treats browser storage as untrusted input;
* rejects malformed records and unsafe stored URLs before rendering;
* preserves corrupted values instead of silently deleting them;
* does not connect to external APIs.

Frontend validation remains a user-experience boundary, not a future backend security boundary.

## Verification State

The manual opportunity and persistence flows have been reviewed through:

* production build;
* lint;
* browser interaction;
* invalid form submissions;
* valid HTTP and HTTPS submissions;
* multiple opportunity creation;
* opportunity counter updates;
* dashboard transitions from zero to one and two opportunities;
* modality and employment-type metric updates;
* reload behavior;
* normal reload, hard reload, and same-origin tab reopening;
* two-way same-origin cross-tab updates;
* unrelated storage-key events being ignored;
* 27 deterministic repository scenarios with an injected in-memory storage adapter;
* 12 deterministic dashboard-calculation scenarios;
* missing, malformed, unsupported, and invalid stored data;
* storage read and write failures;
* preservation and recovery of corrupted stored values;
* domain-instance rehydration;
* malicious-looking text;
* long content;
* desktop and mobile layouts;
* browser console inspection;
* 21 deterministic opportunity-filtering scenarios;
* company and title search in the browser;
* case-insensitive, partial, and whitespace-normalized search;
* individual and combined status criteria;
* filtered and unfiltered result counts;
* temporary filter reset after reload;
* active-filter recalculation after a same-origin tab update;
* literal handling of malicious-looking search text without execution or regular-expression errors.
* 30 deterministic opportunity-editing scenarios;
* accepted edits with identity and creation metadata preserved;
* cancellation without state or persistence changes;
* persistence and domain-instance rehydration after editing;
* automatic search and dashboard recalculation;
* unrelated same-origin updates while an edit draft remains open;
* stale same-record edit detection and blocked overwrite;
* preserved draft and newer source record after a conflict;
* continued creation behavior after editing;
* edit-form validation and unsafe URL rejection;
* responsive edit controls at 1440, 1024, 768, 390, and 320 CSS pixels.
* 48 deterministic status-management scenarios;
* all 16 cells of the 4×4 transition matrix (10 allowed, 6 rejected) via `changeOpportunityStatus`;
* stale-write conflict detection on status change;
* field preservation and `updatedAt` advancement after a status change via `updateOpportunity`;
* rejection of an invalid transition (saved→detected) via `updateOpportunity`;
* edit without a status field preserving the current status unchanged.
* 32 deterministic opportunity-deletion scenarios;
* successful deletion returning a new collection without the target, input collection unmutated;
* `not_found` result when the target identifier is absent;
* `conflict` result when `expectedUpdatedAt` does not match, collection unchanged;
* preservation of non-deleted records by identity when one of several is removed;
* repository round-trip after deletion: save, reload, verify target absent, survivor rehydrated as a `JobOpportunity` instance;
* `invalid_collection` guard for null, undefined, plain object, string, and numeric inputs.

* 150 automated unit tests through `npm test`, including the full 5×5 application transition matrix, registration eligibility, application status changes, application metrics, and the application repository;
* 57 automated browser checks for application tracking: eligibility by status, confirmation and cancellation, Escape and focus containment, persistence, final-status confirmation, orphan applications, corrupted and duplicated stored data, cross-tab synchronization, cross-tab conflicts for registration, deletion, and final status, malicious-looking text, horizontal overflow at five widths, and absence of console errors;
* 58 automated browser checks with Playwright on Chromium: validation, unsafe URL rejection, create, edit, status change, search, filters, created-under-filter notice, delete confirmation, Escape behavior, focus return and fallback, dialog focus containment, malicious-looking text, external-link attributes, reload persistence, corrupted and unsafe stored data, cross-tab synchronization, horizontal overflow at 1440, 1024, 768, 390, and 320 CSS pixels, and absence of console errors or warnings.

Luciano manually approved:

* keyboard controls;
* buttons;
* native date input;
* zoom behavior;
* general visual behavior.

## Current Technical Debt

No blocking source defect is currently known. The reload report was conclusively traced to browser-origin isolation rather than a same-origin persistence failure.

The repository has deterministic unit tests for pure logic but no automated component or browser tests inside the repository. Adding them would require a testing dependency and explicit approval.

`npm audit` reports advisories in development-only build tooling (`nanoid`, `postcss`, `source-map-js`, pulled in by Vite). They do not ship in the production bundle. Updating them changes `package-lock.json` and requires approval.

These gaps should be addressed only when the corresponding approved milestone requires them.

## Next Planned Technical Direction

The next proposed milestone must be selected after the current opportunity-editing changes are manually reviewed.

The intended direction is:

```text
OpportunityForm
        ↓
App coordinates accepted data and owns opportunities
        ↓
JobOpportunity and LocalStorageOpportunityRepository
        ↓
calculateDashboardMetrics and StatsPanel
        ↓
filterOpportunities and OpportunityFilters
        ↓
updateOpportunity and shared opportunity input rules
```

The implemented architecture now:

* isolates browser storage behind a repository;
* uses a stable namespaced key and versioned envelope;
* validates parsed records and rehydrates real `JobOpportunity` instances;
* preserves IDs, timestamps, order, optional fields, and corrupted data;
* reports load and save failures safely;
* derives dashboard metrics from one source of truth;
* synchronizes same-origin tabs without polling;
* derives a visible opportunity subset from temporary UI criteria;
* keeps dashboard metrics independent from list filtering;
* preserves entity identity while applying accepted edits;
* blocks stale same-record edits instead of using silent last-write-wins behavior;
* remains replaceable by a future remote repository.

No later milestone is authorized automatically.

## Next Milestone (proposed, not yet approved)

Follow-ups: identify applications that need an action. Required product decisions: whether `followUpAt` is entered manually or suggested, the default delay after each status, which statuses need follow-up, and how overdue items are shown.

AI-assisted compatibility analysis remains deferred. It requires a backend or Edge Function, an approved provider and budget, a secret API key stored outside the frontend, a candidate profile entered by Luciano, and approved matching criteria.

No implementation is authorized until this milestone is explicitly approved.

## Intentionally Deferred

The following remain planned for later approved milestones:

* application conversion and tracking;
* source approval and monitoring;
* duplicate detection;
* compatibility analysis;
* remote persistence;
* authentication and authorization;
* AI-assisted analysis;
* public deployment.
