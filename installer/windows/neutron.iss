; Neutron Browser v1.1.0 — Inno Setup para Windows 11 x64
; Compilar con Inno Setup 6. Requiere haber corrido `npm run dist:win-dir`
; que deja los archivos en dist\win-unpacked.

#define MyAppName "Neutron Browser"
#define MyAppVersion "1.1.0"
#define MyAppPublisher "Jesus"
#define MyAppURL "https://github.com/neo-zero23/Neutron-Browser"
#define MyAppExeName "Neutron Browser.exe"
#define SrcDir "..\\..\\dist\\win-unpacked"

[Setup]
AppId={{8C9E6F2A-3B4D-4E1A-9F5A-NEUTRON11}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\Neutron Browser
DefaultGroupName=Neutron Browser
DisableProgramGroupPage=yes
LicenseFile=..\..\LICENSE
SetupIconFile=..\..\assets\new-logo.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=lowest
OutputDir=..\..\dist
OutputBaseFilename=Neutron-Browser-Setup-1.1.0-win-x64
; Asociar http/https/.html como navegador (checkbox marcado por defecto)
ChangesAssociations=yes

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "french"; MessagesFile: "compiler:Languages\French.isl"
Name: "portuguese"; MessagesFile: "compiler:Languages\Portuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "associate"; Description: "Usar Neutron como navegador predeterminado (http/https/.html)"; GroupDescription: "Navegador predeterminado:"; Flags: checkedonce

[Files]
Source: "{#SrcDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Neutron Browser"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\Neutron Browser"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Registry]
; Registro de aplicación + capabilities para "Default Apps" Win11
Root: HKCU; Subkey: "Software\Neutron Browser"; ValueType: string; ValueName: "Version"; ValueData: "{#MyAppVersion}"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\RegisteredApplications"; ValueType: string; ValueName: "Neutron Browser"; ValueData: "Software\Clients\StartMenuInternet\Neutron Browser\Capabilities"; Flags: uninsdeletevalue; Tasks: associate
Root: HKCU; Subkey: "Software\Clients\StartMenuInternet\Neutron Browser"; ValueType: string; ValueName: ""; ValueData: "Neutron Browser"; Flags: uninsdeletekey; Tasks: associate
Root: HKCU; Subkey: "Software\Clients\StartMenuInternet\Neutron Browser\Capabilities"; ValueType: string; ValueName: "ApplicationName"; ValueData: "Neutron Browser"; Tasks: associate
Root: HKCU; Subkey: "Software\Clients\StartMenuInternet\Neutron Browser\Capabilities"; ValueType: string; ValueName: "ApplicationDescription"; ValueData: "Fast, private and optimized browser"; Tasks: associate
Root: HKCU; Subkey: "Software\Clients\StartMenuInternet\Neutron Browser\Capabilities\URLAssociations"; ValueType: string; ValueName: "http"; ValueData: "NeutronHTML"; Tasks: associate
Root: HKCU; Subkey: "Software\Clients\StartMenuInternet\Neutron Browser\Capabilities\URLAssociations"; ValueType: string; ValueName: "https"; ValueData: "NeutronHTML"; Tasks: associate
Root: HKCU; Subkey: "Software\Classes\NeutronHTML"; ValueType: string; ValueName: ""; ValueData: "Neutron HTML Document"; Flags: uninsdeletekey; Tasks: associate
Root: HKCU; Subkey: "Software\Classes\NeutronHTML\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""; Tasks: associate
Root: HKCU; Subkey: "Software\Classes\.html"; ValueType: string; ValueName: ""; ValueData: "NeutronHTML"; Tasks: associate

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
