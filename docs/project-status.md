# Project Status

## Purpose

This file records the current implementation state of the IT Job Search Assistant.

Permanent engineering rules belong in `AGENTS.md`.

Product overview and setup information belong in `README.md`.

Domain concepts and relationships belong in `docs/domain-model.md`.

The actual repository remains the final source of truth.

## Current Milestone

Manual opportunity creation, local persistence, the data-driven dashboard, same-origin cross-tab synchronization, search, and status filtering are implemented, audited, committed, and published on `main`.

The current working tree adds opportunity editing with identity preservation, shared validation, immutable collection replacement, persistence, and optimistic-concurrency protection. These changes remain local for final review.

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
* editing company, title, URL, location, modality, employment type, publication date, and description;
* canceling without changing React state or persistence;
* preserving `id`, `createdAt`, `detectedAt`, `status`, source metadata, and non-editable values;
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

### Documentation

Relevant documentation distinguishes:

* opportunities from applications;
* implemented behavior from planned behavior;
* in-memory state from future persistence;
* domain responsibilities from React coordination.

## Not Implemented

The repository does not yet include:

* opportunity deletion;
* opportunity archiving behavior;
* duplicate detection;
* conversion of an opportunity into an application;
* a functional application workflow;
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
* an automated test framework.

## Removed Legacy Files

The following legacy components are no longer part of the current source tree:

* `ApplicationForm.jsx`;
* `FiltersBar.jsx`.

They represented an earlier application-centered interface and must not be restored without a current approved use case.

## Current Architecture

### Presentation

React components render the header, statistics, workspace tabs, the shared create/edit opportunity form, opportunity search and status controls, opportunity cards with edit actions, the opportunity section, and the static source, application, and follow-up sections.

### State ownership

`App` owns:

* the opportunity collection;
* opportunity-form visibility;
* the selected edit session and expected `updatedAt` version;
* the current persistence warning;
* the temporary opportunity search query;
* the temporary opportunity status filter.

`OpportunityForm` owns:

* the temporary create or edit draft;
* form validation errors.

Dashboard values are derived from the opportunity collection during rendering. They are not independent state and are not stored in `localStorage`.

Visible opportunities are derived from the same collection and the temporary search and status criteria. The derived array, result count, search query, and status filter are not persisted.

### Domain coordination

`App` coordinates accepted form data, creates `JobOpportunity` instances, selects the edit target, and persists accepted collection changes.

`JobOpportunity` owns default identity, timestamps, and initial opportunity status.

`updateOpportunity` validates editable data, compares the expected record version, rebuilds the domain entity while preserving identity, and returns an immutably updated collection.

`opportunityInput` centralizes the shared form draft, validation, and normalization rules used by creation and editing.

`calculateDashboardMetrics` is a pure application-level calculation that transforms validated opportunities into presentation-ready counts and percentages.

`filterOpportunities` is a pure application-level function that applies search and status predicates to the source collection without mutating it.

Presentation components receive data through props and communicate actions through callbacks.

### Infrastructure

`LocalStorageOpportunityRepository` owns browser-storage access and remains outside the presentation and domain layers.

`App` receives repository results and coordinates state updates, but visual components do not access `localStorage` directly.

Persisted records use the key `it-job-search-assistant.opportunities` and a versioned envelope with `schemaVersion: 1`.

Same-origin tab changes are received through the browser `storage` event and reloaded through the repository.

No remote service is connected.

## Current Limitations

* Opportunity creation, editing, local search, and status filtering are the functional opportunity workflows.
* Application, source, follow-up, and workspace-tab sections remain static.
* Persistence remains local to one browser origin and device.
* No remote synchronization exists.
* No multi-device data sharing exists.
* Tabs using `localhost`, `127.0.0.1`, or different ports do not share data.
* Corrupted data is preserved and reported, but there is no user-facing repair or export workflow yet.
* Automated tests have not been introduced.

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

Luciano manually approved:

* keyboard controls;
* buttons;
* native date input;
* zoom behavior;
* general visual behavior.

## Current Technical Debt

No blocking source defect is currently known. The reload report was conclusively traced to browser-origin isolation rather than a same-origin persistence failure.

The repository does not yet have an automated test framework or automated component tests. Persistence behavior is currently covered by deterministic repository checks executed without adding dependencies, plus browser validation.

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

## Intentionally Deferred

The following remain planned for later approved milestones:

* deletion;
* application conversion and tracking;
* source approval and monitoring;
* duplicate detection;
* compatibility analysis;
* remote persistence;
* authentication and authorization;
* AI-assisted analysis;
* public deployment.
