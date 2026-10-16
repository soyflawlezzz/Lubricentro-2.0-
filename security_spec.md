# Security Specification - LUBRICENTRO 2.0

## 1. Data Invariants
- Only authenticated users can access the database.
- Multi-Branch Access Control:
  - Users with role `ADMINISTRADOR` can view and modify documents across all branches (`escobar`, `maschwitz`, and global).
  - Users with role `USUARIO_SUCURSAL` can ONLY read and write data that belongs to their assigned branch (`resource.data.branchId == request.auth.token.branchId` or matched via user profile in Firestore).
  - Cross-branch snooping or writes are strictly denied.
- Soft-delete pattern: Records must retain identity and historical integrity.
- Critical mutations (expenses, sales, work order statuses) record audit user IDs and valid timestamps.

## 2. Dirty Dozen Payloads (Intended to be rejected)
1. Unauthenticated read/write to any collection.
2. Branch user from Escobar attempting to read work orders from Maschwitz.
3. Branch user from Maschwitz attempting to create an expense belonging to Escobar.
4. Non-admin user attempting to alter another user's role to `ADMINISTRADOR`.
5. Non-admin user attempting to modify global company settings or branch definitions.
6. Creation of WorkOrder with empty or malformed `licensePlate` (> 20 characters).
7. Creation of Sale with negative total or spoofed payment amount.
8. Injection of arbitrary fields (> 10KB junk string) in user documents.
9. Deletion of work orders by unauthorized branch users.
10. Attempt by unauthenticated actor to scrape client list (PII protection).
11. Attempt to update `createdAt` or `createdBy` audit trail fields.
12. Attempt to bypass branch filter and execute blanket cross-tenant queries.
