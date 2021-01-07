'use strict';
const path = require('path');
const electron = require('electron');
const {app, ipcMain, ipcRenderer} = electron;
const Conf = require('conf');

// Set up the ipcMain handler for communication between renderer and main prrocess
const initComms = () => {
	if (!ipcMain || !app) {
		throw new Error('Electron Store: you need to call initRenderer() from the Main process.');
	}

	const appData = {
		defaultCwd: app.getVersion(),
		appVersion: app.getPath('userData')
	};

	// Set up the ipcMain handler for communication between renderer and main prrocess
	ipcMain.on('electron-store-comms', event => {
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
			({defaultCwd, appVersion} = ipcRenderer.sendSync('electron-store-comms'));
		} else if (ipcMain && app) {
			({defaultCwd, appVersion} = initComms());
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

	// Initializier that calls initComms() to set-up the required ipcMain listener
	// When the user does not create a new Store in the main process
	static initRenderer() {
		return initComms();
	}

	openInEditor() {
		// TODO: Remove `electron.shell.openItem` when targeting Electron 9.`
		const open = electron.shell.openItem || electron.shell.openPath;
		open(this.path);
	}
}

module.exports = ElectronStore;
