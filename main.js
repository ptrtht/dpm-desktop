const { app, BrowserWindow, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')
const https = require('https')
const WebSocket = require('ws')

// Store the League Client connection info
let leagueClientInfo = null
let wsConnection = null
let lastNavigatedUrl = null
const baseTitle = 'DPM Desktop by @Qut4y'

function createWindow() {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: baseTitle,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      enableRemoteModule: false,
      mediaDevices: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Load initial URL
  mainWindow.loadURL('https://dpm.lol')
  
  // Set custom title when page title changes
  mainWindow.webContents.on('page-title-updated', (event, title) => {
    event.preventDefault();
    mainWindow.setTitle(`${baseTitle} -- ${title}`);
  });
  
  // Connect to League Client API when app starts
  connectToLeagueClient(mainWindow)
}

// Function to find and parse the League Client lockfile
function findLeagueClientLockfile() {
  const possiblePaths = [
    'C:/Riot Games/League of Legends',
    'D:/Riot Games/League of Legends',
    process.env.LOCALAPPDATA + '/Riot Games/League of Legends',
    '/Applications/League of Legends.app/Contents/LoL' // macOS
  ]
  
  for (const basePath of possiblePaths) {
    const lockfilePath = path.join(basePath, 'lockfile')
    try {
      if (fs.existsSync(lockfilePath)) {
        const lockfileContent = fs.readFileSync(lockfilePath, 'utf8')
        const [processName, pid, port, password, protocol] = lockfileContent.split(':')
        return { port, password, protocol }
      }
    } catch (err) {
      console.error(`Error reading lockfile at ${lockfilePath}:`, err)
    }
  }
  
  return null
}

// Connect to the League Client API
function connectToLeagueClient(mainWindow) {
  const clientInfo = findLeagueClientLockfile()
  
  if (!clientInfo) {
    console.log('League client not found. Will retry in 5 seconds...')
    setTimeout(() => connectToLeagueClient(mainWindow), 5000)
    return
  }
  
  leagueClientInfo = clientInfo
  console.log('Found League client on port:', clientInfo.port)
  
  // Get summoner info and navigate to player page
  fetchSummonerInfo(mainWindow)
  
  // Set up WebSocket connection to listen for events
  setupWebSocketConnection(mainWindow)
}

// Fetch summoner info and navigate to player page
function fetchSummonerInfo(mainWindow) {
  if (!leagueClientInfo) return
  
  const options = {
    hostname: '127.0.0.1',
    port: leagueClientInfo.port,
    path: '/lol-summoner/v1/current-summoner',
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`riot:${leagueClientInfo.password}`).toString('base64')
    },
    rejectUnauthorized: false
  }
  
  const req = https.request(options, (res) => {
    let data = ''
    
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      try {
        if (res.statusCode === 200) {
          const summonerData = JSON.parse(data)
          
          const gameName = summonerData.gameName || summonerData.displayName
          const tagLine = summonerData.tagLine
          
          if (gameName && tagLine) {
            navigateToPlayerPage(mainWindow, gameName, tagLine)
          }
        }
      } catch (err) {
        console.error('Error parsing summoner data:', err)
      }
    })
  })
  
  req.on('error', (error) => {
    console.error('Error fetching summoner data:', error)
  })
  
  req.end()
}

// Navigate to the player's page
function navigateToPlayerPage(mainWindow, gameName, tagLine) {
  if (!gameName || !tagLine) return
  
  const encodedName = encodeURIComponent(gameName)
  const playerUrl = `https://dpm.lol/${encodedName}-${tagLine}`
  
  // Only navigate if we haven't already navigated to this URL
  if (playerUrl !== lastNavigatedUrl) {
    console.log(`Navigating to player page: ${playerUrl}`)
    mainWindow.loadURL(playerUrl)
    lastNavigatedUrl = playerUrl
  }
}

// Set up WebSocket connection to the League client
function setupWebSocketConnection(mainWindow) {
  if (!leagueClientInfo) return
  
  // Track reconnection attempts
  if (!setupWebSocketConnection.reconnectAttempts) {
    setupWebSocketConnection.reconnectAttempts = 0;
  }
  
  const MAX_RECONNECT_ATTEMPTS = 5;
  
  const wsOptions = {
    rejectUnauthorized: false,
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`riot:${leagueClientInfo.password}`).toString('base64')
    }
  }
  
  const wsUrl = `wss://127.0.0.1:${leagueClientInfo.port}`
  wsConnection = new WebSocket(wsUrl, wsOptions)
  
  wsConnection.on('open', () => {
    console.log('WebSocket connection established with League client')
    
    // Reset reconnection attempts on successful connection
    setupWebSocketConnection.reconnectAttempts = 0;
    
    // Subscribe to events
    wsConnection.send(JSON.stringify([5, 'OnJsonApiEvent_lol-champ-select_v1_session']))
    wsConnection.send(JSON.stringify([5, 'OnJsonApiEvent_lol-gameflow_v1_gameflow-phase']))
    
    // Check current game state
    checkGameState(mainWindow)
  })
  
  wsConnection.on('message', (data) => {
    try {
      const event = JSON.parse(data)
      
      // Handle champion select events
      if (event[2] && event[2].uri === '/lol-champ-select/v1/session') {
        processChampionSelectData(event[2].data, mainWindow)
      }
      
      // Handle game flow events
      if (event[2] && event[2].uri === '/lol-gameflow/v1/gameflow-phase') {
        handleGameFlowPhase(event[2].data, mainWindow)
      }
    } catch (err) {
      console.error('Error processing WebSocket message:', err)
    }
  })
  
  wsConnection.on('error', (error) => {
    console.error('WebSocket error:', error)
    wsConnection = null
  })
  
  wsConnection.on('close', () => {
    setupWebSocketConnection.reconnectAttempts++;
    
    if (setupWebSocketConnection.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      console.log(`WebSocket connection closed. Reconnection attempt ${setupWebSocketConnection.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`)
      wsConnection = null
      setTimeout(() => setupWebSocketConnection(mainWindow), 5000)
    } else {
      console.log('Maximum reconnection attempts reached. Will try again later.')
      
      // Reset the client info to force a fresh connection on next attempt
      leagueClientInfo = null;
      wsConnection = null;
      
      // Try to find the lockfile again after a longer delay
      setTimeout(() => connectToLeagueClient(mainWindow), 30000)
    }
  })
}

// Process champion select data
function processChampionSelectData(data, mainWindow) {
  if (!data || !data.myTeam) return
  
  const localPlayerCellId = data.localPlayerCellId
  const localPlayer = data.myTeam.find(player => player.cellId === localPlayerCellId)
  
  if (localPlayer && localPlayer.championId > 0) {
    console.log('Champion selected:', localPlayer.championId)
    fetchChampionDetails(localPlayer.championId, mainWindow)
  }
}

// Fetch champion details and navigate to build page
function fetchChampionDetails(championId, mainWindow) {
  if (!leagueClientInfo) return
  
  const options = {
    hostname: '127.0.0.1',
    port: leagueClientInfo.port,
    path: `/lol-game-data/assets/v1/champions/${championId}.json`,
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`riot:${leagueClientInfo.password}`).toString('base64')
    },
    rejectUnauthorized: false
  }
  
  const req = https.request(options, (res) => {
    let data = ''
    
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      try {
        if (res.statusCode === 200) {
          const championDetails = JSON.parse(data)
          
          // Navigate to the build page using the alias
          const buildUrl = `https://dpm.lol/champions/${championDetails.alias}/build`
          
          // Only navigate if we haven't already navigated to this URL
          if (buildUrl !== lastNavigatedUrl) {
            console.log(`Navigating to champion build page: ${buildUrl}`)
            mainWindow.loadURL(buildUrl)
            lastNavigatedUrl = buildUrl
          }
        }
      } catch (err) {
        console.error('Error parsing champion details:', err)
      }
    })
  })
  
  req.on('error', (error) => {
    console.error('Error fetching champion details:', error)
  })
  
  req.end()
}

// Check the current game state
function checkGameState(mainWindow) {
  if (!leagueClientInfo) return
  
  const options = {
    hostname: '127.0.0.1',
    port: leagueClientInfo.port,
    path: '/lol-gameflow/v1/gameflow-phase',
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`riot:${leagueClientInfo.password}`).toString('base64')
    },
    rejectUnauthorized: false
  }
  
  const req = https.request(options, (res) => {
    let data = ''
    
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      try {
        if (res.statusCode === 200) {
          const gameFlowPhase = JSON.parse(data)
          handleGameFlowPhase(gameFlowPhase, mainWindow)
        }
      } catch (err) {
        console.error('Error parsing game state data:', err)
      }
    })
  })
  
  req.on('error', (error) => {
    console.error('Error fetching game state:', error)
  })
  
  req.end()
}

// Handle game flow phase changes
function handleGameFlowPhase(phase, mainWindow) {
  console.log('Game flow phase:', phase)
  
  if (phase === 'InProgress') {
    navigateToLiveGamePage(mainWindow)
  }
}

// Navigate to the live game page
function navigateToLiveGamePage(mainWindow) {
  if (!leagueClientInfo) return
  
  const options = {
    hostname: '127.0.0.1',
    port: leagueClientInfo.port,
    path: '/lol-summoner/v1/current-summoner',
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`riot:${leagueClientInfo.password}`).toString('base64')
    },
    rejectUnauthorized: false
  }
  
  const req = https.request(options, (res) => {
    let data = ''
    
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      try {
        if (res.statusCode === 200) {
          const summonerData = JSON.parse(data)
          
          const gameName = summonerData.gameName || summonerData.displayName
          const tagLine = summonerData.tagLine
          
          if (gameName && tagLine) {
            const encodedName = encodeURIComponent(gameName)
            const liveGameUrl = `https://dpm.lol/${encodedName}-${tagLine}/live`
            
            // Only navigate if we haven't already navigated to this URL
            if (liveGameUrl !== lastNavigatedUrl) {
              console.log(`Navigating to live game page: ${liveGameUrl}`)
              mainWindow.loadURL(liveGameUrl)
              lastNavigatedUrl = liveGameUrl
            }
          }
        }
      } catch (err) {
        console.error('Error parsing summoner data for live game:', err)
      }
    })
  })
  
  req.on('error', (error) => {
    console.error('Error fetching summoner data for live game:', error)
  })
  
  req.end()
}

// App lifecycle events
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (wsConnection) {
    wsConnection.close()
  }
  
  if (process.platform !== 'darwin') app.quit()
})