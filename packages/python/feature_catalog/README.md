# Declarative Feature Catalog

Helpers canonicos para declarar features instalables y validar listas de instalacion.

## Contrato publico

El modulo expone:

- `FeatureSpec`
- `index_features(features)`
- `serialize_features(features)`
- `validate_install_list(features, install_list)`

## Responsabilidad

- normalizar feature keys y metadata
- rechazar keys duplicadas
- serializar specs para reportes/catalogos
- validar que una lista de instalacion solo use features instalables
- validar dependencias instalables requeridas

## No Incluye

- ejecucion de runners
- captura de excepciones con fallback
- logging/orquestacion
- defaults de negocio
- instalacion parcial silenciosa
