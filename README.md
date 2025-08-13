# Q-Music App 🎵

A decentralized music platform built on the QORTAL blockchain. Discover, share, and publish music in a truly decentralized ecosystem.

## 🚀 Live Demo

Visit the app at: [https://iffinland.github.io/qmusic-app](https://iffinland.github.io/qmusic-app)

## ✨ Features

- 🎧 **Music Discovery**: Browse recently added songs from the QDN network
- 🎵 **Audio Player**: Built-in audio player with track controls
- 📤 **Publish Music**: Upload and publish your own music to the decentralized network
- 🔐 **QORTAL Login**: Connect with your QORTAL wallet
- 📊 **Statistics**: View network statistics for songs and publishers
- 🎨 **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Technology Stack

- **Frontend**: React 18 + Vite
- **Styling**: CSS3 with responsive design
- **Blockchain**: QORTAL Network integration
- **Audio**: Web Audio API
- **Deployment**: GitHub Pages

## 🏗️ Development

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/iffinland/qmusic-app.git
cd qmusic-app

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
qmusic-app/
├── src/
│   ├── components/         # React components
│   ├── services/          # API and blockchain services
│   ├── App.jsx           # Main application component
│   └── styles.css        # Global styles
├── public/               # Static assets
├── dist/                # Production build
├── backups/             # Automatic backups
├── backup.sh            # Backup creation script
├── restore.sh           # Backup restoration script
└── deploy-github.sh     # GitHub Pages deployment
```

## 🛡️ Backup System

This project includes a comprehensive backup system to prevent code loss:

### Create Backup
```bash
./backup.sh
```

### Restore from Backup
```bash
./restore.sh
```

### Quick Commands
```bash
# Load quick aliases
source quick-commands.sh

# Then use:
qbackup     # Create backup
qrestore    # Restore backup
qbuild      # Test build
qdeploy     # Deploy to GitHub Pages
```

## 🚀 Deployment

### GitHub Pages
```bash
./deploy-github.sh
```

### Manual Deployment
```bash
npm run build
# Upload dist/ contents to your hosting provider
```

## 🔗 QORTAL Integration

This app integrates with the QORTAL blockchain network:

- **QDN**: Retrieves music files from the QORTAL Data Network
- **Authentication**: Uses QORTAL wallet for user login
- **Publishing**: Uploads music directly to the blockchain
- **Metadata**: Stores song information on-chain

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run the backup script before committing (`./backup.sh`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

**Built with ❤️ for decentralized music**
