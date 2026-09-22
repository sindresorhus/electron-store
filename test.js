import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import electron from 'electron';
import test from 'node:test';
import {execa} from 'execa';

// See https://github.com/sindresorhus/conf for more extensive tests

// Electron reports real paths, so resolve the symlinked temporary directory up front.
const realTemporaryDirectory = fs.realpathSync(os.tmpdir());

// Electron otherwise reads and writes the real user data directory, so each test gets its own.
const temporaryUserDataDirectory = t => {
	const directory = fs.mkdtempSync(path.join(realTemporaryDirectory, 'electron-store-'));

	t.after(() => {
		fs.rmSync(directory, {recursive: true, force: true});
	});

	return directory;
};

const run = async (file, userDataDirectory) => {
	const {stdout} = await execa(electron, [file, `--user-data-dir=${userDataDirectory}`], {
		env: {
			ELECTRON_ENABLE_LOGGING: true,
			ELECTRON_ENABLE_STACK_DUMPING: true,
			ELECTRON_NO_ATTACH_CONSOLE: true,
		},
	});

	return stdout.trim();
};

test('main', {timeout: 60_000}, async t => {
	const storagePath = await run('fixtures/fixture.js', temporaryUserDataDirectory(t));
	t.assert.deepStrictEqual(JSON.parse(fs.readFileSync(storagePath, 'utf8')), {ava: '🚀'});
});

test('fails with a helpful error outside Electron', async t => {
	const {failed, stderr} = await execa(process.execPath, ['fixtures/fixture-non-electron.js'], {reject: false});
	t.assert.ok(failed);
	t.assert.ok(stderr.includes('You can only use this module from the Electron main process or the renderer process, unless you pass an absolute `cwd`.'));
});

test('fails with a helpful error outside Electron when cwd is relative', async t => {
	const {failed, stderr} = await execa(process.execPath, ['fixtures/fixture-non-electron-relative-cwd.js'], {reject: false});
	t.assert.ok(failed);
	t.assert.ok(stderr.includes('You can only use this module from the Electron main process or the renderer process, unless you pass an absolute `cwd`.'));
});

test('cwd option', {timeout: 60_000}, async t => {
	const userDataDirectory = temporaryUserDataDirectory(t);
	const result = await run('fixtures/fixture-cwd.js', userDataDirectory);
	const [defaultPath, storagePath, storagePath2] = result.split('\n', 3);
	t.assert.strictEqual(defaultPath, userDataDirectory);
	t.assert.strictEqual(storagePath, path.join(userDataDirectory, 'foo/config.json'));
	t.assert.strictEqual(storagePath2, path.join(userDataDirectory, 'bar/config.json'));
});
