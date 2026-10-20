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

The application tracking milestone (explicit application registration from an opportunity and application status management) is implemented, verified, and merged into `main`.

The follow-ups milestone (suggested and editable follow-up dates, application detail editing, and a follow-up agenda) is implemented, verified, and merged into `main`.

Public deployment to GitHub Pages is configured and live at `https://tato22-alt.github.io/gestor-postulaciones-it/`. The first successful deployment ran after the repository's Pages source was set to "GitHub Actions". With it, every item of the local MVP definition is implemented.

The finishing-touches milestone (backup export and import, CSV export, download of unreadable stored data, a privacy note, a duplicate URL warning, removal of non-functional placeholders, and Node 24 workflow actions) is implemented and verified.

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
* after a status button is used on an opportunity or application card, focus moves to the first status action that now exists on the same card; changes received from another tab never move focus;
* a failed save replaces any older warning (for example, a stale conflict message) so the user always learns that the change was not persisted; only the load warning is kept, because it explains why persistence is blocked.

Supporting refactors:

* `createNextUpdatedAt` is shared by the opportunity and application use cases;
* shape validators shared by both repositories live in `src/infrastructure/storageValidation.js`.

The disabled header button "Registrar postulación" was removed: registration now happens from each opportunity card, and the placeholder claimed the feature was unavailable.

### Follow-ups and application details

Approved product decisions:

* a follow-up date is suggested and always editable: 7 days after registration, 3 days after entering `interview`, 5 days after entering `technical_test`; `offer` and `rejected` have no follow-up;
* the agenda is sorted by date and labels each item as "Vencido", "Hoy", or "Próximo" in text, not only color;
* "Marcar como hecho" clears the follow-up; another one is scheduled explicitly through "Editar postulación";
* the applied date, follow-up date, next action, and notes are editable; the applied date cannot be in the future;
* opportunities with an application still cannot be deleted.

The current working tree supports:

* `followUpPolicy.js` with the suggested delays, `canHaveFollowUp`, `getSuggestedFollowUpDate`, and `getFollowUpUrgency`;
* suggested follow-ups set by `registerApplication` and re-suggested by `changeApplicationStatus` from the day of the change; final statuses clear them;
* `updateApplicationDetails` and `applicationDetailsInput.js`: validation of a real, non-future applied date, a follow-up not earlier than the applied date, no follow-up for final statuses, 200-character next actions and 2000-character notes, trimming, optimistic concurrency, and preservation of the exact `appliedAt` timestamp when its calendar day does not change;
* `completeFollowUp`, which clears the follow-up with optimistic concurrency;
* `getPendingFollowUps`, which derives the agenda from applications, opportunities, and the current date without storing anything;
* an inline edit form inside each application card, with associated labels, hints, `aria-invalid`, `aria-describedby`, Escape to cancel, focus on the first field when it opens, and focus back to "Editar postulación" when it closes;
* other cards' edit buttons, the card's status actions, and "Marcar como hecho" for the same application are disabled or hidden while a form is open;
* if another tab moves the application to a final status while it is being edited, any submitted follow-up date is ignored and saving reports a visible conflict instead of leaving the form stuck;
* a draft is preserved when another tab changes the same application, and saving then reports a conflict instead of overwriting newer data;
* the "Próximos seguimientos" panel with urgency labels, the related opportunity, the next action, and "Marcar como hecho"; after completion, focus moves to the panel heading;
* the dashboard shows how many follow-ups are overdue or due today instead of the "No implementado" placeholder.

Implementation decision (reversible, documented): `followUpAt` is stored as a `YYYY-MM-DD` calendar date, like `publishedAt`, so a follow-up for "today" never shifts to another day because of time zones. Before this milestone no stored application could contain a non-null `followUpAt`, so no migration was needed. The repository now rejects timestamp-shaped follow-ups and oversized text.

Shared calendar helpers live in `src/utils/date.js`; the previous duplicated `YYYY-MM-DD` validators in `opportunityInput.js` and `LocalStorageOpportunityRepository.js` now use it.

### Workspace tabs

The "Oportunidades" and "Postulaciones" tabs are functional. Previously the "Postulaciones" tab was a disabled placeholder whose hover style made it look selected without changing anything.

* "Oportunidades" shows the opportunity form, search, list, and sources; "Postulaciones (N)" shows the applications and the follow-up agenda; the statistics summary and messages stay above both;
* WAI-ARIA tabs pattern: `role="tablist"`, `tab`, and `tabpanel`, `aria-selected`, `aria-controls`, `aria-labelledby`, roving `tabIndex`, and ArrowLeft, ArrowRight, Home, and End;
* both panels stay mounted and the inactive one is hidden, so drafts survive switching tabs;
* "Agregar oportunidad" switches to the opportunities tab before opening the form;
* after registering an application, the user stays on the opportunities tab, focus moves to the opportunities heading, and the success message points to the applications tab;
* the active tab is temporary presentation state in `App` and resets to "Oportunidades" after a reload.

### Public deployment

Approved by Luciano with a $0 budget:

* platform: GitHub Pages on the public repository;
* URL: `https://tato22-alt.github.io/gestor-postulaciones-it/`;
* workflow: `.github/workflows/deploy.yml` runs on every push to `main` (and manually), with `npm ci`, `npm run lint`, `npm test`, and `npm run build`; it publishes `dist` only when every step passes;
* least-privilege workflow permissions (`contents: read`, `pages: write`, `id-token: write`) and a non-cancelling `pages` concurrency group;
* `vite.config.js` uses the `/gestor-postulaciones-it/` base path only for production builds, so the dev server keeps `http://127.0.0.1:5173/`;
* no environment variables, secrets, backend, or paid services;
* user data stays in each visitor's browser storage for the published origin and is never uploaded;
* the production build contains no source maps.

The production build was verified by serving `dist` statically under `/gestor-postulaciones-it/`: the page loads without failed requests or console errors, the favicon resolves, and an opportunity, its application, and its follow-up survive a reload.

Rollback: revert the deployment commit or disable GitHub Pages in the repository settings.

### Google Drive synchronization (implemented and enabled in the published site)

Approved by Luciano: local-first data with optional synchronization to each user's own Google Drive, so data never passes through a server of Luciano's and each person owns it.

* **Scope:** `https://www.googleapis.com/auth/drive.appdata` only. The app reads and writes a single file, `gestor-postulaciones-it.json`, in the hidden appDataFolder and cannot see other Drive files.
* **Authorization:** Google Identity Services token client loaded from `https://accounts.google.com/gsi/client` (approved external script, no npm dependency). Access tokens live only in memory; only the on/off preference is stored (`it-job-search-assistant.drive-sync`). After a reload the user taps «Sincronizar» once to get a new token.
* **Sync file:** the backup format, now `schemaVersion: 3` with `deletions`. Versions 1 and 2 are still accepted.
* **Deletion records:** every deletion of an opportunity, application, or source is recorded (`it-job-search-assistant.deletions`) so a device that still has the record cannot bring it back. Importing a backup removes the deletion records of the records it re-adds and marks those records as edited after the deletion, so a deletion synchronized from another device does not remove them again.
* **Merge rules** (`mergeSnapshots`): the most recent `updatedAt` wins; a deletion wins over earlier edits; an edit after a deletion keeps the record; an exact tie is broken by content, so every device picks the same copy; if two devices registered an application for the same opportunity, the most recently edited one is kept and the other is recorded as deleted; an opportunity that still has an application is never removed; an opportunity whose source was deleted keeps its data without the source; record order is ignored when detecting changes.
* **Safety:** a remote file that fails validation is never overwritten; synchronization is refused while any local collection cannot be read; edits made during a running sync are merged again and synchronized afterwards.
* **Timing:** after connecting, 3 seconds after local changes, when the tab becomes visible, and once more 10 seconds after each upload, while a valid token exists.
* **Errors:** an expired token (HTTP 401) asks the user to sync again; a refused request (HTTP 403, for example quota or a full Drive) is reported without asking to reconnect. Screen readers announce only the results of syncs the user started. A deletion record that cannot be saved shows a warning.
* **Configuration:** the section appears only when `VITE_GOOGLE_CLIENT_ID` is set at build time (see `.env.example`). The client ID is public and is set in the deploy workflow. Authorized JavaScript origins: `https://tato22-alt.github.io` and `http://127.0.0.1:5173`. While the OAuth app is in testing mode, only the test users listed in Google Cloud can connect; publishing the OAuth app opens it to everyone.
* **Verification:** unit tests cover the merge rules, convergence, the coordinator, and the Drive client with a simulated Drive; a browser suite simulates two devices with stubbed Google endpoints (first upload to appDataFolder, receiving data, edits and deletions in both directions, invalid remote file untouched, expired authorization, disconnect, token never stored). Real Google endpoints were not reachable from the development environment.

### Sources, text limits, and application deletion

Approved by Luciano ("sí a todo"):

* **Text limits:** company and title up to 200 characters and description up to 10,000, enforced in the form (with `maxLength`). Browser storage and backup import do not enforce them, so data saved before the limits can still be loaded and every backup the app exported can be restored; editing such a record requires shortening it.
* **Application deletion:** "Eliminar postulación" with a destructive confirmation dialog and optimistic concurrency (`deleteApplication`). The opportunity is kept and can receive a new application or be deleted.
* **Job sources:** a "Fuentes (N)" tab to add, edit (inline, Escape cancels), and delete official careers pages. A source added by the user is created as `approved` with `approvedAt`, because the user is the one who decides; nothing is discovered or monitored automatically. A source with linked opportunities cannot be deleted, nor while an opportunity form opened from it is still open, nor while stored opportunities cannot be read. If the source disappears before the form is saved (for example, from another tab), the opportunity is not created and the draft is kept. "Agregar oportunidad" from a source opens the opportunity form with the company prefilled and stores `sourceId`; the opportunity card and the opportunities CSV show the source.
* `LocalStorageSourceRepository` uses the key `it-job-search-assistant.sources`, a versioned envelope, strict validation, raw download of unreadable data, and same-origin tab synchronization.
* **Backups** move to `schemaVersion: 2` with `sources`; version 1 files are still accepted, and only integer known versions are recognized. An imported opportunity whose source is neither stored nor in the backup is imported without its source, and the preview says so. Imports save sources, then opportunities, then applications, each only if the previous save succeeded.
* **Tabs** wrap on narrow screens so three tabs never cause horizontal overflow.
* **README screenshots** in `docs/screenshots/` use fictional demo data.
* The remote branches `feature/supabase-persistence` and `qa/browser-checks` could not be deleted from the cloud environment (the Git proxy rejects branch deletion); they were deleted locally and must be deleted on GitHub.

### Finishing touches

* **Backup export:** "Exportar respaldo" downloads `gestor-postulaciones-respaldo-YYYY-MM-DD.json` with `{ format: 'it-job-search-assistant.backup', schemaVersion: 1, exportedAt, opportunities, applications }`, built with the repository serializers (`src/infrastructure/backupFile.js`).
* **Backup import:** "Importar respaldo" reads a file of at most 5 MB and validates it with the same strict record validators as browser storage. It rejects invalid JSON, unknown formats or versions, extra envelope fields, `__proto__`/`constructor`/`prototype` keys anywhere, unsafe URLs, duplicated identifiers, two applications for one opportunity, and oversized text.
* **Non-destructive merge:** `planBackupImport` (application layer) only adds records whose identifiers do not exist. An application is added only when its opportunity exists after the merge and has no other application. A confirmation dialog shows what will be added and what is skipped and why; the plan is recalculated at confirm time. Import is refused while any stored collection cannot be read. Applications are saved only after their opportunities are saved, so a failed write cannot leave stored applications without their opportunities.
* **Export with unreadable storage:** the backup still downloads the session data, and a message explains that the unreadable stored data is not included and can be downloaded from the storage warning.
* **Unreadable stored data:** the storage warning offers "Descargar los datos guardados tal como están", which downloads the raw stored text through `readRawValue()`. Nothing is repaired or deleted.
* **CSV export:** opportunities and applications as separate files with Spanish headers, RFC 4180 quoting (semicolons and tabs are also quoted, because Spanish-locale spreadsheets split CSV files on `;`), CRLF line endings, a UTF-8 BOM, and an apostrophe prefix for cells starting with `=`, `+`, `-`, `@`, tab, or carriage return (`src/application/csvExport.js`).
* **Possible duplicates:** `duplicateOpportunityPolicy.js` compares URLs after lowercasing protocol and host, dropping the fragment, and dropping a trailing slash. Saving an opportunity whose URL matches another shows a non-blocking warning with "Guardar igual" and "Seguir editando"; changing the URL clears it. Nothing is blocked or deleted.
* **Privacy note** in the header: data is stored only in this browser; export a backup to keep it.
* **Success feedback:** the `role="status"` live region stays mounted and is shown as a fixed toast at the bottom, so messages are announced reliably and do not shift the layout.
* **Removed placeholders:** the static "Fuentes de empleo" section and the "Recomendaciones" placeholder group were removed from the interface; `CompanySource` and `MatchResult` remain in the domain model.
* **Workflow:** `actions/checkout@v5`, `actions/setup-node@v5`, `actions/configure-pages@v6`, and `actions/deploy-pages@v5` run on Node 24; `actions/upload-pages-artifact@v3` is a composite action and was kept.
* **Technical note:** the branch `feature/supabase-persistence` contains an SQL schema with row level security that is not connected to the application.

### Documentation

Relevant documentation distinguishes:

* opportunities from applications;
* implemented behavior from planned behavior;
* in-memory state from future persistence;
* domain responsibilities from React coordination.

## Not Implemented

The repository does not yet include:

* automatic duplicate merging (possible duplicates are only flagged);
* deleting applications;
* follow-up history (completed follow-ups are cleared, not archived);
* reminders or notifications outside the application;
* automatic source discovery or approval workflows (sources are added manually);
* source monitoring;
* opportunity discovery;
* compatibility matching;
* recommendation calculation;
* a backend;
* a remote database;
* authentication;
* authorization;
* artificial intelligence;
* automated component or browser tests inside the repository.

## Removed Legacy Files

The following legacy components are no longer part of the current source tree:

* `ApplicationForm.jsx`;
* `FiltersBar.jsx`.

They represented an earlier application-centered interface and must not be restored without a current approved use case.

## Current Architecture

### Presentation

React components render the header, statistics, workspace tabs, the shared create/edit opportunity form, opportunity search and status controls, opportunity cards with status action buttons and visual treatment by status, the opportunity section, a confirmation dialog for destructive operations, the applications list with inline editing, the follow-up agenda, and the data panel for backups and CSV exports.

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
* The agenda's "Vencido" and "Hoy" labels are calculated when the page renders; a page left open past midnight updates them on the next interaction or reload.
* Opportunities with an application cannot be deleted; the long-term rule is a pending product decision.
* If application storage cannot be read safely, the corrupted value is preserved and the app cannot know which opportunities already have an application, so opportunity deletion and application registration are disabled until a valid load succeeds.
* Two tabs registering different applications at the same moment, before the `storage` event arrives, follow last-write-wins for the whole collection, as opportunities already do.
* Persistence remains local to one browser origin and device.
* No remote synchronization exists.
* No multi-device data sharing exists.
* Tabs using `localhost`, `127.0.0.1`, or different ports do not share data.
* Unreadable stored data is preserved, reported, and downloadable as raw text; there is no automatic repair or reset.
* Backup import adds records only; it never updates records that already exist with newer data from the file.
* Location has no maximum length.
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

* 200 automated unit tests through `npm test` after the finishing touches, adding the backup round trip, malicious and invalid backups, the non-destructive import plan, CSV quoting and formula neutralization, and URL normalization for duplicates;
* 33 automated browser checks for the finishing touches: backup export, CSV contents, import preview, Escape, import into an empty profile, persistence, re-import without duplicates, partial merge keeping local data, invalid, malicious, and `__proto__` files, raw download of unreadable data, refusal to import while storage is unreadable, the duplicate warning flow, removed placeholders, the privacy note, overflow at 1440 and 320 CSS pixels, and absence of console errors;
* 180 automated unit tests through `npm test` before the finishing touches, also passing under the `America/Argentina/Buenos_Aires`, `Pacific/Kiritimati` (UTC+14), and `Pacific/Pago_Pago` (UTC−11) time zones, including follow-up suggestions, urgency, calendar-date helpers, application detail validation and editing, follow-up completion, the derived agenda, and the full 5×5 application transition matrix, registration eligibility, application status changes, application metrics, and the application repository;
* 48 automated browser checks for follow-ups with a fixed browser clock in the Buenos Aires time zone: suggested dates after registration and each status, agenda order and "Vencido"/"Hoy"/"Próximo" labels, applied-date and follow-up validation, Escape and focus return, trimming, malicious-looking notes rendered as text, mark as done and focus, persistence after reload, final statuses without follow-up, cross-tab edit conflict with the draft preserved, rejection of timestamp-shaped stored follow-ups, horizontal overflow at five widths with long content, and absence of console errors;
* 62 automated browser checks for application tracking: eligibility by status, confirmation and cancellation, Escape and focus containment, persistence, final-status confirmation, orphan applications, corrupted and duplicated stored data, cross-tab synchronization, cross-tab conflicts for registration, deletion, and final status, malicious-looking text, horizontal overflow at five widths, and absence of console errors;
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

These gaps should be addressed only when the corresponding approved milestone requires them.

## Next Milestone (proposed, not yet approved)

Candidates, each requiring Luciano's decisions before implementation:

* rule-based compatibility analysis, which needs approved criteria, priorities, warning versus exclusion behavior, and missing-data handling.

No implementation is authorized until a milestone is explicitly approved.
