# GitHub Repository Setup Instructions

Follow these steps to set up auto-updates for your Flynns Repair Shop app:

## Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click "New repository" (green button)
3. Repository settings:
   - **Repository name**: `flynns-repair-shop`
   - **Description**: "Flynns Repair Shop Management System"
   - **Visibility**: Private (recommended for business software)
   - **Initialize**: Leave unchecked (we already have files)
4. Click "Create repository"

## Step 2: Update Configuration

1. **Update package.json** with your GitHub username:
   ```bash
   # Replace YOUR_GITHUB_USERNAME with your actual GitHub username
   # Find these lines in package.json and update them:
   "repository": {
     "url": "https://github.com/YOUR_GITHUB_USERNAME/flynns-repair-shop.git"
   },
   "build": {
     "publish": {
       "owner": "YOUR_GITHUB_USERNAME",
       "repo": "flynns-repair-shop"
     }
   }
   ```

2. **Commit the changes**:
   ```bash
   git add package.json
   git commit -m "Update GitHub repository configuration"
   ```

## Step 3: Push to GitHub

1. **Add remote origin** (replace YOUR_GITHUB_USERNAME):
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/flynns-repair-shop.git
   git branch -M main
   git push -u origin main
   ```

## Step 4: Enable GitHub Actions

1. Go to your repository on GitHub
2. Click "Actions" tab
3. GitHub will detect the workflow file and show it
4. The workflow is ready to run automatically on new releases

## Step 5: Create Your First Release

1. **Update version** in package.json (e.g., from "1.0.0" to "1.0.1")
2. **Commit and tag**:
   ```bash
   git add package.json
   git commit -m "v1.0.1"
   git tag v1.0.1
   git push origin main --tags
   ```

3. **Monitor the build**:
   - Go to GitHub → Actions tab
   - Watch the build process (takes ~10-15 minutes)
   - When complete, go to Releases tab to see the new release

## Step 6: Configure Auto-Updates in Production

The app will now:
- ✅ Check for updates on startup
- ✅ Notify users when updates are available
- ✅ Download and install updates automatically
- ✅ Show progress during download

## Release Process (Ongoing)

For future updates:

1. **Make your changes** to the code
2. **Test thoroughly** using `npm run electron:dev`
3. **Update version** in package.json
4. **Commit and tag**:
   ```bash
   git add .
   git commit -m "v1.0.2: Add new features"
   git tag v1.0.2
   git push origin main --tags
   ```
5. **GitHub Actions will automatically**:
   - Build for Windows, macOS, and Linux
   - Create GitHub release
   - Upload installers
   - Generate update manifests
6. **Users will be notified** of the update next time they open the app

## Security Notes

- Keep your repository private for business software
- The auto-updater only works with signed releases from your GitHub repo
- GitHub tokens are handled securely by GitHub Actions
- No manual upload required - everything is automated

## Troubleshooting

### Build Fails
- Check Actions tab for error details
- Ensure all dependencies are in package.json
- Verify the workflow file syntax

### Updates Not Working
- Verify the repository URL in package.json matches your GitHub repo
- Check that releases contain the latest*.yml files
- Ensure the app version in package.json was incremented

### Manual Update Check
Users can manually check for updates via:
1. Menu → Help → Check for Updates (when implemented)
2. Or the app checks automatically on startup

## Files Created/Modified

- `.github/workflows/build.yml` - GitHub Actions workflow
- `electron/main.js` - Added auto-updater functionality
- `package.json` - Added repository and publish configuration
- `.gitignore` - Updated for Electron builds
- `README.md` - Updated documentation

Your app now has professional auto-update capabilities! 🚀 