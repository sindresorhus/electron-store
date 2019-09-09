'use strict';
const path = require('path');
const electron = require('electron');
const Conf = require('conf');

class ElectronStore extends Conf {
	constructor(options) {
		const defaultCwd = (electron.app || electron.remote.app).getPath('userData');
		options = {
			name: 'config',
			...options
		};

		if (options.cwd) {
			options.cwd = path.isAbsolute(options.cwd) ? options.cwd : path.join(defaultCwd, options.cwd);
		} else {
			options.cwd = defaultCwd;
		}

		options.configName = options.name;
		delete options.name;
		super(options);

		this._defaultValues = {};
		if (options.schema) {
			for (const [key, value] of Object.entries(options.schema)) {
				if (value && value.default) {
					this._defaultValues[key] = value.default;
				}
			}
		}
	}

	reset(key) {
		if (this._defaultValues[key]) {
			return this.set(key, this._defaultValues[key]);
		}
	}

	openInEditor() {
		electron.shell.openItem(this.path);
	}
}

module.exports = ElectronStore;
