# GitHub Actions Workflows

This directory contains the GitHub Actions workflows for building, testing, and releasing the Electron application.

## Workflows

### 1. Build and Release (`build.yml`)

**Triggers:**
- Push to tags starting with `v*` (e.g., `v1.0.4`)
- Manual workflow dispatch

**What it does:**
- Builds the application for Windows, macOS, and Linux
- Creates distributable packages (.exe, .dmg, .AppImage, etc.)
- Creates a GitHub release with all artifacts
- Generates release notes automatically
- Publishes the app for auto-updates

**Usage:**
```bash
# Create a new release (recommended)
npm run release:patch  # 1.0.4 → 1.0.5
npm run release:minor  # 1.0.4 → 1.1.0
npm run release:major  # 1.0.4 → 2.0.0

# Or manually
git tag v1.0.5
git push origin v1.0.5
```

### 2. Test Build (`test-build.yml`)

**Triggers:**
- Pull requests to main branch
- Manual workflow dispatch

**What it does:**
- Tests builds on all platforms without creating releases
- Runs tests and builds the application
- Uploads build artifacts for review
- Perfect for testing changes before release

## Release Process

### Automated Release (Recommended)

The easiest way to create a release is using the provided scripts:

```bash
# Patch release (bug fixes)
npm run release:patch

# Minor release (new features)
npm run release:minor

# Major release (breaking changes)
npm run release:major
```

These scripts will:
1. ✅ Bump the version in `package.json`
2. ✅ Create a git tag (e.g., `v1.0.5`)
3. ✅ Push changes and tag to GitHub
4. ✅ Trigger the GitHub Actions workflow
5. ✅ Build for all platforms (Windows, macOS, Linux)
6. ✅ Create a GitHub release with download links
7. ✅ Enable auto-updates for users

### Manual Release

If you prefer to do it manually:

```bash
# 1. Bump version
npm version patch  # or minor/major

# 2. Create and push tag
git tag v1.0.5
git push origin v1.0.5
```

## Best Practices

### Version Management

1. **Use semantic versioning:**
   ```bash
   npm run release:patch  # 1.0.4 → 1.0.5 (bug fixes)
   npm run release:minor  # 1.0.4 → 1.1.0 (new features)
   npm run release:major  # 1.0.4 → 2.0.0 (breaking changes)
   ```

2. **Release frequently:**
   - Small, frequent releases are better than large, infrequent ones
   - Users get updates faster
   - Easier to track down issues

### Development Workflow

1. **Create feature branch:**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes and test locally:**
   ```bash
   npm run build
   npm run electron:dist
   ```

3. **Create pull request:**
   - This triggers test builds
   - Review the results before merging

4. **Merge to main:**
   - Ready for release

5. **Create release:**
   ```bash
   npm run release:patch  # or minor/major
   ```

## Troubleshooting

### Common Issues

1. **Build fails on Windows:**
   - Check if all dependencies are compatible
   - Ensure Convex API files are generated correctly

2. **Release creation fails:**
   - Check if tag format is correct (v*)
   - Ensure GitHub token has proper permissions
   - Verify all build jobs completed successfully

3. **Auto-updates not working:**
   - Verify the `publish` configuration in `package.json`
   - Check that the GitHub release was created successfully
   - Ensure the app has proper signing (for macOS)

### Manual Triggers

You can manually trigger any workflow from the GitHub Actions tab:

1. Go to your repository's Actions tab
2. Select the workflow you want to run
3. Click "Run workflow"
4. Choose the branch and any required inputs
5. Click "Run workflow"

## Environment Variables

The workflows use these environment variables:

- `NODE_VERSION`: Node.js version (default: 20)
- `ELECTRON_VERSION`: Electron version (default: 36.5.0)
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

## Artifacts

Workflows create these artifacts:

- **Build artifacts**: Distributable packages for each platform
- **Test builds**: Build outputs for testing purposes
- **Release assets**: Installers uploaded to GitHub releases

Artifacts are automatically cleaned up after 7-30 days depending on the workflow.

## Auto-Updates

The app is configured for automatic updates:

- **Windows**: Uses NSIS installer with auto-update capability
- **macOS**: Uses DMG with auto-update support
- **Linux**: Uses AppImage with update notifications

Users will be notified of new versions and can update with one click. 