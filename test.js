import fs from 'fs';
import path from 'path';
import electron from 'electron';
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
	t.deepEqual(JSON.parse(fs.readFileSync(storagePath, 'utf8')), {ava: '🚀'});
	fs.unlinkSync(storagePath);
});

test('cwd option', async t => {
	const result = await run('fixture-cwd.js');
	const [defaultPath, storagePath, storagePath2] = result.split('\n');
	t.is(storagePath, path.join(defaultPath, 'foo/config.json'));
	t.is(storagePath2, path.join(__dirname, 'bar/config.json'));
	fs.unlinkSync(storagePath);
	fs.unlinkSync(storagePath2);
});
