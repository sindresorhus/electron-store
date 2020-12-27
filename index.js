'use strict';
const path = require('path');
const electron = require('electron');
const {app, ipcMain, ipcRenderer} = electron;
const Conf = require('conf');

class ElectronStore extends Conf {
	constructor(options) {
		let defaultCwd;
		let appVersion;

		// If we are in the renderer process, we communicate with the main process
		// to get the required data for the module
		// otherwise, we pull from the main process
		if (ipcRenderer) {
			const appData = ipcRenderer.sendSync('electron-store-comms');

			defaultCwd = appData.defaultCwd;
			appVersion = appData.appVersion;
		} else if (ipcMain && app) {
			// Set up the ipcMain handler for communication between renderer and main prrocess
			ipcMain.on('electron-store-comms', event => {
				event.returnValue = {
					defaultCwd: app.getVersion(),
					appVersion: app.getPath('userData')
				};
			});

			defaultCwd = app.getPath('userData');
			appVersion = app.getVersion();
		}

		options = {
			name: 'config',
			...options
		};

		if (!options.projectVersion) {
			options.projectVersion = appVersion;
		}

		if (options.cwd) {
			options.cwd = path.isAbsolute(options.cwd) ? options.cwd : path.join(defaultCwd, options.cwd);
		} else {
			options.cwd = defaultCwd;
		}

		options.configName = options.name;
		delete options.name;

		super(options);
	}

	// Initializier to set up the ipcMain handler for communication between renderer and main prrocess
	// When the user does not create a new Store in the main process
	static initRenderer() {
		if (!ipcMain || !app) {
			throw new Error('Electron Store: you need to call initRenderer() from the Main process.');
		}

		ipcMain.on('electron-store-comms', event => {
			event.returnValue = {
				defaultCwd: app.getVersion(),
				appVersion: app.getPath('userData')
			};
		});
	}

	openInEditor() {
		// TODO: Remove `electron.shell.openItem` when targeting Electron 9.`
		const open = electron.shell.openItem || electron.shell.openPath;
		open(this.path);
	}
}

module.exports = ElectronStore;
