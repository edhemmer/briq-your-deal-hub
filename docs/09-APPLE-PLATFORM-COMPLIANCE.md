# BRIX Apple Platform Compliance and App Store Submission Standard

## 1. Authority and Rules of Engagement

This document is a binding compliance supplement to:

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`
- `docs/05-BUILD-ROADMAP.md`
- `docs/06-SYSTEM-ARCHITECTURE.md`
- `docs/07-UI-DESIGN-SYSTEM.md`
- `docs/08-IMPLEMENTATION-ROADMAP.md`
- `specs/020-native-iphone-and-ipad-production.md`
- `specs/024-testing-observability-and-release-readiness.md`

Where this document is more specific about Apple platform behavior, App Store Connect, TestFlight, privacy, review, signing, assets, or device presentation, this document controls.

Rules of engagement:

1. BRIX must be implemented and reviewed as a native iPhone and iPad product, not a website inside an app shell.
2. No production build may be submitted until every applicable requirement in this document has objective evidence.
3. Apple requirements must be rechecked against current official Apple documentation before every production submission.
4. No metadata, privacy response, permission declaration, screenshot, review note, entitlement, icon, or capability may describe behavior the shipped binary does not actually perform.
5. No web fallback may be used to conceal an unfinished native workflow.
6. No device size, orientation, accessibility setting, keyboard state, split-view mode, or safe-area condition may produce clipped, overlapped, off-screen, unreachable, or horizontally scrolling critical content.
7. Account creation requires in-app account deletion initiation.
8. Any third-party login option that triggers Apple’s Sign in with Apple requirement must be matched by Sign in with Apple.
9. Required-reason API usage, privacy manifests, privacy nutrition labels, permission purpose strings, and third-party SDK declarations must reconcile exactly.
10. Build success in Xcode is not compliance. Archive validation, TestFlight validation, physical-device verification, metadata review, and App Review readiness are separate gates.
11. A TestFlight build is not production-ready merely because it installs.
12. Any known Apple rejection risk blocks submission until resolved or explicitly accepted by the product owner with documented rationale.

## 2. Mission

Deliver BRIX as a polished Apple-platform product that:

- behaves correctly on supported iPhone and iPad devices;
- looks native at every screen size;
- respects Apple privacy, security, accessibility, account, and review requirements;
- avoids common first-submission failures;
- installs, launches, authenticates, synchronizes, upgrades, and deletes data correctly;
- presents accurate App Store information;
- gives App Review a complete, working, reviewable experience.

## 3. Compliance Ownership

The native engineering owner is responsible for:

- Xcode project integrity;
- Apple target configuration;
- asset catalogs;
- entitlements and capabilities;
- privacy manifest integration;
- permission purpose strings;
- native layout behavior;
- device testing;
- archive and upload validation;
- TestFlight behavior;
- App Store submission readiness.

The backend owner is responsible for:

- account creation and deletion behavior;
- Sign in with Apple token handling where used;
- data deletion, retention, and legal-hold rules;
- privacy-policy accuracy;
- authentication callbacks;
- universal-link handling;
- notification registration and delivery;
- secure API behavior;
- workspace and RLS enforcement.

The product owner is responsible for:

- App Store metadata;
- screenshots and previews;
- support and privacy URLs;
- review notes;
- demo account readiness;
- age rating;
- pricing and availability;
- final submission approval.

## 4. Supported Devices and Layout Matrix

The supported-device matrix must be declared before implementation and verified before release.

At minimum, test:

- smallest supported iPhone display;
- current standard iPhone display;
- current large iPhone display;
- Dynamic Island device;
- iPhone in portrait and all supported landscape states;
- compact iPad;
- standard iPad;
- large iPad Pro;
- iPad portrait and landscape;
- iPad split view at narrow, medium, and wide widths;
- Stage Manager where supported;
- external keyboard and pointer on iPad;
- Display Zoom where supported;
- largest supported Dynamic Type accessibility size.

Every screen must verify:

- safe-area compliance;
- no content under the status bar, Dynamic Island, Home indicator, keyboard, floating keyboard, or system overlays;
- no horizontal page scrolling for normal application layout;
- no clipped buttons, labels, tables, cards, menus, sheets, alerts, or navigation controls;
- no fixed desktop-width containers;
- no tiny browser-style text;
- no hover-only behavior;
- no inaccessible controls hidden behind the keyboard;
- correct rotation and state preservation;
- correct split-view collapse and expansion behavior;
- correct popover, sheet, menu, and navigation destination behavior by size class.

## 5. Native Experience Standard

BRIX must not feel like a webpage.

Required native qualities:

- platform-appropriate navigation stacks, tab bars, sidebars, sheets, alerts, menus, pickers, search, share sheets, context menus, and file pickers;
- touch targets sized for mobile use;
- native text selection and editing behavior;
- keyboard-safe forms;
- predictable swipe-back and dismissal behavior;
- proper iPad multi-column layouts;
- native loading, refresh, empty, error, offline, stale, queued, retry, and conflict states;
- restrained, meaningful animation and haptics;
- no desktop header squeezed into a phone width;
- no unsupported browser controls;
- no embedded web navigation chrome;
- no viewport bugs, overflow traps, or fixed-position elements that obscure content;
- no unfinished route that opens an external site to complete a core app workflow.

Web views are allowed only for explicitly approved content such as legal documents, secure hosted payment management, or external documentation. They must not replace core BRIX functionality.

## 6. App Icons and Asset Catalog

The app icon source must be a true 1024 by 1024 pixel square image configured through the Apple asset catalog or approved Apple icon workflow.

Requirements:

- exact 1024 by 1024 source;
- correct color space;
- no unintended transparency or alpha where prohibited by the selected asset workflow;
- no pre-rounded corners;
- no embedded device frame;
- no text too small to survive system scaling;
- correct default, dark, tinted, and other supported appearances when adopted;
- correct asset name referenced by the application target;
- target membership verified;
- no duplicate or abandoned app-icon sets;
- no mismatch between Xcode build settings and catalog name;
- no missing App Store marketing icon;
- icon renders correctly on Home Screen, Settings, notifications, search, share sheets, and TestFlight;
- archive validation reports no missing-icon or invalid-icon warnings.

The launch experience must:

- use an approved launch screen configuration;
- avoid fake splash-screen delays;
- avoid stretching or clipping branding;
- transition cleanly into the first real screen;
- support light and dark appearance where applicable.

## 7. Bundle IDs, Targets, Schemes, and Build Settings

Document and verify:

- production bundle identifier;
- staging and development identifiers;
- app target;
- unit-test target;
- UI-test target;
- share extension target if used;
- notification service extension if used;
- app groups;
- Keychain access groups;
- associated domains;
- push notification environment;
- background modes;
- Sign in with Apple capability where used;
- Maps, location, microphone, camera, photo, files, and other capabilities;
- development, staging, and production schemes;
- configuration-specific endpoints and keys;
- version and build-number policy;
- supported platform and deployment targets.

No production secret may be embedded in source, plist, asset catalog, or application bundle.

## 8. Signing, Provisioning, and Archive Validation

Before TestFlight or App Store upload:

- Apple Developer membership is active;
- agreements are accepted;
- certificates are valid;
- provisioning profiles match bundle IDs and entitlements;
- team selection is correct;
- automatic or manual signing strategy is documented;
- extension targets use compatible signing;
- production push entitlement is correct;
- associated domains match deployed files;
- app groups and Keychain groups match all targets;
- Release configuration excludes debug-only settings;
- archive is created from the production scheme;
- archive contains the correct app, version, build, icon, entitlements, and privacy manifest;
- Xcode validation completes without unresolved errors;
- uploaded build appears correctly in App Store Connect.

Common signing failures to prevent:

- wrong team;
- development profile used for distribution;
- stale profile after capability changes;
- mismatched extension entitlement;
- inconsistent bundle identifiers;
- duplicate signing certificates;
- missing distribution certificate;
- associated-domain mismatch;
- push environment mismatch;
- unaccepted Apple agreements.

## 9. Authentication and Login Compliance

BRIX login must be fully reviewable.

Required flows:

- sign up where enabled;
- email verification;
- sign in;
- password reset;
- magic-link or passwordless callback where used;
- Sign in with Apple where required or offered;
- session refresh;
- expired-session recovery;
- sign out;
- invitation acceptance;
- workspace selection;
- account deletion initiation.

Login must not:

- redirect users to obsolete Lovable or unrelated domains;
- fail because of incorrect Supabase redirect URLs;
- trap the reviewer in email verification without instructions;
- require inaccessible enterprise credentials;
- expose debug errors;
- lose unsynced work after reauthentication;
- open a browser for a core sign-in flow unless the authentication method specifically requires a secure system browser flow.

If third-party or social login is offered and Apple requires Sign in with Apple, implement it fully, including secure nonce/state handling and account-linking rules.

## 10. Account Deletion

Because BRIX supports account creation, the user must be able to initiate full account deletion from inside the app.

Requirements:

- deletion option is easy to find in account settings;
- wording says delete account, not merely deactivate;
- the user is told what will be deleted, retained, transferred, or legally preserved;
- reauthentication is required when appropriate;
- destructive confirmation is clear but not obstructive;
- deletion request status is visible;
- deletion completes without requiring a phone call or unsupported external process unless a lawful regulated exception applies;
- associated personal data is deleted unless legally required to be retained;
- workspace-owned business records follow documented ownership and retention rules;
- local caches, Keychain entries, push tokens, and offline files are removed according to policy;
- active sessions are revoked;
- Sign in with Apple tokens are revoked when applicable;
- deletion events are audited without retaining unnecessary personal content;
- the flow is tested with a real non-production account.

## 11. Privacy Manifest and Required-Reason APIs

The final archive must include accurate privacy manifests for the app and applicable third-party SDKs.

Required process:

1. inventory app code and every SDK;
2. identify covered required-reason APIs;
3. document the approved reason for each use;
4. remove any unjustified API usage;
5. ensure manifest declarations match actual code;
6. verify third-party SDK manifests are present and current;
7. inspect the final archive, not only the source tree;
8. resolve App Store Connect privacy-manifest warnings before submission.

Fingerprinting is prohibited. Permission to track does not permit fingerprinting.

## 12. Permission Purpose Strings

Every protected resource requires a clear, specific, user-facing explanation that matches actual use.

Review all applicable keys, including:

- camera;
- photo library read;
- photo library add-only;
- microphone;
- speech recognition;
- precise and approximate location;
- location while in use;
- background location only if genuinely required and approved;
- contacts only if genuinely required;
- calendar only if genuinely required;
- Bluetooth only if genuinely required;
- local network only if genuinely required;
- Face ID if used.

Purpose strings must explain why BRIX needs access in plain language. Generic text such as “required for app functionality” is not acceptable.

The app must provide a usable fallback when permission is denied whenever practical, such as manual address entry when location is unavailable or file import when camera access is denied.

## 13. App Privacy Nutrition Labels

App Store Connect privacy responses must include data collected by BRIX and by integrated third parties.

Maintain a data inventory covering:

- account identifiers;
- contact information;
- user content;
- property and deal information;
- photos, videos, audio, documents, and transcripts;
- location;
- financial information entered for analysis;
- diagnostics;
- crash data;
- analytics;
- product interaction;
- device identifiers;
- push tokens;
- AI request and response metadata;
- support communications;
- payment and subscription information where applicable.

For each data type, document:

- collected or not collected;
- linked to user or not;
- used for tracking or not;
- purpose;
- retention;
- sharing recipient;
- deletion behavior;
- third-party processor.

The App Store privacy answers, privacy policy, in-app disclosures, actual network behavior, and SDK configuration must agree.

## 14. Privacy Policy and Support URLs

Before submission, verify live public URLs for:

- privacy policy;
- terms of use;
- support;
- account deletion or privacy choices where provided;
- company contact information.

Requirements:

- HTTPS;
- no broken links;
- mobile-readable;
- correct company and app name;
- accurate data practices;
- clear deletion instructions;
- no placeholder text;
- no references to abandoned vendors or obsolete products;
- available to App Review without authentication.

## 15. Accessibility

Critical paths must pass with:

- VoiceOver;
- Dynamic Type, including accessibility sizes;
- Reduce Motion;
- Differentiate Without Color;
- Bold Text;
- increased contrast;
- Switch Control where practical;
- external keyboard on iPad;
- pointer on iPad;
- captions or transcripts for audio;
- accessible charts, tables, financial metrics, status indicators, and risk states.

Requirements:

- logical reading order;
- useful labels, values, hints, and actions;
- no unlabeled icon-only control;
- no color-only meaning;
- scalable layouts that do not clip text;
- minimum practical touch targets;
- keyboard focus remains visible;
- modal focus is trapped and restored correctly;
- accessibility actions exist for swipe-only controls.

## 16. App Store Metadata

Prepare and verify:

- app name;
- subtitle;
- promotional text;
- description;
- keywords;
- category;
- age rating;
- copyright;
- support URL;
- marketing URL where used;
- privacy policy URL;
- version release notes;
- screenshots for all required device classes;
- app previews where used;
- pricing and availability;
- export compliance responses;
- content rights responses;
- review contact information.

Metadata must not:

- promise unavailable features;
- use placeholder screenshots;
- show mock or nonfunctional UI;
- claim professional, legal, tax, appraisal, lending, inspection, or guaranteed investment outcomes;
- contain unsupported security claims;
- use outdated branding;
- show web-only features as native if they are not available in the build.

## 17. Screenshots and App Preview

Screenshots must come from the submitted build or an accurately equivalent production configuration.

Requirements:

- correct device dimensions;
- no status-bar or safe-area corruption;
- no debug banners;
- no personal or sensitive real data;
- no placeholder values;
- no unsupported feature claims;
- consistent current branding;
- readable text;
- representative native layouts;
- iPhone and iPad screenshots match each platform’s actual experience.

## 18. App Review Information and Demo Account

Provide App Review with:

- working contact name;
- monitored email;
- reachable phone number;
- persistent demo account when login is required;
- stable password;
- any required one-time-password bypass or reviewer-safe method;
- sample workspace;
- sample Deal with realistic data;
- instructions for testing camera, files, reports, notifications, AI, deletion, subscriptions, or gated features;
- explanation of features unavailable in the review environment;
- review notes for non-obvious navigation;
- server availability throughout review.

The demo account must not expire, require inaccessible email approval, trigger mandatory payment, or depend on the developer manually intervening during review.

## 19. Export Compliance and Encryption

Document the application’s use of encryption, including:

- HTTPS/TLS;
- Keychain;
- encrypted local storage;
- third-party libraries;
- custom cryptography if any;
- authentication encryption;
- file encryption.

Complete App Store Connect export-compliance questions accurately. Do not guess. Preserve supporting classification documentation.

## 20. TestFlight Readiness

Before external testing:

- build installs on supported physical devices;
- upgrade from prior build works;
- clean install works;
- authentication callbacks work;
- push notifications use correct environment;
- camera, microphone, photos, files, maps, and share extension work;
- account deletion works;
- privacy disclosures are accurate;
- known blocking crashes are resolved;
- reviewer notes and test instructions are current;
- backend staging or production environment remains available;
- build does not contain debug menus, test credentials, or development endpoints unless explicitly protected.

## 21. Common First-Submission Failures to Prevent

The release checklist must explicitly prevent:

- missing or invalid 1024 by 1024 app icon;
- wrong app icon set name;
- asset catalog not assigned to target;
- icon transparency or malformed asset;
- missing launch configuration;
- bundle ID mismatch;
- invalid provisioning profile;
- missing capability entitlement;
- privacy manifest missing from final archive;
- undeclared required-reason API;
- inaccurate privacy nutrition labels;
- missing privacy policy URL;
- generic or missing permission purpose string;
- broken login;
- reviewer cannot access account;
- email verification blocks review;
- missing Sign in with Apple where required;
- account deletion missing, hidden, or only deactivates;
- deletion opens a broken external page;
- app redirects to an abandoned vendor domain;
- web-wrapper or webpage feel;
- clipped content on small iPhone;
- broken iPad layout;
- horizontal overflow;
- keyboard covers required controls;
- inaccessible navigation;
- placeholder content;
- dead buttons;
- crash on denied permission;
- unsupported background mode;
- broken universal links;
- production build pointing to staging or localhost;
- no restore path for purchased subscriptions where applicable;
- metadata claims not present in binary;
- app cannot function because server, AI provider, or sample data is unavailable during review.

## 22. Physical-Device Test Matrix

Physical testing must include:

- clean install;
- upgrade install;
- sign up;
- sign in;
- password reset;
- invitation and workspace switch;
- account deletion;
- offline launch;
- reconnect and sync;
- weak cellular network;
- Wi-Fi transition;
- camera denial and approval;
- photo denial and limited-library mode;
- microphone denial and approval;
- location denial, approximate location, and approval;
- background upload;
- app termination during upload;
- push notification while foreground, background, and terminated;
- deep link from email and notification;
- Dynamic Type;
- VoiceOver;
- iPad split view;
- orientation changes;
- keyboard appearance and dismissal;
- memory pressure with large Deal, photo, and document collections.

## 23. Submission Gate

A build may be submitted only when:

- all blocking tests pass;
- all metadata is complete;
- privacy policy and support URLs are live;
- privacy labels reconcile to the binary;
- required-reason API declarations reconcile to the archive;
- icon and asset validation pass;
- demo account works;
- account deletion works;
- login works from a clean install;
- iPhone and iPad layout verification passes;
- no critical content clips or overruns;
- no core workflow feels like an embedded website;
- archive validation passes;
- TestFlight validation passes;
- reviewer notes are complete;
- server and dependent services are monitored for the review period;
- rollback or forward-fix plan is ready.

## 24. Verification and Validation

### Functional verification

- Every advertised Apple-platform workflow completes end to end.
- Login, reset, verification, invitation, workspace selection, sign out, and deletion work.
- Permissions have working approval, denial, and recovery paths.
- Deep links, notifications, camera, files, audio, maps, share extension, reports, and offline sync work on physical devices.

### Layout verification

- Every supported iPhone and iPad size is verified.
- Portrait, landscape, split view, Stage Manager, keyboard, safe areas, Dynamic Island, Display Zoom, and Dynamic Type are verified where applicable.
- No clipped, overlapped, off-screen, unreachable, or horizontally scrolling critical content remains.
- No page presents desktop-web navigation or webpage styling on native devices.

### Privacy and security verification

- App privacy responses match code and SDK behavior.
- Privacy manifests and required-reason declarations are present in the final archive.
- Purpose strings match actual feature behavior.
- Tokens, credentials, and private content do not leak into logs, screenshots, metadata, analytics, or crash reports.
- Account deletion removes or lawfully retains data according to policy.

### App Review verification

- Demo account works without developer intervention.
- Review notes explain non-obvious workflows.
- Sample data permits review of all gated capabilities.
- Support, privacy, and deletion URLs are live.
- Metadata and screenshots accurately represent the submitted binary.

### Build verification

- Production scheme archives successfully.
- Entitlements match App IDs and profiles.
- Archive validation passes.
- App Store Connect accepts the upload without unresolved compliance errors.
- TestFlight install and upgrade pass on physical devices.

## 25. Definition of Done

This Apple compliance standard is complete only when:

1. `specs/020-native-iphone-and-ipad-production.md` is implemented and this document’s compliance gates pass.
2. BRIX looks and behaves like a purpose-built Apple application on every supported iPhone and iPad configuration.
3. App icons, assets, launch behavior, signing, provisioning, capabilities, entitlements, manifests, metadata, and screenshots are correct.
4. Login, Sign in with Apple where required, account deletion, privacy disclosures, permission flows, and review access are complete.
5. No critical overflow, clipping, webpage feel, dead control, stale state, hidden failure, or first-launch error remains.
6. The final archive and uploaded build have been validated, installed, upgraded, and tested through TestFlight.
7. App Store Connect privacy, review, export, age-rating, pricing, and availability information is complete and accurate.
8. All known material Apple rejection risks are resolved.
9. Evidence of each validation gate is retained with the release record.
10. The build is marked `APPLE SUBMISSION READY` only after product, engineering, privacy, and release owners approve it.