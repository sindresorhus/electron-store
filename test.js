import fs from 'fs';
import test from 'ava';
import execa from 'execa';
import electron from 'electron-prebuilt';

// see https://github.com/sindresorhus/conf for more extensive tests

test(async t => {
	let configPath = await execa.stdout(electron, ['fixture.js'], {
		cwd: __dirname,
		env: {
			ELECTRON_ENABLE_LOGGING: true,
			ELECTRON_ENABLE_STACK_DUMPING: true,
			ELECTRON_NO_ATTACH_CONSOLE: true
		}
	});

	// stupid Windows
	configPath = configPath.trim();

	t.deepEqual(JSON.parse(fs.readFileSync(configPath.trim(), 'utf8')), {ava: '🚀'});
	fs.unlinkSync(configPath);
});
