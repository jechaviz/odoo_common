# Declarative Phase Runtime Contracts

Helpers canonicos para describir fases de ejecucion y construir payloads de estado/error.

## Contrato Publico

El modulo expone:

- `PhaseSpec`
- `FailurePolicy`
- `build_phase_runner_kwargs(phase, phase_context)`
- `build_phase_status_payload(phase, status, message=None)`
- `build_phase_error_payload(phase, error_type, message, details=None)`
- `serialize_phase_error_payload(phase, exc, details=None)`
- `should_run_phase(phase, phase_context)`

## Responsabilidad

- validar specs declarativas de fases
- decidir skip flags declarados por fase
- reenviar solo argumentos explicitamente declarados
- construir payloads normalizados de estado y error

## No Incluye

- ejecucion de runners
- logging
- retries o backoff
- manejo silencioso de excepciones
- conexion Odoo
- politicas de instalacion parcial
