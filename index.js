/**
 * Simple data persistence for Electron apps.
 * @module electron-store
 */

import process from 'node:process';
import path from 'node:path';
import electron from 'electron';
import Conf from 'conf';

const {app, ipcMain, shell} = electron;

/**
 * Tracks whether the store has been initialized.
 * @type {boolean}
 * @private
 */
let isInitialized = false;

// Set up the `ipcMain` handler for communication between renderer and main process.
/**
 * Initializes the IPC listener for renderer-main process communication.
 * @returns {{defaultCwd: string, appVersion: string}} The app data for the store.
 * @throws {Error} If called from renderer process without initRenderer().
 * @private
 */
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

/**
 * ElectronStore - Simple data persistence for Electron apps.
 * @extends Conf
 */
export default class ElectronStore extends Conf {
	/**
	 * Creates a new ElectronStore instance.
	 * @constructor
	 * @param {Object} [options] - Configuration options for the store.
	 * @param {string} [options.name='config'] - The name of the store (without extension).
	 * @param {string} [options.cwd] - The current working directory for the store file.
	 * @param {Object} [options.defaults] - Default values for the store.
	 * @param {Object} [options.schema] - JSON schema for validation.
	 */
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

	/**
	 * Initialize the renderer process for use with ElectronStore.
	 * Must be called from the main process before creating Store instances in the renderer.
	 * @static
	 */
	static initRenderer() {
		initDataListener();
	}

	/**
	 * Opens the store file in the default editor.
	 * @returns {Promise<string>} The path to the opened file, or an error string if failed.
	 */
	async openInEditor() {
		const error = await shell.openPath(this.path);

		if (error) {
			throw new Error(error);
		}
	}
}
