# Record Context Surface

Shared form-side context panel runtime extracted from the workspace shell.

This package owns:
- record-context slot normalization and DOM sync
- record-context source contracts
- relational and partner-commercial shared adapters

This package must stay generic:
- no CFDI naming
- no invoice-only copy
- no local business fallbacks

Consumers should provide only schema/config:
- `slots`
- `source`
- `recordFieldMap`
- `partnerFieldMap`
- `formFieldMap`
- `watchFieldNames`
- optional `enrichData`
- optional `resolvePartnerRecord` or role-specific partner resolvers when a project needs non-id partner resolution
- optional `formPartnerResolution` when a form can expose a selected many2one label before the parent record has an id

The shared partner-commercial adapter resolves partners by explicit many2one ids from the record by default. It can also resolve visible form labels only when consumers opt in with `formPartnerResolution: { enabled: true }`; role-specific resolvers remain available for custom matching.
