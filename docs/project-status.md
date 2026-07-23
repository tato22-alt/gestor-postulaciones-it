# Project Status

## Purpose

This file records the current implementation state of the IT Job Search Assistant.

Permanent engineering rules belong in `AGENTS.md`.

Product overview and setup information belong in `README.md`.

Domain concepts and relationships belong in `docs/domain-model.md`.

The actual repository remains the final source of truth.

## Current Milestone

The manual opportunity-creation flow is implemented, audited, committed, and published on `main`.

Local opportunity persistence is implemented and verified in the current working tree. These persistence changes remain intentionally uncommitted and unpushed for manual review.

The application can create opportunities, persist them in the current browser, rehydrate domain instances after reload, and recover safely when stored data is invalid.

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
* a real detected-opportunity count;
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

### Documentation

Relevant documentation distinguishes:

* opportunities from applications;
* implemented behavior from planned behavior;
* in-memory state from future persistence;
* domain responsibilities from React coordination.

## Not Implemented

The repository does not yet include:

* opportunity editing;
* opportunity deletion;
* opportunity archiving behavior;
* search;
* filtering;
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

React components render the header, statistics, workspace tabs, manual opportunity form, opportunity cards, opportunity section, and the static source, application, and follow-up sections.

### State ownership

`App` owns:

* the opportunity collection;
* opportunity-form visibility.

`OpportunityForm` owns:

* the temporary form draft;
* form validation errors.

The detected-opportunity count is derived from `opportunities.length`.

### Domain coordination

`App` coordinates accepted form data and creates `JobOpportunity` instances.

`JobOpportunity` owns default identity, timestamps, and initial opportunity status.

Presentation components receive data through props and communicate actions through callbacks.

### Infrastructure

`LocalStorageOpportunityRepository` owns browser-storage access and remains outside the presentation and domain layers.

`App` receives repository results and coordinates state updates, but visual components do not access `localStorage` directly.

Persisted records use the key `it-job-search-assistant.opportunities` and a versioned envelope with `schemaVersion: 1`.

No remote service is connected.

## Current Limitations

* Only the opportunity-creation flow has functional behavior.
* Application, source, follow-up, and workspace-tab sections remain static.
* Persistence remains local to one browser and device.
* No remote synchronization exists.
* No multi-device data sharing exists.
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
* reload behavior;
* deterministic repository scenarios with an injected in-memory storage adapter;
* missing, malformed, unsupported, and invalid stored data;
* storage read and write failures;
* preservation and recovery of corrupted stored values;
* domain-instance rehydration;
* malicious-looking text;
* long content;
* desktop and mobile layouts;
* browser console inspection.

Luciano manually approved:

* keyboard controls;
* buttons;
* native date input;
* zoom behavior;
* general visual behavior.

## Current Technical Debt

No blocking source defect is currently known.

The repository does not yet have an automated test framework or automated component tests. Persistence behavior is currently covered by deterministic repository checks executed without adding dependencies, plus browser validation.

These gaps should be addressed only when the corresponding approved milestone requires them.

## Next Planned Technical Direction

The next proposed milestone must be selected after the current local persistence changes are manually reviewed and committed.

The intended direction is:

```text
OpportunityForm
        ↓
App coordinates accepted data
        ↓
JobOpportunity
        ↓
Opportunity repository
        ↓
localStorage
```

The implemented repository now:

* isolate browser storage;
* use a stable namespaced key;
* use a versioned envelope;
* validate parsed records;
* rehydrate real `JobOpportunity` instances;
* preserve IDs and timestamps;
* preserve corrupted data;
* report load and save failures safely;
* remain replaceable by a future remote repository.

No later milestone is authorized automatically.

## Intentionally Deferred

The following remain planned for later approved milestones:

* editing and deletion;
* application conversion and tracking;
* local search and filtering;
* source approval and monitoring;
* duplicate detection;
* compatibility analysis;
* remote persistence;
* authentication and authorization;
* AI-assisted analysis;
* public deployment.
