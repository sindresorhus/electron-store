import process from 'node:process';
import path from 'node:path';
import electron from 'electron';
import Conf from 'conf';

const {app, ipcMain, shell} = electron;

let isInitialized = false;

const internalKey = '__internal__';
const datePathsKey = 'electronStoreDatePaths';

const isObject = value => typeof value === 'object' && value !== null;

const isPlainObject = value => {
	if (!isObject(value)) {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
};

const pathEquals = (firstPath, secondPath) =>
	firstPath.length === secondPath.length && firstPath.every((segment, index) => segment === secondPath[index]);

const pathStartsWith = (path, prefix) =>
	path.length >= prefix.length && prefix.every((segment, index) => segment === path[index]);

const normalizeDatePaths = paths => {
	const seen = new Set();
	const normalizedPaths = [];

	for (const path of paths) {
		const normalizedPath = path.map(String);
		const key = JSON.stringify(normalizedPath);

		if (seen.has(key)) {
			continue;
		}

		seen.add(key);
		normalizedPaths.push(normalizedPath);
	}

	return normalizedPaths;
};

const getDatePaths = store => {
	const paths = store[internalKey]?.[datePathsKey];

	if (!Array.isArray(paths)) {
		return [];
	}

	return normalizeDatePaths(paths.filter(path => Array.isArray(path)));
};

const setDatePaths = (store, paths) => {
	if (paths.length === 0) {
		if (store[internalKey]) {
			delete store[internalKey][datePathsKey];

			if (Object.keys(store[internalKey]).length === 0) {
				delete store[internalKey];
			}
		}

		return;
	}

	store[internalKey] ??= {};
	store[internalKey][datePathsKey] = normalizeDatePaths(paths);
};

const serializeDates = (value, path) => {
	if (value instanceof Date) {
		return {
			value: value.toISOString(),
			datePaths: [path],
		};
	}

	if (Array.isArray(value)) {
		const datePaths = [];
		const array = value.map((item, index) => {
			const result = serializeDates(item, [...path, String(index)]);
			datePaths.push(...result.datePaths);
			return result.value;
		});

		return {value: array, datePaths};
	}

	if (isPlainObject(value)) {
		const datePaths = [];
		const object = {};

		for (const [key, item] of Object.entries(value)) {
			const result = serializeDates(item, [...path, key]);
			datePaths.push(...result.datePaths);
			object[key] = result.value;
		}

		return {value: object, datePaths};
	}

	return {value, datePaths: []};
};

const reviveDates = (value, path, datePaths) => {
	if (datePaths.some(datePath => pathEquals(datePath, path)) && typeof value === 'string') {
		return new Date(value);
	}

	if (!datePaths.some(datePath => pathStartsWith(datePath, path))) {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map((item, index) => reviveDates(item, [...path, String(index)], datePaths));
	}

	if (isPlainObject(value)) {
		const object = {};

		for (const [key, item] of Object.entries(value)) {
			object[key] = reviveDates(item, [...path, key], datePaths);
		}

		return object;
	}

	return value;
};

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
	#accessPropertiesByDotNotation;

	constructor(options) {
		const accessPropertiesByDotNotation = options?.accessPropertiesByDotNotation !== false;
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
		this.#accessPropertiesByDotNotation = accessPropertiesByDotNotation;
	}

	static initRenderer() {
		initDataListener();
	}

	get(key, defaultValue) {
		const value = super.get(key, defaultValue);
		const datePaths = getDatePaths(this.store);
		const path = this.#getPath(key);

		return reviveDates(value, path, datePaths);
	}

	set(key, value) {
		if (typeof key === 'object' && key !== null) {
			const serializedObject = {};
			const pathsToRemove = [];
			const datePaths = [];

			for (const [objectKey, objectValue] of Object.entries(key)) {
				const path = this.#getPath(objectKey);
				const result = serializeDates(objectValue, path);
				serializedObject[objectKey] = result.value;
				pathsToRemove.push(path);
				datePaths.push(...result.datePaths);
			}

			super.set(serializedObject);
			this.#updateDatePaths(pathsToRemove, datePaths);
			return;
		}

		if (typeof key !== 'string') {
			super.set(key, value);
			return;
		}

		const path = this.#getPath(key);
		const result = serializeDates(value, path);

		super.set(key, result.value);
		this.#updateDatePaths([path], result.datePaths);
	}

	delete(key) {
		super.delete(key);
		this.#updateDatePaths([this.#getPath(key)], []);
	}

	clear() {
		super.clear();
		this.#setDatePaths([]);
	}

	async openInEditor() {
		const error = await shell.openPath(this.path);

		if (error) {
			throw new Error(error);
		}
	}

	#getPath(key) {
		if (!this.#accessPropertiesByDotNotation) {
			return [key];
		}

		return key.split('.');
	}

	#updateDatePaths(pathsToRemove, pathsToAdd) {
		const datePaths = getDatePaths(this.store)
			.filter(datePath => !pathsToRemove.some(path => pathEquals(datePath, path) || pathStartsWith(datePath, path)));

		this.#setDatePaths([...datePaths, ...pathsToAdd]);
	}

	#setDatePaths(datePaths) {
		const {store} = this;
		setDatePaths(store, datePaths);
		this.store = store;
	}
}
