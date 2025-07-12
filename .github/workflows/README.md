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

**Usage:**
```bash
# Create a new release
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

### 3. Security Scan (`security-scan.yml`)

**Triggers:**
- Push to main branch
- Pull requests to main branch
- Manual workflow dispatch

**What it does:**
- Runs Electronegativity security scanner
- Checks for common Electron security issues
- Comments on PRs with security findings
- Uploads security reports as artifacts

## Best Practices

### Version Management

1. **Use semantic versioning:**
   ```bash
   npm version patch  # 1.0.4 → 1.0.5
   npm version minor  # 1.0.4 → 1.1.0
   npm version major  # 1.0.4 → 2.0.0
   ```

2. **Tag releases:**
   ```bash
   git tag v1.0.5
   git push origin v1.0.5
   ```

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
   - This triggers test builds and security scans
   - Review the results before merging

4. **Merge to main:**
   - Triggers security scan on main branch

5. **Create release:**
   ```bash
   npm version patch
   git push --follow-tags
   ```

## Troubleshooting

### Common Issues

1. **Build fails on Windows:**
   - Check if all dependencies are compatible
   - Ensure Convex API files are generated correctly

2. **Security scan finds issues:**
   - Review the security report
   - Address high and medium priority issues
   - Update Electron version if needed

3. **Release creation fails:**
   - Check if tag format is correct (v*)
   - Ensure GitHub token has proper permissions
   - Verify all build jobs completed successfully

### Manual Triggers

You can manually trigger any workflow from the GitHub Actions tab:

1. Go to your repository's Actions tab
2. Select the workflow you want to run
3. Click "Run workflow"
4. Choose the branch and any required inputs
5. Click "Run workflow"

## Environment Variables

The workflows use these environment variables:

- `NODE_VERSION`: Node.js version (default: 18)
- `ELECTRON_VERSION`: Electron version (default: 36.5.0)
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

## Artifacts

Workflows create these artifacts:

- **Build artifacts**: Distributable packages for each platform
- **Security reports**: CSV files with security scan results
- **Test builds**: Build outputs for testing purposes

Artifacts are automatically cleaned up after 7-30 days depending on the workflow. 