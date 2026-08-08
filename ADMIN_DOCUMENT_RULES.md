# SafeTrack – Mandatory Admin Document Rules

Status: mandatory project rule.

## Permanent document deletion

1. The permanent document deletion feature is an administrative destructive action.
2. In the current prototype, where no real authentication/role system exists yet, the feature may be visible in the admin UI only as a provisional administrative function.
3. As soon as SafeTrack gains authentication and role-based authorization, permanent document deletion MUST be restricted to the highest administrative role (Super Admin / highest admin profile) in both the frontend and the backend endpoint. Hiding the button in the UI alone is not sufficient authorization.
4. The backend must reject hard-delete requests from every role below Super Admin once role-based authorization exists.
5. Permanent deletion requires explicit document selection and a separate irreversible-action confirmation step. The canonical confirmation phrase is `ENDGÜLTIG LÖSCHEN` unless the product specification is explicitly changed.
6. A hard delete removes the selected ST-DOC record, its STPG/page records, stored digital originals, returned scan files belonging exclusively to that document, OCR/review associations and document completion records.
7. If one upload is associated with multiple ST-DOC documents, deleting one document must not delete records or files still required by another document.
8. Employee master data, training master data, organizational data and the ST-DOC counter must never be removed by document hard delete.
9. A previously issued ST-DOC identifier must never be reused after deletion. The document counter is monotonic.
10. Bulk permanent deletion must remain bounded and must present the exact selected ST-DOC identifiers before confirmation.
11. Automated QA must never permanently delete production/prototype user data. Destructive endpoint behavior must be tested with isolated fixtures or guardrail checks, not by deleting arbitrary live documents.
12. Automated QA and print-preview tests must not leave persistent ST-DOC fixtures in the normal Documents register.
13. Any future change to hard-delete scope, authorization, confirmation behavior, storage cleanup or counter handling requires review of this entire rule file before implementation.
