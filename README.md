# 🔥 Neutron Browser (Early Beta)
Neutron browser is a browser I made out of boredom and for fun. Honestly, it's based on Chromium and was made with Electron.js.
Its main goal is to be simple and allow easy browsing. At first
I wasn't going to release it, but I decided to do so so more people could try it and form their own opinions :)

Images:

<img width="1918" height="1021" alt="Captura de pantalla 2026-06-28 121956" src="https://github.com/user-attachments/assets/929f3719-aa12-481a-b5bb-e25f844e1880" />

Typical resource usage (tested on a laptop with 8GB of RAM)
<img width="793" height="34" alt="Captura de pantalla 2026-06-02 084642" src="https://github.com/user-attachments/assets/4b697471-1ad9-4a61-8fef-3dfee200963b" />

Features:
- browsing
- browsing
- browsing +
- and browsing

Ok now seriously, this browser's actual features are:

**Browsing & UI**
* Sidebar with vertical tabs, favorites, and shortcuts
* Custom backgrounds & colors, light/dark mode
* Adjustable density (compact, comfortable, wide)
* Home button, multiple search engines
* Built-in banner adblock (RIP, Fandom wiki popups 🙏)

**Performance**
* Tab Discarding — auto-frees RAM on inactive tabs
* Process Manager with real-time CPU/RAM monitoring (Konami code: ↑↑↓↓←→←→BA 👀)
* Hardware acceleration (toggleable in settings)
* Smart favicon fallback chain

**Privacy & Profiles**
* User Profiles with custom avatars, names, and colors
* Atomic Mode (guest/incognito)
* History & downloads manager

**Compatibility**
* Widevine & video codec support
* Broad site compatibility

**Customization & Tools**
* Fullscreen, zoom, DevTools
* Keyboard shortcuts
* Languages: English & Spanish (stable), Portuguese & French (in testing)

Platforms:
- windows x64 (Setup-Neutron-1.1.0.exe via Inno Setup, v1.1)
- linux x86_64 (Neutron-Browser-1.1.0 AppImage, v1.1 + AUR neutron-browser)

<img width="256" height="256" alt="animmm" src="https://github.com/user-attachments/assets/fc7dc45c-6bfb-4b5b-9b8a-c95c187e09ae" />

Resource usage typically during heavy tasks such as videos on youtube or twitch (tested on a laptop with 8GB of RAM)

<img width="783" height="31" alt="Captura de pantalla 2026-06-02 085114" src="https://github.com/user-attachments/assets/48f63262-27db-4f2d-817e-d605d3a4609f" />

🚀 Installation (The Guide for Humans and Toasters and potatoes)

### Windows 11 (v1.1)
1. Download `Neutron-Browser-Setup-1.1.0-win-x64.exe` from Releases.
2. Run installer, accept GPLv3, choose folder, keep checked "Usar Neutron como navegador predeterminado" if you want http/https/.html association.

### Linux (v1.1 AppImage, Ubuntu-compatible)
1. Download `Neutron-Browser-1.1.0-linux-x86_64.AppImage` from Releases.
2. `chmod +x Neutron-Browser-*.AppImage && ./Neutron-Browser-*.AppImage`
3. Arch: also available as AUR `neutron-browser` (`yay -S neutron-browser`). Needs `fuse2`, on Wayland run with `--ozone-platform-hint=auto` if frameless drag fails.

### Legacy .zip
1. Download the ".zip" file from the Releases section.

2. Optional: If Windows Defender or another antivirus gets a little paranoid, it is most likely a false positive. You can verify the file yourself using VirusTotal if you want.

   If a warning appears, click "More info" and then "Run anyway".

3. Extraction: Locate the downloaded ".zip" file, right-click it, and select "Extract All...".

   Recommendation: Create a new folder before extracting the files to keep everything organized.

4. Launch: Open the extracted folder and run "Neutron_Browser.exe".

5. If Windows shows another security warning, click "More info" and then "Run anyway".

6. Done! Neutron Browser is now ready to use.

---

!!! A Quick Note

Neutron Browser will not harm your device or steal your data.

Windows may display security warnings because the application is not digitally signed by a certificate recognized by Microsoft. This is common for independent and open-source projects.

If you would like to verify the file yourself, you can scan it using services such as VirusTotal.

In current testing, the executable received a 0 detections result.

<img width="1915" height="926" alt="Captura de pantalla 2026-06-02 203553" src="https://github.com/user-attachments/assets/a25a7d5d-5e69-453f-81e5-d0b1e8f91a55" />


## 🙏 Credits

1. Ad-Blocking Engine
Since version v1.1.0, Neutron Browser has integrated the @cliqz/adblocker v1.34.0 content-blocking engine as a core component for privacy protection.

Original author: Cliqz / Ghostery.

License: Mozilla Public License 2.0 (MPL-2.0).

Maintenance note: This package was recently renamed to @ghostery/adblocker by its new maintainer (Ghostery), which now uses it as the foundation for its own extensions.

2. Filter Lists (Blocking Rules)
The rules processed by the engine come from the community, ensuring an up-to-date experience:

EasyList (and EasyPrivacy):

Dual License: GNU General Public License v3.0 (GPL-3.0) or Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0).

Attribution: "The EasyList authors" must be acknowledged as the source of the material.

3. LightSession (ChatGPT Optimization)
The DOM optimization feature for long ChatGPT conversations uses light-session.

Author: 11me / LightSession Contributors.

License: MIT License (Copyright © 2025 LightSession Contributors).


## 📜 License
This project is open-source and protected under the **GNU General Public License v3.0 (GPL-3.0)**. See the `LICENSE` file for more details.




