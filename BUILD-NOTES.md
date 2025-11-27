# Build Notes - spardutti-todo

## Platform-Specific Build Commands

### Windows (NSIS Installer)

```bash
npm run dist:win
```

Generates in `dist/`:
- `spardutti-todo-Setup-{version}.exe` - Windows NSIS installer
- `latest.yml` - Auto-update metadata for electron-updater

### Linux (AppImage)

```bash
npm run dist:linux
```

Generates in `dist/`:
- `spardutti-todo-{version}-x64.AppImage` - Portable Linux application
- `latest-linux.yml` - Auto-update metadata for electron-updater

## Build Requirements

### Windows
- **Native Windows (Recommended):** Most reliable approach for production builds
- **WSL/Linux:** Requires Wine and Mono; may not work reliably due to electron-winstaller environment detection issues

### Linux
- **Native Linux or Ubuntu:** Best for AppImage builds
- Dependencies are handled by npm; no additional system packages typically required

## CI/CD Pipeline (GitHub Actions)

The project uses GitHub Actions for automated multi-platform builds. The workflow (`.github/workflows/build.yml`) provides:

### Triggers
- **Push to master/main:** Runs tests and builds artifacts
- **Pull requests:** Validates code changes
- **Version tags (v*.*.*):** Creates GitHub Release with all platform artifacts
- **Manual dispatch:** Trigger builds on-demand

### Jobs
1. **build-windows:** Runs on `windows-latest`, produces `.exe` + `latest.yml`
2. **build-linux:** Runs on `ubuntu-latest`, produces `.AppImage` + `latest-linux.yml`
3. **release:** Collects artifacts from both jobs and uploads to GitHub Release (tag pushes only)

### Release Artifacts
When a version tag is pushed (e.g., `v1.2.0`), the release includes:
- `spardutti-todo-Setup-{version}.exe` (Windows installer)
- `spardutti-todo-{version}-x64.AppImage` (Linux portable)
- `latest.yml` (Windows auto-update metadata)
- `latest-linux.yml` (Linux auto-update metadata)

### Creating a Release

```bash
# 1. Update version in package.json
npm version patch  # or minor/major

# 2. Push the tag to trigger release workflow
git push origin v{version}  # e.g., git push origin v1.2.0

# 3. GitHub Actions will:
#    - Run tests and lint
#    - Build Windows and Linux artifacts
#    - Create GitHub Release with all files
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
