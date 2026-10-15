# History is fetched on demand, not mirrored into local storage

History is the only unbounded list in Trakify: Trakt records one entry per Play, so a
`SyncDataService` mirror would grow a localStorage store forever and make every sync page through
the whole history to keep it fresh. The History tab instead reads
`GET /users/me/history/episodes?page=n&limit=50` through a paginated TanStack Query and pages
through it with infinite scroll — nothing survives a reload, and there is no local Play store, so
none of the gate/version bookkeeping in `docs/agents/sync-flow.md` applies.

Because there is no local store to update optimistically, `ExecuteService` invalidates the History
query whenever a Play is added or removed (marking an Episode, Season or Show seen, or unmarking
it); a mounted History tab then refetches. This is the documented exception to the "Sync" term in
`GLOSSARY.md`, which describes fetching the User's Trakt data into local storage.
