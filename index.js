'use strict';
const path = require('path');
const fs = require('fs');
const electron = require('electron');
const Conf = require('conf');

class ElectronStore extends Conf {
	constructor(opts) {
		const defaultCwd = (electron.app || electron.remote.app).getPath('userData');

		opts = Object.assign({name: 'config'}, opts);

		if (opts.cwd) {
			opts.cwd = path.isAbsolute(opts.cwd) ? opts.cwd : path.join(defaultCwd, opts.cwd);
		} else {
			opts.cwd = defaultCwd;
		}

		if (opts.validate) {
			try {
				JSON.parse(fs.readFileSync(opts.cwd + '\\' + opts.name + '.json'));
			} catch (ex) {
				throw ex;
			}
		}

		opts.configName = opts.name;
		delete opts.name;
		super(opts);
	}

	openInEditor() {
		electron.shell.openItem(this.path);
	}
}

module.exports = ElectronStore;
