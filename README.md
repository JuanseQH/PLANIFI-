# PLANIFI

Aplicación híbrida de finanzas personales. Conserva el diseño convertido desde Figma y funciona como una Single Page Application (SPA) con JavaScript, SASS y Vite, lista para empaquetarse más adelante con Capacitor.

## Tecnologías

- HTML5
- SASS/SCSS
- JavaScript (ES modules, Vanilla)
- Vite
- npm
- Inter (local, `@fontsource/inter`)

## Instalación

```bash
git clone <URL-DEL-REPOSITORIO>
cd html_Planifi
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre la URL que muestre Vite (por defecto `http://localhost:5173`).

## Producción

```bash
npm run build
```

El bundle autocontenido queda en `dist/`. Las rutas usan `base: './'` para funcionar en `file://` y en WebView.

## Preview

```bash
npm run preview
```

Sirve el contenido de `dist/` para verificar el build.

> **Nota:** la carpeta de esta entrega incluye el carácter `#` en su ruta. Vite no resuelve bien esas rutas, así que los scripts `dev`, `build` y `preview` ejecutan Vite desde una copia temporal segura y, en el caso de `build`, copian el resultado otra vez a `dist/`. Si clonas el repo en una ruta sin `#` ni `?`, Vite corre de forma directa.

## Figma

Prototipo de diseño (vistas originales):

https://www.figma.com/design/95aPZ56CSS6jjdsZCEBnrD/PLANIFI-%E2%80%94-Vistas-de-Dise%C3%B1o?node-id=0-1

Navegación de referencia (Figma Make):

https://www.figma.com/make/1Sj3obO8QUNSqSuOYX2XgA/PLANIFI---Aplicación-Móvil-de-Finanzas-Personales

Si el enlace del curso es otro, reemplázalo aquí: `[AGREGAR ENLACE DE FIGMA AQUÍ]`

## Integrantes

- Nicolás Castrillón Cardona
- Juan Sebastian Quintero

## Notas de uso

- La navegación principal está en la barra inferior: **Inicio**, **Análisis** y **Ajustes**.
- **Mi cuenta** se abre desde la marca PLANIFI en la pantalla de inicio.
- Los gastos, ingresos, transferencias, perfil y toggles de configuración se guardan en `localStorage`.
- No hay dependencias de CDN ni de Google Fonts: la app puede usarse sin Internet después de `npm run build`.
