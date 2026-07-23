# Project Status

## Purpose

This file records the current implementation state of the IT Job Search Assistant.

Permanent engineering rules belong in `AGENTS.md`.

Product overview and setup information belong in `README.md`.

Domain concepts and relationships belong in `docs/domain-model.md`.

The actual repository remains the final source of truth.

## Current Milestone

The manual opportunity-creation flow is implemented, audited, and manually verified.

Its current local changes have not yet been committed.

The application can create opportunities in React memory and render them immediately.

Persistence is not implemented.

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

### Documentation

Relevant documentation distinguishes:

* opportunities from applications;
* implemented behavior from planned behavior;
* in-memory state from future persistence;
* domain responsibilities from React coordination.

## Not Implemented

The repository does not yet include:

* localStorage persistence;
* an opportunity repository;
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

No persistence infrastructure exists yet.

No React component accesses localStorage.

No remote service is connected.

## Current Limitations

* Opportunities disappear after a browser reload.
* Closing and reopening the application removes in-memory opportunities.
* Only the opportunity-creation flow has functional behavior.
* Application, source, follow-up, and workspace-tab sections remain static.
* Persistence warnings do not exist because persistence is not implemented.
* No remote synchronization exists.
* No multi-device data sharing exists.
* No recovery flow for corrupted stored data exists.
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
* does not use browser storage;
* does not connect to external APIs.

Frontend validation remains a user-experience boundary, not a future backend security boundary.

## Verification State

The manual opportunity flow has been reviewed through:

* production build;
* lint;
* browser interaction;
* invalid form submissions;
* valid HTTP and HTTPS submissions;
* multiple opportunity creation;
* opportunity counter updates;
* reload behavior;
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

The repository does not yet have automated unit tests, automated component tests, deterministic repository tests, or persistence failure handling.

These gaps should be addressed only when the corresponding approved milestone requires them.

## Next Planned Technical Direction

The next proposed milestone is local opportunity persistence through an isolated repository.

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

The repository should:

* isolate browser storage;
* use a stable namespaced key;
* use a versioned envelope;
* validate parsed records;
* rehydrate real `JobOpportunity` instances;
* preserve IDs and timestamps;
* preserve corrupted data;
* report load and save failures safely;
* remain replaceable by a future remote repository.

This milestone requires explicit authorization after the current files are reviewed and committed.

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
