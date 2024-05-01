import process from 'node:process';
import path from 'node:path';
import {
	app,
	ipcMain,
	shell,
} from 'electron'; // eslint-disable-line import/no-duplicates
import electron from 'electron'; // eslint-disable-line import/no-duplicates
import Conf from 'conf';

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

	static initRenderer() {
		initDataListener();
	}

	async openInEditor() {
		const error = await shell.openPath(this.path);

		if (error) {
			throw new Error(error);
		}
	}
}
