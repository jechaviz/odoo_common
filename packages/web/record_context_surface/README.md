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
