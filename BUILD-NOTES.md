# Build Notes - spardutti-todo

## Windows Installer Build Requirements

### Native Windows (Recommended for Production)
Building the Windows installer (`.exe` and `latest.yml`) on **native Windows** is the most reliable approach:

```bash
npm run make
```

This will generate:
- `out/make/squirrel.windows/x64/spardutti-todo-1.0.0 Setup.exe` - Windows installer
- `out/make/squirrel.windows/x64/RELEASES` - Auto-update metadata
- `out/make/squirrel.windows/x64/spardutti-todo-1.0.0-full.nupkg` - NuGet package

### WSL/Linux (Development Only)
Building Windows installers from WSL requires Wine and Mono, but electron-winstaller has strict detection requirements that may not work reliably:

```bash
# Attempt to install dependencies (may not fully resolve detection issues)
sudo dpkg --add-architecture i386
sudo apt update
sudo apt install wine64 wine32:i386 mono-complete

# Try building
npm run make -- --platform=win32
```

**Known Limitation:** Even with Wine/Mono installed, electron-winstaller may fail to detect them properly in WSL environments. This is a known issue with the packaging tool's environment detection.

### GitHub Actions CI/CD (Recommended Alternative)
Set up GitHub Actions to build for both Windows and Linux automatically. Example workflow:

```yaml
name: Build

on: [push, pull_request]

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run make
      - uses: actions/upload-artifact@v3
        with:
          name: windows-installer
          path: out/make/**/*.exe
```

## Auto-Update System

### Configuration
The auto-update system is configured to use GitHub Releases:

1. **package.json** - Repository URL points to GitHub repo
2. **forge.config.ts** - Squirrel.Windows maker configured
3. **electron/updater.ts** - electron-updater initialized with logging

### Publishing Updates

1. Build installer on Windows (or via GitHub Actions)
2. Create a new GitHub Release with semantic versioning (e.g., `v1.0.1`)
3. Upload the following files to the release:
   - `spardutti-todo-X.X.X Setup.exe`
   - `RELEASES` file
   - `spardutti-todo-X.X.X-full.nupkg`

The app will automatically check for updates on launch and download them in the background.

### Testing Auto-Update Locally

1. Build version 1.0.0 installer
2. Install the app
3. Update `package.json` version to 1.0.1
4. Build version 1.0.1 installer
5. Create a GitHub Release with v1.0.1 tag
6. Upload installer files to the release
7. Launch the 1.0.0 installed app - it should detect and download the update

## Development Testing

For development without building installers:

```bash
# Run app in development mode
npm start

# Check logs in: ~/AppData/Roaming/spardutti-todo/logs/
```

Logs will show update check attempts even in development mode.

## References

- [Electron Forge Documentation](https://www.electronforge.io/)
- [electron-updater Documentation](https://www.electron.build/auto-update)
- [Squirrel.Windows](https://github.com/Squirrel/Squirrel.Windows)
