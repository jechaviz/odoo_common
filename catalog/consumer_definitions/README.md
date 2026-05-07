# Consumer Definitions

Definiciones declarativas de como cada proyecto consumidor debe traer paquetes canonicos desde `common`.

Estas definiciones no reemplazan los adapters de proyecto. Solo fijan:

- workspace consumidor
- componentes canonicos permitidos
- targets generados
- herramienta de sync
- evidencia minima requerida antes de migrar codigo del consumidor

Reglas:

- no listar paquetes retirados
- no usar rutas absolutas como targets
- no declarar `..` en targets
- no usar aliases de componentes
- no copiar archivos manualmente fuera de la herramienta declarada
