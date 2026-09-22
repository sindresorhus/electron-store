import process from 'node:process';
import path from 'node:path';
import electron from 'electron';
import Conf from 'conf';

const {app, ipcMain, shell} = electron;

let isInitialized = false;

// Set up the `ipcMain` handler for communication between renderer and main process.
const initDataListener = () => {
	if (!ipcMain || !app) {
		throw new Error('Electron Store: You need to call `.initRenderer()` from the main process.');
	}

	const appData = {
		defaultCwd: app.getPath('userData'),
		appVersion: app.getVersion(),
	};

	if (isInitialized) {
		return appData;
	}

	ipcMain.on('electron-store-get-data', event => {
		event.returnValue = appData;
	});

	isInitialized = true;

	return appData;
};

export default class ElectronStore extends Conf {
	static initRenderer() {
		initDataListener();
	}

	constructor(options) {
		let defaultCwd;
		let appVersion;

		// If we are in the renderer process, we communicate with the main process
		// to get the required data for the module otherwise, we pull from the main process.
		if (process.type === 'renderer') {
			const appData = electron.ipcRenderer.sendSync('electron-store-get-data');

			if (!appData) {
				throw new Error('Electron Store: You need to call `.initRenderer()` from the main process.');
			}

			({defaultCwd, appVersion} = appData);
		} else if (ipcMain && app) {
			({defaultCwd, appVersion} = initDataListener());
		} else if (!options?.cwd || !path.isAbsolute(options.cwd)) {
			// Without Electron's app data there is no default cwd to fall back on and no cwd to resolve a relative one against, so `conf` would fail further down with a confusing `projectName` error.
			throw new Error('Electron Store: You can only use this module from the Electron main process or the renderer process, unless you pass an absolute `cwd`.');
		}

		options = {
			name: 'config',
			...options,
		};

		options.projectVersion ||= appVersion;

		if (options.cwd) {
			options.cwd = path.isAbsolute(options.cwd) ? options.cwd : path.join(defaultCwd, options.cwd);
		} else {
			options.cwd = defaultCwd;
		}

		options.configName = options.name;
		delete options.name;

		super(options);
	}

	async openInEditor() {
		const error = await shell.openPath(this.path);

		if (error) {
			throw new Error(error);
		}
	}
}
