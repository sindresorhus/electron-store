'use strict';
const path = require('path');
const electron = require('electron');
const Conf = require('conf');
const compareVersions = require('compare-versions');

class ElectronStore extends Conf {
	constructor(opts) {
		const app = electron.app || (electron.remote && electron.remote.app);
		const defaultCwd = app.getPath('userData');
		const appVersion = app.getVersion();

		opts = Object.assign({name: 'config'}, opts);

		if (opts.cwd) {
			opts.cwd = path.isAbsolute(opts.cwd) ? opts.cwd : path.join(defaultCwd, opts.cwd);
		} else {
			opts.cwd = defaultCwd;
		}

		opts.configName = opts.name;
		delete opts.name;
		super(opts);

		if (this.get('version') === undefined && opts.migrations) {
			this.set('version', appVersion);
		} else if (opts.migrations && compareVersions(this.get('version'), appVersion) === -1) {
			this.migrate(opts.migrations, appVersion);
		}
	}

	openInEditor() {
		electron.shell.openItem(this.path);
	}

	migrate(migrations, appVersion) {
		const migrationsToRun = Object.keys(migrations).filter(version => {
			return compareVersions(version, appVersion) === -1 &&
				compareVersions(version, this.get('version')) === 1;
		}).sort(compareVersions);

		for (const version of migrationsToRun) {
			migrations[version](this);
		}

		this.set('version', appVersion);
	}
}

module.exports = ElectronStore;
