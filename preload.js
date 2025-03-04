const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'leagueApi', {
    onChampionSelected: (callback) => {
      ipcRenderer.on('champion-selected', (event, data) => callback(data))
    },
    onChampionDetails: (callback) => {
      ipcRenderer.on('champion-details', (event, data) => callback(data))
    }
  }
)