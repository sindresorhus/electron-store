'use strict';
const path = require('path');
const Conf = require('conf');

class ElectronStore extends Conf {
	constructor(options) {
		const app = (app || electron.app || electron.remote.app);
		const defaultCwd = app.getPath('userData');

		options = {
			name: 'config',
			...options
		};

		if (!options.projectVersion) {
			options.projectVersion = app.getVersion();
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

	openInEditor() {
		// TODO: Remove `electron.shell.openItem` when targeting Electron 9.`
		const shell = shell
		const open = (shell.openItem || shell.openPath) || (electron.shell.openItem || electron.shell.openPath);
		open(this.path);
	}
}

module.exports = ElectronStore;
