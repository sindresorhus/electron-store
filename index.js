'use strict';
const path = require('path');
const electron = require('electron');
const {app, ipcMain, ipcRenderer} = electron;
const Conf = require('conf');

// Set up the ipcMain handler for communication between renderer and main process
const initDataListener = () => {
	if (!ipcMain || !app) {
		throw new Error('Electron Store: you need to call initRenderer() from the Main process.');
	}

	const appData = {
		defaultCwd: app.getPath('userData'),
		appVersion: app.getVersion()
	};

	// Set up the ipcMain handler for communication between renderer and main process
	ipcMain.on('electron-store-get-data', event => {
		event.returnValue = appData;
	});

	return appData;
};

class ElectronStore extends Conf {
	constructor(options) {
		let defaultCwd;
		let appVersion;

		// If we are in the renderer process, we communicate with the main process
		// to get the required data for the module
		// otherwise, we pull from the main process
		if (ipcRenderer) {
			({defaultCwd, appVersion} = ipcRenderer.sendSync('electron-store-get-data'));
		} else if (ipcMain && app) {
			({defaultCwd, appVersion} = initDataListener());
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

	// Initializer to set up the required ipc communication channels for the module
	// When a Store instance is not created in the main process
	// And a Store instance is created in the Electron renderer process only.
	static initRenderer() {
		initDataListener();
	}

	openInEditor() {
		// TODO: Remove `electron.shell.openItem` when targeting Electron 9.`
		const open = electron.shell.openItem || electron.shell.openPath;
		open(this.path);
	}
}

module.exports = ElectronStore;
