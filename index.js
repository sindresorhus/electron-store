'use strict';
const path = require('path');
const {app, ipcMain, ipcRenderer, shell} = require('electron');
const Conf = require('conf');

// Set up the `ipcMain` handler for communication between renderer and main process.
const initDataListener = () => {
	if (!ipcMain || !app) {
		throw new Error('Electron Store: You need to call `.initRenderer()` from the main process.');
	}

	const appData = {
		defaultCwd: app.getPath('userData'),
		appVersion: app.getVersion()
	};

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
		// to get the required data for the module otherwise, we pull from the main process.
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

	static initRenderer() {
		initDataListener();
	}

	openInEditor() {
		shell.openPath(this.path);
	}
}

module.exports = ElectronStore;
