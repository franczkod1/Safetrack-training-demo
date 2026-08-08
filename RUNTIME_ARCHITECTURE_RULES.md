# SafeTrack mandatory runtime architecture rules

Status: MANDATORY PROJECT RULE
Applies to: every SafeTrack frontend/runtime change from SafeTrack v0.24 onward.

## Purpose
SafeTrack must never again be developed by loading a complete previous frontend version and then stacking a newer version on top of it with override JavaScript, override CSS, duplicate event handlers, duplicate MutationObservers or repeated global function replacement.

The production application must have one clearly owned active implementation for every user-interaction domain.

## Absolute rules

1. ONE ACTIVE OWNER PER DOMAIN
   - Navigation, employee hierarchy, training catalog, individual training workflow, group training workflow, documents, uploads/OCR, individual print, group print, version display and admin functions may each have only one active runtime owner.
   - A second module may not intercept the same user action merely to override or repair the first module.

2. NO VERSION STACKING
   - A new SafeTrack version must not be implemented by adding `safetrack-v0XX.js` / `safetrack-v0XX.css` after the previous version while leaving the previous runtime active.
   - Historical version files may remain in Git history or archive folders, but must not be loaded by the production `index.html` once their functionality has been migrated.
   - Bugfix files such as `*-fix.js`, `*-compat.js`, `*-pagefix.css` and similar override layers are temporary migration aids only. They must not become permanent production architecture.

3. REPLACE, DO NOT OVERLAY
   - When a domain is migrated, its new canonical module must contain the required behavior itself.
   - The predecessor module must be removed from the production load chain in the same controlled migration before that domain is considered consolidated.
   - Copying behavior into a new module while still loading the old event handlers is prohibited.

4. SINGLE GLOBAL ENTRY POINT
   - Production must converge toward one application bootstrap and explicit current-domain modules.
   - Preferred target structure is semantic rather than historical, for example:
     - `core.js`
     - `employees.js`
     - `trainings.js`
     - `group-training.js`
     - `documents.js`
     - `print.js`
     - `admin.js`
     - `styles.css`
     - `print.css`
   - Product version numbers belong in application metadata, not in a growing chain of simultaneously executed filenames.

5. GLOBAL STATE AND GLOBAL FUNCTIONS
   - Repeated reassignment of browser globals such as `window.print`, `window.onclick`, `window.__SafeTrack...` ownership or equivalent dispatch functions by multiple modules is prohibited.
   - If a browser-global integration point is necessary, one canonical dispatcher owns it and routes internally to domain modules.
   - Module-scoped state is preferred. Explicit shared state must have one documented owner.

6. EVENT HANDLERS
   - One domain action must have one effective handler path.
   - Capture-phase interception may not be used as a permanent method to beat an older handler in execution order.
   - `stopImmediatePropagation()` may not be used as a long-term version-conflict mechanism.
   - Before adding a handler, search the active source for all handlers targeting the same action or selector.

7. MUTATION OBSERVERS
   - MutationObserver-based enhancement is allowed only when the behavior is demonstrably idempotent and there is no direct render/event integration point available.
   - Multiple observers enhancing the same DOM subtree or component are prohibited.
   - Consolidation should move enhancements into the canonical render path wherever possible.

8. CSS OWNERSHIP
   - Production must not depend on a chain of old version stylesheets overriding one another.
   - A component/domain must have one canonical current stylesheet ownership path.
   - `!important` must not be used to resolve conflicts between SafeTrack historical versions.
   - Responsive and print rules must live with or be explicitly imported by the canonical component stylesheet.
   - Historical `printfix`, `iphone-pagefix`, dashboard-fix and hierarchy-fix styles must be absorbed into canonical styles before their predecessor stylesheets are removed.

9. PRINT OWNERSHIP
   - Individual printing and group printing must each have exactly one current controller.
   - Only one module may call/dispatch the native browser print lifecycle for a given print workflow.
   - Historical print handlers and historical print CSS must not remain active after their behavior is migrated.
   - `PRINT_RULES.md` remains the canonical functional and physical-layout specification.

10. DATA AND MIGRATIONS ARE DIFFERENT FROM RUNTIME VERSIONS
   - Legacy database table names such as `documents_v023` may remain for backward data compatibility.
   - A one-time/idempotent data migration may remain temporarily if required, but it must not own UI, navigation, printing or recurring DOM behavior.
   - Data compatibility is not justification for loading historical frontend runtime versions.

11. TRANSITION EXCEPTION
   - During a controlled consolidation migration, old and new implementations may temporarily exist in the repository, but production may not execute both for the same domain.
   - If a temporary dual path is unavoidable, it must be mutually exclusive behind one explicit migration switch/feature flag, with a documented removal step in the same consolidation plan.
   - Event-order tricks are not a valid feature flag.

12. INDEX.HTML RELEASE GATE
   Before every publication, audit the production `index.html`.
   Release is blocked if:
   - historical SafeTrack runtime versions for already consolidated domains are still loaded;
   - more than one active module owns the same domain;
   - multiple SafeTrack modules overwrite `window.print`;
   - a new `*-fix`, `*-compat` or version-overlay file was added instead of modifying the canonical owner;
   - old and new component CSS are both required solely because one overrides the other.

13. NEW PRODUCT VERSION PROCESS
   - A user-visible product version increase does not create a parallel runtime layer.
   - Start from the current canonical source, change that source, test it, and publish one resulting runtime.
   - Historical release recovery is handled by Git/AppDeploy rollback, not by keeping all historical releases active in the browser.

14. CONSOLIDATION BEFORE NEW OVERLAYS
   - While SafeTrack v0.24 still contains historical layered runtime code, fixes in affected domains should preferentially consolidate ownership instead of adding another override layer.
   - No new historical-version stacking may be introduced from this rule's adoption onward.

15. REQUIRED PRE-CODING CHECK
   For every modification:
   1. Review `RESEARCH_RULES.md`.
   2. Review this file.
   3. Identify the canonical owner of the affected domain.
   4. Search active source for duplicate handlers, observers, global overrides and CSS ownership.
   5. Modify the canonical owner only, unless the approved scope is an explicit consolidation step.

16. REQUIRED POST-CODING CHECK
   - Audit production `index.html` load chain.
   - Search for duplicate global overrides and action handlers in the changed domain.
   - Verify no new version-overlay file was introduced.
   - Run domain regression QA and the mandatory platform-specific QA rules.

## Migration principle
SafeTrack v0.24 will use incremental legacy displacement: migrate one domain at a time into a canonical current module, verify parity, then remove that domain's historical runtime from production. This is an incremental replacement strategy, not a big-bang rewrite and not permanent dual execution.

## Rule priority
This file is canonical for frontend runtime/version architecture. If an older project note or historical implementation conflicts with it, this file takes precedence unless the user explicitly approves a new architecture rule.
