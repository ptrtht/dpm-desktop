# DPM Desktop by Qutay

<img src="assets/icon.png" alt="DPM Desktop Logo" width="128" height="128">

**UNOFFICIAL VERSION**

A desktop application that enhances your League of Legends experience by connecting to the League Client API and providing real-time game information and statistics.

## About This Project

This is an **unofficial** desktop version of DPM.lol created as a community initiative. Our goal is to bring together the open source community to support and enhance the tools we love. By making this project open source, we hope to foster collaboration, innovation, and continuous improvement through community contributions.

We believe in the power of community-driven development and invite developers, designers, and League of Legends enthusiasts to join us in making this tool even better.

## Features

- **Champion Select Integration**: Automatically navigates to champion page and displays stats when you enter champion select.
- **Live Game Navigation**: Automatically navigates to the live game section on DPM when your game starts.
- **Seamless League Client Integration**: Automatically connects to your League client when it's running.

## Limitations

Currently, the following features are not yet implemented but are planned for future releases:

- **RUNES Import**: Automatic import of recommended rune pages is coming soon.
- **Summoner Spell Import**: Automatic import of recommended summoner spells is coming soon.
- **Item Sets**: Custom item set creation and import is under development.
- **In-Game Overlays**: Overlay functionality during active games is planned for a future update.

We are actively working on these features and welcome community contributions to help implement them faster.

## Installation

### Windows

1. Download the latest installer from the [Releases](https://github.com/yourusername/dpm-desktop/releases) page.
2. Run the installer and follow the on-screen instructions.
3. Launch DPM Desktop from your Start menu or desktop shortcut.

### Building from Source

If you prefer to build the application yourself:

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/dpm-desktop.git
   cd dpm-desktop
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the application in development mode:
   ```
   npm start
   ```

4. Build the application for your platform:
   ```
   npm run build
   ```
   
   For all platforms:
   ```
   npm run build:all
   ```

## Usage

1. Launch the application.
2. Make sure League of Legends client is running.
3. The application will automatically connect to the League client.
4. Navigate through the interface to access different features.

## Requirements

- Windows 7 or later
- League of Legends client installed
- Internet connection

## Development

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Electron knowledge

### Project Structure

- `main.js` - Main Electron process
- `preload.js` - Preload script for secure IPC communication
- `assets/` - Application assets (icons, images)

### Key Functions

- `connectToLeagueClient()` - Establishes connection with the League client
- `setupWebSocketConnection()` - Sets up WebSocket for real-time updates
- `fetchSummonerInfo()` - Retrieves summoner information
- `processChampionSelectData()` - Processes champion select phase data
- `checkGameState()` - Monitors the current game state

## Troubleshooting

### Application Can't Connect to League Client

- Make sure League of Legends is running
- Restart the application
- Check if your firewall is blocking the connection

### Missing Icons or UI Elements

- Reinstall the application
- Update to the latest version

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Riot Games API](https://developer.riotgames.com/) for providing the game data
- [Electron](https://www.electronjs.org/) for the application framework
- [DPM.lol](https://dpm.lol) for the website

## Contact

- Twitter: [@Qut4y](https://twitter.com/Qut4y)
- Website: [dpm.lol](https://dpm.lol)

---

## Disclaimer

**This is an UNOFFICIAL community project** and is not affiliated with or endorsed by DPM.lol or Riot Games. This application is developed by community members who are passionate about improving the League of Legends experience.

DPM Desktop is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc.

We develop this tool out of love for the game and respect for the original DPM.lol service. Our intention is to complement, not compete with, the official offerings.
