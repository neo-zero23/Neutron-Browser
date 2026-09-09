# Neutron Browser v1.1 — Plan final (funciones)

Última versión con agregado de funciones. No se toca Adblock, LightSession ni bugs dados por fixed.

Decisiones del dueño:
- Wizard temporal (`ui/onboarding.html`) se reemplaza por Setup Wizard real de 5 pasos.
- Linux prioridad AppImage opción B: compilar en contenedor Ubuntu 22.04 para compatibilidad general, aunque el host sea Arch.
- AUR también.
- Inno Setup en Windows 11 con asociación de navegador predeterminado (http/https/.html).

## Fase 1 — Setup Wizard in-app (cross-platform, se hace en Arch)

Archivos:
- NUEVO `ui/setup-wizard.html` + `ui/setup-wizard.css` + `ui/setup-wizard.js` (5 pasos: 1 Bienvenida/idioma-tema, 2 Buscador/densidad/acento, 3 Shield/privacidad, 4 Perfil/import backup, 5 Listo).
- MOD `preload-onboarding.js`: expone `sendComplete(fullConfig)` + `getDefaults()`.
- MOD `main.js`: `createOnboardingWindow()` carga `setup-wizard.html` (640x700), handler `onboarding-complete` guarda objeto completo (`language, theme, searchEngine, density, accentColor, shieldEnabled, blockAds, blockTrackers, doNotTrack, disableWebRTC`), `settings.html` botón "Repetir asistente" vía `firstLaunch=true`.
- MOD `ui/i18n.js`: claves `onboarding.wizard.*` en es/en (+pt/fr mínimo).

Verificación: borrar `userData/neutron-config.json`, `npm start`, pasar wizard, restart sin wizard, re-run desde settings.

## Fase 2 — Linux AppImage (B) desde Arch

- `package.json`: `dist:appimage = electron-builder --linux AppImage`, completar `build.linux` con `maintainer, desktop {Name, Comment, MimeType, Categories Network;WebBrowser}`, `artifactName Neutron-Browser-1.1.0.AppImage`.
- Deps Arch host: `base-devel, fuse2/fuse3, libvips`, `npm rebuild sharp`.
- Build compatible: `distrobox create --image ubuntu:22.04` o `docker run -v $PWD:/app ubuntu:22.04`, dentro `npm ci + npm run dist:appimage`.
- Fixes Linux: UA sin `Windows NT`, fonts locales (hoy Google Fonts online), probar `frame:false` Wayland/X11 con `--ozone-platform-hint=auto`, `xdg-open`, `dialog`.
- `README`: sección Linux `chmod +x + ./AppImage`.
- Verificación: AppImage corre en Arch + Ubuntu 22.04 live, `ldd`, wizard dentro del AppImage.

## Fase 3 — Windows 11 Inno Setup

- NUEVO `installer/windows/neutron.iss` (Inno 6): Bienvenida > LICENSE GPLv3 > `%ProgramFiles%/Neutron Browser` > iconos escritorio/inicio > asociación http/https/.html (`Capabilities + StartMenuInternet`, checkbox marcado) > Instalar > Launch.
- `package.json`: `dist:win-dir` (carpeta para que Inno empaquete), desactivar `nsis oneClick` para no duplicar. Reutiliza `assets/new-logo.ico`.
- Verificación en partición Win11: install limpia, http abre Neutron, desinstalar limpia. SmartScreen seguirá avisando (sin firma) — mantener doc VirusTotal del README.

## Fase 4 — AUR + Releases

- NUEVO `packaging/aur/PKGBUILD + neutron.desktop + .SRCINFO`, `pkgver=1.1.0`.
- Releases GitHub v1.1: subir `*.AppImage` + `Setup-Neutron-1.1.0.exe` (Inno).

## Flujo dual-boot (Win11 + Arch)

1. Quedarse en Arch: wizard + AppImage container (0 reinicios).
2. Reboot a Win11 una vez: compilar `.iss` + test install (1 reinicio).
3. Todo sincronizado por `git push/pull`, no copias manuales a Documentos.
