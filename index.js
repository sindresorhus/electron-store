'use strict';
const path = require('path');
const electron = require('electron');
const {app, ipcMain, ipcRenderer} = electron;
const Conf = require('conf');

class ElectronStore extends Conf {
	constructor(options) {
		let defaultCwd;
		let appVersion;

		(async () => {
			// If we are in the renderer process, we communicate with the main process
			// to get the required data for the module
			// otherwise, we pull from the main process
			if (ipcRenderer) {
				await ipcRenderer.invoke('electron-store-comms').then(result => {
					defaultCwd = result.defaultCwd;
					appVersion = result.appVersion;
				}).catch(() => console.error('Electron Store: you need to call init() from the Main process first.'));
			} else {
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
		})();

		super(options);
	}

	// Initializier to set up the ipcMain handler for communication between renderer and main prrocess
	static init() {
		if (!ipcMain || !app) {
			throw new Error('Electron Store: you need to call init() from the Main process.');
		}

		ipcMain.handle('electron-store-comms', () => {
			return {
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
