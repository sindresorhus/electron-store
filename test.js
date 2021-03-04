import fs from 'fs';
import path from 'path';
import electron from 'electron';
import {deserialize} from 'v8';
import test from 'ava';
import execa from 'execa';

// See https://github.com/sindresorhus/conf for more extensive tests

const run = async file => {
	const {stdout} = await execa(electron, [file], {
		env: {
			ELECTRON_ENABLE_LOGGING: true,
			ELECTRON_ENABLE_STACK_DUMPING: true,
			ELECTRON_NO_ATTACH_CONSOLE: true
		}
	});

	return stdout.trim();
};

test('main', async t => {
	const storagePath = await run('fixture.js');
	const data = deserialize(Buffer.from(fs.readFileSync(storagePath, 'utf8'), 'base64'));
	t.deepEqual(Object.keys(data), ['date', 'ava']);
	t.is(data.ava, '🚀');
	t.true(data.date instanceof Date);
	fs.unlinkSync(storagePath);
});

test('cwd option', async t => {
	const result = await run('fixture-cwd.js');
	const [defaultPath, storagePath, storagePath2] = result.split(/\r?\n/);
	t.is(storagePath, path.join(defaultPath, 'foo/config.json'));
	t.is(storagePath2, path.join(__dirname, 'bar/config.json'));
	fs.unlinkSync(storagePath);
	fs.unlinkSync(storagePath2);
});
