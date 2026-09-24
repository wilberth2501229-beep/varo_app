# SBOM — Varo App

Software Bill of Materials de Varo, una app web de finanzas personales (React + Vite + Supabase).

- **Fecha de generación:** 2026-09-24
- **Herramienta:** `npm sbom` (integrada en npm 11.8.0, Node 24.13.1)
- **Fuente:** `package-lock.json`

## Archivos

| Archivo | Formato | Alcance | Componentes |
|---|---|---|---|
| `varo-sbom.cdx.json` | CycloneDX 1.5 | Todas las dependencias (producción + desarrollo) | 222 |
| `varo-sbom.spdx.json` | SPDX 2.3 | Todas las dependencias | 223 paquetes (incluye la app) |
| `varo-sbom-produccion.cdx.json` | CycloneDX 1.5 | Solo dependencias de ejecución (navegador y función serverless) | 20 |

Para regenerarlos:

```bash
npm sbom --sbom-format cyclonedx > sbom/varo-sbom.cdx.json
npm sbom --sbom-format spdx > sbom/varo-sbom.spdx.json
npm sbom --sbom-format cyclonedx --omit dev > sbom/varo-sbom-produccion.cdx.json
```

## Dependencias directas

**Producción:** `@supabase/supabase-js`, `@tanstack/react-query`, `react`, `react-dom`, `zustand`, `resend` (envío de emails desde la función serverless `api/send-email.js`)

**Desarrollo:** `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`, `eslint` y sus plugins, `globals`, tipos de React

## Licencias (222 componentes)

| Licencia | Componentes | Tipo |
|---|---|---|
| MIT | 178 | Permisiva |
| Apache-2.0 | 16 | Permisiva (con cláusula de patentes) |
| ISC | 13 | Permisiva |
| BSD-2-Clause | 6 | Permisiva |
| BSD-3-Clause | 2 | Permisiva |
| MPL-2.0 | 2 | Copyleft débil (por archivo) |
| CC-BY-4.0 | 1 | Atribución (datos, no código) |
| BlueOak-1.0.0 | 1 | Permisiva |
| 0BSD | 1 | Equivalente a dominio público |
| MIT-0 | 1 | Equivalente a dominio público |
| Unlicense | 1 | Dominio público |

Todas son licencias libres/abiertas aprobadas por OSI o FSF. No hay licencias copyleft fuertes (GPL, AGPL).

**Casos a notar:**
- `lightningcss` (MPL-2.0): copyleft débil. Solo se usa en la compilación y no se distribuye modificado, así que no impone obligaciones al código de Varo.
- `caniuse-lite` (CC-BY-4.0): es una base de datos de compatibilidad de navegadores, no código. Se usa solo en la compilación.
- De los 20 componentes de producción, 17 son MIT y los otros 3 son equivalentes a dominio público: `tslib` (0BSD), `postal-mime` (MIT-0) y `fast-sha256` (Unlicense).

## Vulnerabilidades

`npm audit` (2026-09-24): **0 vulnerabilidades conocidas**, tanto en producción como en desarrollo.

## Limitaciones

- **Dependencia no declarada (corregida):** la primera versión de este SBOM no incluía `resend` porque `api/send-email.js` lo importaba sin que estuviera en `package.json`. Se detectó al revisar el SBOM y se corrigió agregándolo como dependencia (v6.28.1).
- **Servicios externos no incluidos:** el SBOM cubre paquetes npm, no servicios en la nube que la app consume (Supabase, Vercel, Resend) ni las fuentes cargadas desde Google Fonts (Cormorant Garamond y Jost, ambas bajo SIL Open Font License 1.1).
