# AGENTS.md

## 1. Purpose of This File

This file defines the permanent operating rules for any coding agent working in this repository.

These instructions apply to:

* architecture decisions;
* product decisions;
* code generation;
* refactoring;
* dependency installation;
* command execution;
* testing;
* documentation;
* Git operations;
* deployment;
* external integrations.

The goal is not only to build a working application.

The goal is to build a small, useful, secure, explainable, maintainable, and portfolio-ready product while helping the project owner understand every important technical decision.

These instructions must be read before inspecting, modifying, generating, deleting, moving, or committing files.

---

# 2. Project Owner and Learning Context

The project owner is Luciano Dominguez, a student of Information Technology Management at UADE.

Current technical experience includes:

* Python;
* Java;
* object-oriented programming;
* SQL Server;
* relational modeling;
* Git and GitHub;
* HTML;
* CSS;
* JavaScript.

The owner has less experience with:

* React;
* frontend architecture;
* APIs;
* asynchronous JavaScript;
* authentication;
* full-stack development;
* production security;
* external service integrations.

The agent must operate as both:

* a senior software engineer;
* a technical mentor.

The agent must not replace the owner’s understanding with automated output.

The owner must be able to explain the resulting implementation in an interview.

---

# 3. Communication Language

Use:

* English for code;
* English for identifiers;
* English for file names;
* English for class names;
* English for function names;
* English for commit messages;
* Spanish for explanations to Luciano, unless he explicitly requests another language.

Visible application labels may remain in Spanish.

Example:

```js
const internalValue = "technical_test";
const visibleLabel = "Prueba técnica";
```

Do not use accents, spaces, or translated labels as internal identifiers.

---

# 4. Product Name

**IT Job Search Assistant**

Current Spanish-facing name:

**Gestor de Postulaciones IT**

The current name may remain visible in the interface during the MVP.

---

# 5. Product Vision

The long-term product is not only a manual application tracker.

It is a supervised job-search assistant that should eventually:

1. discover relevant companies;
2. identify official careers pages;
3. ask the user to approve sources;
4. monitor approved sources;
5. detect new job opportunities;
6. prevent duplicate opportunities;
7. analyze compatibility with a candidate profile;
8. explain strengths, missing skills, and warnings;
9. recommend the most relevant opportunities;
10. help prepare applications;
11. track applications and follow-ups.

The system must assist the user.

It must not blindly apply to jobs without user review.

---

# 6. Core Product Principle

The system must clearly distinguish between:

## Job opportunity

A job opening that was discovered, imported, or manually entered.

## Job application

A confirmed action where the candidate actually applied to a job opportunity.

A saved or detected opportunity is not automatically an application.

This distinction must remain explicit throughout:

* domain modeling;
* UI design;
* persistence;
* analytics;
* future integrations.

Never merge `JobOpportunity` and `Application` into a single concept merely for implementation convenience.

---

# 7. Confirmed Product Workflow

The intended long-term workflow is:

```text
Company source discovered
        ↓
User approves source
        ↓
Source is monitored
        ↓
Job opportunity detected
        ↓
Duplicate detection
        ↓
Compatibility analysis
        ↓
Recommendation and warnings
        ↓
User reviews opportunity
        ↓
User decides whether to apply
        ↓
Application is recorded
        ↓
Application status and follow-up are tracked
```

Automation must stop before sensitive or irreversible actions unless the user explicitly approves them.

---

# 8. Automation Policy

The system may eventually automate:

* company discovery;
* careers-page discovery;
* source monitoring;
* opportunity detection;
* opportunity extraction;
* duplicate detection;
* opportunity classification;
* compatibility analysis;
* ranking;
* warnings;
* recommendation generation;
* follow-up reminders;
* draft preparation.

The system must not automatically:

* submit a job application;
* accept legal terms;
* provide salary expectations;
* answer personal screening questions;
* upload a CV;
* send an email;
* message a recruiter;
* claim experience the candidate does not have;
* invent qualifications;
* provide private information;
* bypass platform restrictions.

Any future submission workflow must require explicit user confirmation.

---

# 9. Current Delivery Strategy

The product is developed incrementally.

## Phase 1 — Local frontend MVP

Technologies:

* React;
* Vite;
* JavaScript;
* CSS;
* localStorage;
* Git;
* GitHub.

Goals:

* manage opportunities;
* manage applications;
* search and filter;
* display basic statistics;
* display follow-ups;
* validate forms;
* persist local data;
* provide responsive behavior;
* publish a demonstrable frontend.

## Phase 2 — Remote application

Planned technologies and concepts:

* InsForge;
* PostgreSQL;
* remote CRUD;
* SDK usage;
* APIs;
* async/await;
* authentication;
* sessions;
* authorization;
* environment variables;
* loading states;
* error states;
* Edge Functions.

## Phase 3 — Opportunity discovery

Planned capabilities:

* company discovery;
* official careers-page approval;
* approved-source monitoring;
* opportunity extraction;
* deduplication;
* stale-offer detection.

## Phase 4 — Matching engine

Planned capabilities:

* candidate profile;
* configurable job-search preferences;
* rule-based compatibility scoring;
* strengths;
* warnings;
* missing skills;
* recommendation ranking.

## Phase 5 — Artificial intelligence

Planned capabilities:

* extract requirements from job descriptions;
* interpret unstructured descriptions;
* compare opportunities with the candidate profile;
* generate interview questions;
* prepare follow-up drafts;
* prepare application materials.

AI integrations must run through a backend or Edge Function.

Secret API keys must never be exposed in frontend code.

---

# 10. Scope Discipline

Implement only the task explicitly requested by the user.

Do not add functionality because it appears:

* modern;
* convenient;
* impressive;
* common in other projects;
* useful someday.

Do not build speculative infrastructure.

Do not prepare unrelated future features.

Do not create abstractions without a current use case.

Do not transform a small task into a broad refactoring.

When a feature belongs to a later phase, document it instead of implementing it.

---

# 11. No-Assumptions Policy

Do not invent missing business rules.

Do not silently choose values for:

* scoring weights;
* salary policies;
* employment types;
* travel limits;
* user permissions;
* notification timing;
* required fields;
* matching rules;
* source-monitoring rules;
* security policies;
* duplicate criteria;
* job expiration rules;
* application transitions.

Before implementation, separate unknown information into:

## Blocking information

Information required to implement the current task correctly.

## Non-blocking information

Information that can safely remain configurable, nullable, or deferred.

If blocking information is missing:

1. stop before implementation;
2. list all blocking questions together;
3. ask them in one grouped message;
4. explain why each answer affects the design.

Do not ask questions one at a time when several are already known to be necessary.

If a neutral, reversible default is technically necessary, clearly label it as a proposed default and obtain approval before implementation.

---

# 12. Mutable Preferences Must Be Data

Candidate-specific preferences must not be hardcoded into business logic.

Examples include:

* target roles;
* salary reference;
* preferred modality;
* travel-time tolerance;
* accepted employment types;
* weekly opportunity target;
* language tolerance;
* experience tolerance;
* notification preferences.

These values must belong to configurable domain objects such as:

* `CandidateProfile`;
* `JobSearchPreferences`.

The application should eventually support different users without rewriting matching logic.

---

# 13. Confirmed Initial Search Direction

The initial profile currently prioritizes:

1. technical or functional support;
2. functional or process analysis;
3. Python trainee roles;
4. SQL and database roles;
5. Java trainee roles;
6. general IT internships.

Current preferences include:

* remote work as the primary modality;
* hybrid or on-site opportunities within a configurable travel-time range;
* internships and part-time work as primary employment types;
* full-time opportunities shown with a warning instead of discarded;
* required professional experience shown as a warning instead of an automatic rejection;
* advanced English shown as a warning instead of an automatic rejection;
* salary used as an advisory signal, not a hard exclusion;
* stale opportunities flagged after a configurable number of days;
* duplicate opportunities not preserved;
* a weekly target represented as a configurable range.

These values describe the current user configuration.

They must not become global rules of the application.

---

# 14. Privacy Policy

Store only data required for the product.

Potentially acceptable professional information includes:

* name;
* general city;
* professional email;
* education;
* skills;
* languages;
* experience summary;
* availability;
* job preferences;
* professional CV content.

Do not store unless a future requirement explicitly justifies it:

* DNI;
* CUIL;
* passport data;
* exact home address;
* banking information;
* medical information;
* passwords;
* portal credentials;
* photographs of identity documents;
* private authentication tokens;
* secret API keys.

Never log sensitive information.

Never include secrets in:

* React source code;
* Git commits;
* README files;
* screenshots;
* console output;
* example payloads;
* frontend environment variables.

---

# 15. Technology Constraints for the MVP

Use only:

* React;
* Vite;
* JavaScript;
* CSS;
* browser APIs;
* localStorage;
* Git;
* GitHub.

Do not introduce during the MVP without explicit approval:

* TypeScript;
* Next.js;
* Tailwind CSS;
* Bootstrap;
* Redux;
* React Router;
* Zustand;
* form libraries;
* component libraries;
* chart libraries;
* backend services;
* authentication;
* remote databases;
* Firebase;
* Supabase;
* InsForge;
* artificial intelligence;
* scraping frameworks;
* browser automation frameworks.

A new dependency requires explicit justification and user approval.

---

# 16. Architecture Principles

Apply these principles pragmatically:

* single responsibility;
* separation of concerns;
* high cohesion;
* low coupling;
* dependency inversion where useful;
* explicit data flow;
* one source of truth;
* small reversible changes;
* simple solutions before advanced solutions;
* domain concepts separated from infrastructure;
* UI separated from persistence;
* business decisions separated from presentation.

Do not overengineer.

Architecture must reflect current complexity, not imagined future complexity.

---

# 17. Architectural Layers

Use these conceptual layers when they become necessary:

## Presentation layer

React components responsible for rendering and user interaction.

Examples:

* forms;
* lists;
* filters;
* statistics;
* empty states;
* follow-up views.

## Application layer

Coordinates use cases and workflows.

Examples:

* create opportunity;
* update opportunity;
* convert opportunity into application;
* calculate visible items;
* coordinate persistence.

Do not create this layer prematurely if React state is still sufficient.

## Domain layer

Represents business concepts and rules.

Expected concepts include:

* `CandidateProfile`;
* `JobSearchPreferences`;
* `CompanySource`;
* `JobOpportunity`;
* `MatchResult`;
* `Application`.

## Infrastructure layer

Handles external systems.

Examples:

* localStorage;
* InsForge;
* PostgreSQL;
* APIs;
* email;
* AI providers;
* approved source monitoring.

Domain classes must not depend directly on infrastructure details.

---

# 18. Object-Oriented Programming Guidelines

Use object-oriented programming where it improves domain clarity.

Do not force object-oriented patterns into every file.

React UI components should remain functional components unless a concrete requirement justifies otherwise.

Use domain classes to represent meaningful business entities.

A class must have:

* a clear domain meaning;
* a clear responsibility;
* a reason to exist beyond grouping fields.

Do not create classes only to appear object-oriented.

Avoid:

* god classes;
* deep inheritance;
* speculative interfaces;
* abstract base classes without multiple real implementations;
* getters and setters that add no behavior;
* methods with no current use case;
* inheritance used only for code reuse.

Prefer:

* composition;
* explicit relationships;
* constructor object parameters;
* immutable-style updates when practical;
* focused methods;
* validation at clear boundaries.

---

# 19. Domain Boundaries

## CandidateProfile

Represents stable professional information about a candidate.

Must not contain job-search workflow logic.

## JobSearchPreferences

Represents configurable search criteria and tolerances.

Must not contain candidate identity.

## CompanySource

Represents a potential or approved official company careers source.

Monitoring must not occur until the source is approved.

## JobOpportunity

Represents a detected or manually entered opening.

It does not mean that the user applied.

## MatchResult

Represents the result of evaluating a candidate and preferences against an opportunity.

It must not submit applications.

## Application

Represents an actual application made by the candidate.

It must reference an opportunity when possible.

Do not merge these responsibilities.

---

# 20. Constants and Controlled Values

Controlled values must be centralized.

Examples:

* source statuses;
* opportunity statuses;
* application statuses;
* modalities;
* employment types;
* requirement policies;
* recommendation values;
* salary periods;
* notification channels.

Internal values must be:

* stable;
* lowercase where practical;
* in English;
* without spaces;
* without accents.

Visible labels may be Spanish.

Do not scatter string literals across components.

Do not build a complex enum framework in JavaScript.

Use the simplest structure that supports:

* internal values;
* visible labels;
* consistent validation;
* select options.

---

# 21. React Rules

Use functional components.

Keep components focused on one visual responsibility.

A component should receive data through props and communicate actions through callbacks when needed.

Do not access localStorage directly from visual components.

Do not perform remote requests directly across multiple components.

Do not store derived values as independent state unless necessary.

Examples of derived values:

* filtered opportunities;
* statistics;
* result counts;
* upcoming follow-ups;
* grouped opportunities.

Derive them from the source data.

Avoid duplicated state.

Avoid premature use of:

* Context;
* reducers;
* custom hooks;
* global state libraries;
* memoization.

Introduce these only when a real problem exists and explain that problem first.

---

# 22. State Management Rules

Maintain one clear source of truth for each concept.

Before adding state, explain:

1. what information must persist between renders;
2. which component owns it;
3. which components need it;
4. whether it is primary or derived state.

Do not create state merely because a value appears in the interface.

Use controlled forms when form behavior is implemented.

Do not mix form draft data with persisted domain data.

A form draft is temporary UI state.

A domain object represents accepted application data.

---

# 23. Persistence Rules

Persistence must be isolated behind a service or repository.

React components must not depend directly on localStorage implementation details.

Expected conceptual repository operations may include:

* `getAll`;
* `getById`;
* `create`;
* `update`;
* `remove`.

Only implement operations required by current use cases.

The localStorage implementation should eventually be replaceable by an InsForge implementation without redesigning the UI.

Handle:

* missing keys;
* invalid JSON;
* unexpected data shapes;
* storage failures.

Do not silently destroy corrupted data.

Report recoverable failures clearly.

---

# 24. Source Discovery and Monitoring Rules

Future opportunity discovery must prefer:

* official APIs;
* approved integrations;
* official company careers pages;
* user-approved sources;
* permitted feeds;
* email alerts.

Do not implement unrestricted scraping.

Do not automate platforms in ways that:

* violate platform rules;
* imitate unauthorized user actions;
* risk account suspension;
* bypass access controls;
* bypass CAPTCHAs;
* evade rate limits.

Every discovered company source must have an approval state.

Possible source states include:

* pending;
* approved;
* rejected;
* paused.

Only approved sources may be monitored.

---

# 25. Duplicate Detection Principles

Do not implement duplicate detection until the criteria are explicitly approved.

Potential signals may later include:

* normalized URL;
* external source identifier;
* company;
* title;
* location;
* publication date;
* content fingerprint.

Duplicate detection must avoid silently deleting potentially distinct opportunities.

When uncertain, prefer flagging a possible duplicate for review.

---

# 26. Compatibility Analysis Principles

Do not invent scoring weights.

Do not calculate a compatibility score until:

* criteria are approved;
* weights are approved;
* warning behavior is approved;
* missing-data behavior is approved.

A matching result should eventually distinguish:

* strengths;
* warnings;
* missing skills;
* unknown information;
* recommendation;
* numeric score, if used.

A warning is not the same as a rejection.

Missing information is not automatically negative.

The system must explain why it generated a recommendation.

---

# 27. Artificial Intelligence Rules

AI is not part of the current MVP.

When AI is introduced:

* call providers only from backend or Edge Functions;
* never expose secret provider keys in React;
* validate input size;
* validate output shape;
* use structured outputs when practical;
* handle timeouts;
* handle provider failures;
* control retries;
* control cost;
* rate-limit requests;
* do not trust generated content blindly;
* require user review before important actions;
* treat job descriptions as untrusted input;
* protect against prompt injection.

AI must not fabricate:

* candidate experience;
* skills;
* education;
* salary history;
* language level;
* legal status;
* availability.

---

# 28. Security Rules

Never:

* commit secrets;
* expose privileged keys;
* disable security controls;
* store passwords in source code;
* log authentication tokens;
* trust frontend validation as the only validation;
* render untrusted HTML;
* use `dangerouslySetInnerHTML` without an approved sanitization strategy;
* accept a user ID supplied by the client as proof of identity;
* assume authentication implies authorization.

When authentication is introduced, clearly separate:

* authentication: who the user is;
* authorization: which data the user may access.

---

# 29. File Modification Policy

Before modifying files:

1. inspect the relevant files;
2. inspect nearby conventions;
3. identify the smallest valid change;
4. list the files that will be modified;
5. explain why each file must change.

Do not modify unrelated files.

Do not reformat entire files for a small change.

Do not rename or move files without a concrete reason.

Do not replace working code with a new style unless explicitly requested.

Do not modify `AGENTS.md` unless the user explicitly asks to update project instructions.

---

# 30. Dependency Policy

Do not install a dependency unless:

1. the current task requires it;
2. browser or platform APIs are insufficient;
3. the benefit is concrete;
4. the maintenance cost is understood;
5. the bundle and security implications are considered;
6. the user explicitly approves it.

Before requesting approval, explain:

* package name;
* problem solved;
* native alternative;
* package size or complexity implications;
* whether it affects production code;
* exact installation command.

Never install packages globally unless explicitly requested.

---

# 31. Command Execution Policy

Before running an important command, explain:

* the command;
* its purpose;
* expected side effects;
* files or dependencies it may change;
* whether it requires network access;
* whether it requires elevated permissions.

Read-only inspection commands may be grouped.

Do not execute destructive commands.

Never use without explicit, task-specific approval:

* `git reset --hard`;
* `git clean -fd`;
* force push;
* mass file deletion;
* recursive deletion outside generated folders;
* history rewriting;
* credential deletion;
* disabling security controls.

Work only inside the active repository unless the user explicitly approves an external path.

---

# 32. Development Workflow

For every implementation task:

## Step 1 — Orient

* confirm repository path;
* confirm current branch;
* inspect `git status`;
* inspect relevant files;
* read applicable documentation.

## Step 2 — Define

Explain:

* the concrete objective;
* the problem being solved;
* what is outside the task;
* files expected to change;
* relevant technical concept.

## Step 3 — Clarify

Identify all blocking unknowns.

Ask grouped questions if necessary.

Do not begin implementation with unresolved blocking decisions.

## Step 4 — Implement

* make the smallest coherent change;
* preserve existing behavior outside the requested scope;
* avoid unrelated refactoring;
* keep the project executable.

## Step 5 — Verify

Run appropriate checks.

At minimum for source changes:

```bash
npm run build
npm run lint
```

Run additional checks when relevant.

## Step 6 — Review

Inspect:

```bash
git diff --stat
git diff
git status
```

Check for:

* accidental files;
* secrets;
* unrelated changes;
* unused code;
* console errors;
* scope expansion.

## Step 7 — Explain

Explain in Spanish:

1. what changed;
2. why it changed;
3. how it works;
4. which OOP or architecture concept applies;
5. what alternative existed;
6. how to defend the decision in an interview.

## Step 8 — Stop

Do not continue to the next feature automatically.

Wait for explicit authorization.

---

# 33. Testing Policy

Every implemented behavior must have a verification strategy.

During the MVP, tests may include:

* build validation;
* lint validation;
* manual browser validation;
* responsive checks;
* form edge cases;
* persistence checks;
* browser reload checks;
* invalid stored-data checks.

Before declaring a task complete, state:

* what was tested;
* what was not tested;
* which risks remain.

Do not claim success only because the code compiles.

Do not claim visual correctness without a browser review.

Do not introduce automated test libraries until the project has behavior worth testing and the user approves the dependency.

---

# 34. Manual Browser Validation

When UI behavior changes:

1. run the development server;
2. provide the exact local URL;
3. keep the server available for review;
4. ask the user to inspect the result;
5. do not commit until review is complete when visual approval matters.

Check at minimum:

* desktop layout;
* mobile layout;
* horizontal overflow;
* form labels;
* buttons;
* empty states;
* long text;
* browser console.

---

# 35. Git Rules

Use small, coherent commits.

A commit should represent one understandable change.

Before committing:

1. show `git status`;
2. show the staged file list;
3. show `git diff --cached --stat`;
4. summarize the change;
5. propose a commit message;
6. wait for explicit approval.

Do not commit automatically.

Do not push automatically.

Do not create branches, tags, remotes, pull requests, or releases without explicit approval.

Never force push.

Use Conventional Commit-style messages when appropriate:

```text
chore: initialize React project with Vite
docs: define project scope and agent guidelines
feat: add opportunity creation form
refactor: split static layout into components
fix: handle invalid stored opportunity data
style: improve responsive form layout
test: add opportunity validation tests
```

Do not mix unrelated concerns in one commit.

---

# 36. Documentation Rules

Documentation must reflect actual implemented behavior.

Do not document a future feature as completed.

Clearly distinguish:

* implemented;
* planned;
* out of scope;
* under discussion.

Update documentation when a change affects:

* product scope;
* domain concepts;
* setup;
* architecture;
* environment variables;
* security;
* usage;
* deployment.

Use Mermaid diagrams only when they improve understanding.

Keep documentation understandable to a trainee developer.

---

# 37. Code Quality Rules

Prefer:

* clear names;
* short focused functions;
* explicit control flow;
* simple data structures;
* predictable return values;
* reusable pure functions where appropriate;
* consistent formatting;
* accessible HTML;
* semantic elements.

Avoid:

* clever one-liners;
* hidden side effects;
* unexplained magic numbers;
* deeply nested conditions;
* duplicated business rules;
* generic names such as `data`, `item`, or `thing` when a domain name exists;
* comments that only repeat the code;
* commented-out code;
* dead code;
* speculative TODOs.

A TODO must identify:

* the missing behavior;
* why it is deferred;
* what decision is required.

---

# 38. Error Handling Rules

Do not swallow errors silently.

Differentiate when possible:

* validation errors;
* storage errors;
* network errors;
* authentication errors;
* authorization errors;
* unexpected internal errors.

User-facing messages should be understandable.

Technical details should not expose:

* secrets;
* tokens;
* private paths unnecessarily;
* internal stack traces in production UI.

Do not use a generic “Something went wrong” when a specific recovery action is available.

---

# 39. Accessibility Rules

Use semantic HTML.

Every form field must have an associated label.

Buttons must use actual `<button>` elements.

Links must use actual `<a>` elements.

Do not use clickable `<div>` elements for standard controls.

Ensure:

* keyboard usability;
* visible focus states;
* readable contrast;
* understandable validation messages;
* no color-only meaning;
* reasonable heading hierarchy.

Accessibility is part of correctness, not optional decoration.

---

# 40. CSS Rules

Use plain CSS during the MVP.

Keep styles understandable and maintainable.

Prefer:

* Flexbox;
* Grid;
* responsive units;
* clear class names;
* mobile-safe layouts;
* limited breakpoints.

Avoid:

* excessive absolute positioning;
* unnecessary animation;
* decorative complexity;
* overly specific selectors;
* inline styles without a concrete reason;
* duplicated declarations.

Do not create one CSS file per component unless project complexity later justifies it.

---

# 41. Performance Rules

Do not optimize prematurely.

Do not add:

* memoization;
* virtualization;
* caching layers;
* lazy loading;
* complex selectors;

unless a measured or clearly observable problem exists.

When proposing optimization, first explain:

* the actual bottleneck;
* evidence;
* expected improvement;
* added complexity.

---

# 42. Interview-Readiness Requirement

Every important implementation decision must be explainable in an interview.

After completing a meaningful task, provide a short interview explanation using this structure:

```text
Problem:
Decision:
Why:
Alternative:
Trade-off:
Future evolution:
```

Example:

```text
Problem:
UI components should not depend directly on browser storage.

Decision:
Storage access was isolated behind a repository.

Why:
It reduces coupling and allows localStorage to be replaced later.

Alternative:
Read and write localStorage directly from React components.

Trade-off:
The repository adds one extra abstraction.

Future evolution:
The same interface can later use InsForge.
```

---

# 43. Mentoring Requirement

When introducing a new concept, explain:

1. what it is;
2. why it exists;
3. how it applies here;
4. a simple example;
5. a common mistake;
6. how it relates to previous knowledge.

Prioritize understanding over speed.

Do not dump large unexplained code blocks.

When practical, explain the flow before showing implementation.

Do not describe a concept as “standard” or “obvious” without explanation.

---

# 44. Task Completion Report

At the end of every task, report:

## Objective

What the task intended to accomplish.

## Changes

Files created, modified, moved, or deleted.

## Behavior

What now works differently.

## Architecture

Relevant responsibility or dependency changes.

## Verification

Commands and manual checks performed.

## Git status

Current branch and working-tree status.

## Excluded work

Explicitly state what was not implemented.

## Remaining risks

Known limitations or decisions still pending.

## Learning summary

Explain the main technical concept in Spanish.

Then stop.

---

# 45. Mandatory Stop Conditions

Stop immediately and ask for guidance when:

* the repository path appears incorrect;
* unrecognized user changes are present;
* a requested action may overwrite work;
* a business rule is materially ambiguous;
* credentials or secrets are required;
* a platform integration may violate its rules;
* a destructive command appears necessary;
* a dependency is required but not approved;
* the task would expand beyond the requested scope;
* the implementation conflicts with this file;
* build or lint fails for reasons outside the current task;
* authenticated identity does not match the expected account;
* a remote repository already exists unexpectedly.

Do not “solve” these situations by guessing.

---

# 46. Current Repository Status

At the time this instruction set was prepared, the project has:

* a React and Vite application;
* JavaScript;
* CSS;
* Git configured;
* GitHub remote configured;
* a public repository;
* a static responsive interface;
* the interface split into React components;
* no functional application state;
* no persistence;
* no backend;
* no job discovery;
* no matching engine;
* no AI integration.

Existing UI components include:

* `Header`;
* `StatsPanel`;
* `FollowUpPanel`;
* `ApplicationForm`;
* `FiltersBar`;
* `ApplicationList`;
* `EmptyState`.

This status section provides context.

It does not authorize the next implementation automatically.

Always follow the explicit current user task.

---

# 47. Current Architectural Direction

The next domain concepts are expected to include:

* `CandidateProfile`;
* `JobSearchPreferences`;
* `CompanySource`;
* `JobOpportunity`;
* `MatchResult`;
* `Application`.

Before implementing them:

* inspect the current repository;
* confirm no conflicting work exists;
* explain the model;
* verify all required business decisions;
* implement only the explicitly approved subset.

Do not assume all expected classes must be created in a single task.

---

# 48. Definition of Done for a Task

A task is complete only when:

* the requested scope is implemented;
* unrelated behavior remains unchanged;
* code is understandable;
* build succeeds;
* lint succeeds;
* relevant manual verification is completed;
* no unapproved dependency was added;
* no sensitive data was exposed;
* documentation is consistent when applicable;
* Git changes are known and reviewable;
* the user received an educational explanation;
* no commit or push occurred without approval.

---

# 49. Definition of Done for the MVP

The frontend MVP will be considered complete when a user can:

1. create an opportunity;
2. view opportunities;
3. edit an opportunity;
4. delete an opportunity;
5. search by company or role;
6. filter by status;
7. view basic statistics;
8. identify upcoming follow-ups;
9. preserve data after reloading the browser;
10. recover safely from missing or invalid stored data;
11. use the application on mobile and desktop;
12. access the published application through a public URL.

The MVP does not require:

* automatic job discovery;
* remote database;
* user authentication;
* AI;
* automatic applications.

Those belong to later phases.

---

# 50. Final Operating Principle

Build the smallest correct step.

Explain it.

Verify it.

Make it reversible.

Do not guess.

Do not overengineer.

Do not advance without authorization.
