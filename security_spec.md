# Security Specification & Threat Model (Tether VoC)

## 1. Data Invariants
1. A user profile at `/users/{userId}` can only be created or updated if `request.auth.uid == userId`.
2. Identity spoofing is strictly prohibited: `incoming().userId == request.auth.uid` and `incoming().uid == request.auth.uid`.
3. An unauthenticated user (`request.auth == null`) has ZERO read or write access to any collection.
4. Timestamps (`createdAt`, `updatedAt`) must match `request.time` during writes.
5. All string fields must have strict length boundaries (`<= 128` for IDs, `<= 100000` for message content, `<= 256` for titles).
6. A user cannot access or list any other user's conversations, messages, or saved audits.
7. Sub-resources (`conversations`, `messages`, `savedAudits`) are strictly scoped under the authenticated owner `/users/{userId}`.

## 2. The "Dirty Dozen" Threat Payloads
1. **Payload 1 (Identity Hijack):** Unauthenticated POST to `/users/attacker_uid` -> Expect PERMISSION_DENIED.
2. **Payload 2 (Cross-Tenant Steal):** User B attempts GET on `/users/UserA/conversations/conv1` -> Expect PERMISSION_DENIED.
3. **Payload 3 (Ghost Field Injection):** Create conversation with unauthorized field `isAdmin: true` -> Expect PERMISSION_DENIED.
4. **Payload 4 (Orphaned Message):** User A tries to insert a message with `userId: 'victim_uid'` under their own path -> Expect PERMISSION_DENIED.
5. **Payload 5 (Denial of Wallet String Injection):** Insert message with 50MB content string exceeding limit -> Expect PERMISSION_DENIED.
6. **Payload 6 (Path ID Poisoning):** Insert document with invalid characters or 2KB document ID -> Expect PERMISSION_DENIED.
7. **Payload 7 (Immutable Field Tamper):** Update conversation modifying original `createdAt` or `userId` -> Expect PERMISSION_DENIED.
8. **Payload 8 (Blanket Query Scraping):** Attempt `list` on `/users` collection without user boundary -> Expect PERMISSION_DENIED.
9. **Payload 9 (Spoofed Client Timestamp):** Pass custom past timestamp instead of `request.time` -> Expect PERMISSION_DENIED.
10. **Payload 10 (Delete Victim Resource):** User B issues DELETE request on `/users/UserA` -> Expect PERMISSION_DENIED.
11. **Payload 11 (Non-Whitelisted Model/Role):** Inject malicious arbitrary string in `model` field -> Expect PERMISSION_DENIED.
12. **Payload 12 (Root Document Bypass):** Attempt read/write on arbitrary unmapped path `/system_logs/log1` -> Expect PERMISSION_DENIED.
