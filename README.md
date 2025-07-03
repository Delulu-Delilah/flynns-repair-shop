# Flynns Repair Shop Management System

A comprehensive repair shop management system built with Electron, React, and Convex. Features offline support, real-time sync, automated updates, and professional receipt printing.

## Features

- **Ticket Management**: Create, update, and track repair tickets
- **Customer Database**: Manage customer information and history
- **Technician Management**: Track technician assignments and workload
- **Parts Inventory**: Monitor parts usage and costs
- **Offline Support**: Continue working without internet connection
- **Auto-Updates**: Automatic app updates via GitHub releases
- **Print Integration**: Professional receipt and ticket printing
- **Real-time Sync**: Data synchronization with cloud backend
- **Square Integration**: Payment processing support

## Auto-Update System

The app includes an auto-update system that:
- Checks for updates on startup
- Downloads updates in the background
- Prompts users when updates are ready
- Automatically installs updates on restart

### Manual Update Check
Users can manually check for updates via:
1. Menu → Help → Check for Updates
2. App will notify if updates are available

## Development

### Prerequisites
- Node.js 20+
- npm

### Installation
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/flynns-repair-shop.git
cd flynns-repair-shop
npm install
```

### Development Mode
```bash
# Start backend and frontend in development
npm run dev

# Start Electron in development
npm run electron:dev
```

### Building
```bash
# Build for distribution
npm run electron:dist

# Build for specific platform
npm run electron:dist:win
```

## Deployment & Updates

### Creating Releases
1. Update version in `package.json`
2. Commit changes: `git commit -am "v1.0.1"`
3. Create tag: `git tag v1.0.1`
4. Push with tags: `git push origin main --tags`
5. GitHub Actions will automatically build and create release

### Release Artifacts
The build process creates:
- Windows: `Flynns Setup X.X.X.exe` (NSIS installer)
- macOS: `Flynns-X.X.X.dmg` (Disk Image)
- Linux: `Flynns-X.X.X.AppImage` (Portable app)

## Configuration

### Environment Variables
Create a `.env.local` file with:
```
CONVEX_DEPLOYMENT=your-convex-deployment
VITE_CONVEX_URL=https://your-convex-deployment.convex.cloud
```

### Auto-Update Configuration
Update these fields in `package.json`:
```json
{
  "repository": {
    "url": "https://github.com/YOUR_USERNAME/flynns-repair-shop.git"
  },
  "build": {
    "publish": {
      "provider": "github",
      "owner": "YOUR_USERNAME",
      "repo": "flynns-repair-shop"
    }
  }
}
```

## License

Private software for Flynns Repair Shop.

## Support

For technical support, contact the development team.
