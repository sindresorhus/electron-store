# electron-store

> Simple data persistence for your [Electron](https://electronjs.org) app or module - Save and load user settings, app state, cache, etc

Electron doesn't have a built-in way to persist user settings and other data. This module handles that for you, so you can focus on building your app. The data is saved in a JSON file named config.json in [`app.getPath('userData')`](https://electronjs.org/docs/api/app#appgetpathname).

> [!NOTE]
> This is not a database. The entire JSON file is read and written on every change, so it's best suited for small data like user settings that change occasionally. For large data, or for a high rate of changes, use SQLite or similar.

You can use this module directly in both the main and renderer process. For use in the renderer process only, you need to call `Store.initRenderer()` in the main process, or create a new Store instance (`new Store()`) in the main process.

> [!WARNING]
> Using this module in the renderer process requires access to Node.js built-ins like `fs` and `path`. Electron disables Node.js in the renderer by default (`nodeIntegration: false`), and in the preload script since Electron 20 (`sandbox: true`). Importing this module from a renderer or preload script therefore fails with errors such as `Can't resolve 'fs'` or `module not found: fs`. Disabling those defaults is not recommended. Prefer keeping the store in the main process and exposing it over IPC with [`ipcMain.handle`](https://www.electronjs.org/docs/api/ipc-main#ipcmainhandlechannel-listener) and [`ipcRenderer.invoke`](https://www.electronjs.org/docs/api/ipc-renderer#ipcrendererinvokechannel-args).

## Install

```sh
npm install electron-store
```

*Requires Electron 35 or later.*

> [!NOTE]
> This package is native [ESM](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) and no longer provides a CommonJS export. If your project uses CommonJS, you will have to [convert to ESM](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c). More info about [Electron and ESM](https://www.electronjs.org/docs/latest/tutorial/esm). Please don't open issues for questions regarding CommonJS and ESM.

## Usage

```js
import Store from 'electron-store';

const store = new Store();

store.set('unicorn', '🦄');
console.log(store.get('unicorn'));
//=> '🦄'

// Use dot-notation to access nested properties
store.set('foo.bar', true);
console.log(store.get('foo'));
//=> {bar: true}

store.delete('unicorn');
console.log(store.get('unicorn'));
//=> undefined
```

## API

Changes are written to disk atomically, so if the process crashes during a write, it will not corrupt the existing config.

**Two processes writing to the same storage file at the same moment is not supported.** A write reads the storage file first, so a change made by another process is not lost unless the two writes overlap. A whole-store write (`store.store = …`) replaces everything the file holds.

### Store(options?)

Returns a new instance.

### options

Type: `object`

#### defaults

Type: `object`

Default values for the store items.

**Note:** The values in `defaults` will overwrite the `default` key in the `schema` option.

**Note:** The values are copied when the store is created, so changing the object you passed afterwards has no effect. A value with a `toJSON` method, such as a `Date`, is stored as what it serializes to.

**Note:** A key covered by `defaults` cannot be deleted, since the default is written back. With dot notation, a key below it can be deleted, and `.reset()` puts it back.

**Note:** A value must be JSON serializable, like for [`.set()`](#setkey-value). A key set to `undefined` is ignored.

#### schema

type: `object`

[JSON Schema](https://json-schema.org) to validate your config data.

Under the hood, the JSON Schema validator [ajv](https://ajv.js.org/json-schema.html) is used to validate your config. We use [JSON Schema draft-2020-12](https://json-schema.org/draft/2020-12/release-notes) and support all validation keywords and formats.

**Note:** The ajv dependency may cause CSP violations. See [Can I use `conf` with strict Content Security Policy (CSP)?](https://github.com/sindresorhus/conf#can-i-use-conf-with-strict-content-security-policy-csp).

You should define your schema as an object where each key is the name of your data's property and each value is a JSON schema used to validate that property. See more [here](https://json-schema.org/understanding-json-schema/reference/object.html#properties).

Example:

```js
import Store from 'electron-store';

const schema = {
	foo: {
		type: 'number',
		maximum: 100,
		minimum: 1,
		default: 50
	},
	bar: {
		type: 'string',
		format: 'url'
	}
};

const store = new Store({schema});

console.log(store.get('foo'));
//=> 50

store.set('foo', '1');
// [Error: Config schema violation: `foo` must be number]
```

**Note:** The `default` value will be overwritten by the `defaults` option if set.

A `default` on a nested property is only applied when the parent object exists. Give the parent a `default` of an empty object so the defaults of its properties are applied too:

```js
const store = new Store({
	schema: {
		bar: {
			type: 'object',
			default: {},
			properties: {
				a: {
					type: 'number',
					default: 5
				}
			}
		}
	}
});

console.log(store.get('bar.a'));
//=> 5
```

Without `default: {}` on `bar`, the store has no `bar` object to apply `a` to, so `store.get('bar.a')` returns `undefined`.

This applies at each level, so a property nested two objects deep needs a `default` of `{}` on both objects in the chain.

**Note:** A `default` must be JSON serializable, like a [`.set()`](#setkey-value) value. With [dot notation](#accesspropertiesbydotnotation), a `schema` key must be a plain property name, so describe nested keys with `properties`. A name inside `properties` can contain a dot, such as `example.com`. Escape the dot to read or write it, such as `sites.example\.com` (in JavaScript, `'sites.example\\.com'`).

To have `get()` return the right types, annotate the schema with `Schema<T>`:

```ts
import Store, {type Schema} from 'electron-store';

type StoreType = {
	isEnabled: boolean;
	interval: number;
};

const schema: Schema<StoreType> = {
	isEnabled: {type: 'boolean'},
	interval: {type: 'number'}
};

const store = new Store({schema});

console.log(store.get('isEnabled'));
//=> typed as boolean
```

Without the annotation, TypeScript cannot tell the value types from the schema, so `get()` returns `unknown`. If you also pass `defaults`, the schema still wins the inference, so a key that is only in `defaults` is an error.

#### rootSchema

Type: `object`

[JSON Schema](https://json-schema.org) for the root object of the config. The `schema` option defines the `properties` of that object, so this is where you put everything that applies to the config object as a whole.

The `properties` keyword comes from the `schema` option. Do not put `properties` in `rootSchema`, as it will throw.

For example, to reject properties that are not in `schema`:

```js
const store = new Store({
	rootSchema: {
		additionalProperties: false
	},
	schema: {
		foo: {
			type: 'number'
		}
	}
});

store.set('bar', 1);
// [Error: Config schema violation: `` must NOT have additional properties]
```

To require a property, add it to `required` and give it a `default` in `schema` as well. Otherwise a new config has no value for the property and the store throws when it is created.

#### ajvOptions

Type: `object`

[Options passed to ajv](https://ajv.js.org/options.html), the JSON Schema validator used under the hood.

By default, `allErrors` and `useDefaults` are set to `true`, but you can override them.

Ajv runs in [strict mode](https://ajv.js.org/strict-mode.html) by default, so a schema that contains a keyword Ajv does not know about throws an error such as `strict mode: unknown keyword: "isEven"`. Turn strict mode off to allow such schemas:

```js
const store = new Store({
	schema: {
		foo: {
			type: 'number',
			isEven: true
		}
	},
	ajvOptions: {
		strict: false
	}
});
```

Ajv ignores the unknown keyword, so it does not validate anything on its own.

#### migrations

Type: `object`

**Important: I cannot provide support for this feature. It has some known bugs. I have no plans to work on it, but pull requests are welcome.**

You can use migrations to perform operations to the store whenever a version is upgraded.

The `migrations` object should consist of key-value pairs of `'version': handler`. The `version` can also be a [semver range](https://github.com/npm/node-semver#ranges). Migrations run in version order, whatever order they are defined in.

Example:

```js
import Store from 'electron-store';

const store = new Store({
	migrations: {
		'0.0.1': store => {
			store.set('debugPhase', true);
		},
		'1.0.0': store => {
			store.delete('debugPhase');
			store.set('phase', '1.0.0');
		},
		'1.0.2': store => {
			store.set('phase', '1.0.2');
		},
		'>=2.0.0': store => {
			store.set('phase', '>=2.0.0');
		}
	}
});
```

A migration must not create another `Store` instance with `migrations` for the same storage file.

A migration sees the keys the storage file holds and the values of the `defaults` option. The `default` values of the `schema` option are added after the migrations have run, since a migration may repair a value the schema rejects.

The store keeps its migration bookkeeping in the storage file under a reserved `__internal__` key. It is not exposed through `.store`, `.get()`, `.has()` or iteration, and `.set()` and `.delete()` reject it. This is why `rootSchema` can use `additionalProperties: false` together with `migrations`.

The recorded version never moves backwards, so running an older `projectVersion` than the store was migrated with does not run those migrations again.

Migrations do not run for a storage file that does not exist yet. There is no old data to migrate, so the store starts at the current project version. A storage file that exists but has no recorded version is still migrated, which covers an app that shipped before it had migrations.

If a migration throws, the changes it made are rolled back, and an error that includes its message is thrown. The migrations before it are kept.

#### projectVersion

Type: `string`\
Default: [`app.getVersion()`](https://electronjs.org/docs/api/app#appgetversion)

The version the `migrations` option compares against. It defaults to your app's version, so you only need to set this if you want the migrations to run against a different version, for example while developing.

With `migrations`, it must be a full semantic version, such as `1.0.0`.

#### beforeEachMigration

Type: `Function`\
Default: `undefined`

The given callback function will be called before each migration step.

The function receives the store as the first argument and a context object as the second argument with the following properties:

- `fromVersion` - The version the migration step is being migrated from.
- `toVersion` - The version the migration step is being migrated to. For a range, this is the version it runs at.
- `finalVersion` - The final version after all the migrations are applied.
- `versions` - The versions that will run in this migration pass.

This can be useful for logging purposes, preparing migration data, etc.

Example:

```js
import Store from 'electron-store';

console.log = someLogger.log;

// Migrations do not run for a storage file that does not exist yet, so these log for an app that has run before.

const mainConfig = new Store({
	projectVersion: '0.4.0',
	beforeEachMigration: (store, context) => {
		console.log(`[main-config] migrate from ${context.fromVersion} → ${context.toVersion}`);
	},
	migrations: {
		'0.4.0': store => {
			store.set('debugPhase', true);
		}
	}
});

const secondConfig = new Store({
	projectVersion: '1.0.1',
	beforeEachMigration: (store, context) => {
		console.log(`[second-config] migrate from ${context.fromVersion} → ${context.toVersion}`);
	},
	migrations: {
		'1.0.1': store => {
			store.set('debugPhase', true);
		}
	}
});
```

#### name

Type: `string`\
Default: `'config'`

Name of the storage file (without extension).

It may include a subdirectory of `cwd`, such as `sub/config`, but it must not point outside `cwd`.

This is useful if you want multiple storage files for your app. Or if you're making a reusable Electron module that persists some data, in which case you should **not** use the name `config`.

#### cwd

Type: `string`\
Default: [`app.getPath('userData')`](https://electronjs.org/docs/api/app#appgetpathname)

Storage file location. *Don't specify this unless absolutely necessary! By default, it will pick the optimal location by adhering to system conventions. You are very likely to get this wrong and annoy users.*

If a relative path, it's relative to the default cwd. For example, `{cwd: 'unicorn'}` would result in a storage file in `~/Library/Application Support/App Name/unicorn`.

#### encryptionKey

Type: `string | Uint8Array | TypedArray | DataView`\
Default: `undefined`

Note that this is **not intended for security purposes**, since the encryption key would be easily found inside a plaintext Node.js app.

Its main use is for obscurity. If a user looks through the config directory and finds the config file, since it's just a JSON file, they may be tempted to modify it. By providing an encryption key, the file will be obfuscated, which should hopefully deter any users from doing so.

When using `aes-256-gcm`, the config file is authenticated. If the file is changed in any way, the decryption will fail. With `aes-256-cbc` and `aes-256-ctr`, tampering can go undetected.

When specified, the store will be encrypted using the `encryptionAlgorithm` option (defaults to `aes-256-cbc`). An empty string is refused.

#### encryptionAlgorithm

Type: `'aes-256-cbc' | 'aes-256-gcm' | 'aes-256-ctr'`\
Default: `'aes-256-cbc'`

Encryption algorithm to use when `encryptionKey` is set.

Use `aes-256-gcm` if you want authentication, otherwise use `aes-256-cbc` or `aes-256-ctr`.

Changing `encryptionAlgorithm` will make existing encrypted data unreadable.

When using `aes-256-gcm` or `aes-256-ctr`, existing plaintext config files are not supported. Delete the config file or migrate it before enabling encryption. With `aes-256-cbc`, existing plaintext config files are still readable for backward compatibility.

#### fileExtension

Type: `string`\
Default: `'json'`

Extension of the config file.

You would usually not need this, but could be useful if you want to interact with a file with a custom file extension that can be associated with your app. These might be simple save/export/preference files that are intended to be shareable or saved outside of the app.

#### configFileMode

Type: `number`\
Default: `0o666`, reduced by the process umask

The [mode](https://en.wikipedia.org/wiki/File-system_permissions#Numeric_notation) used when creating the storage file.

The mode is modified by the [process umask](https://en.wikipedia.org/wiki/Umask), whether it is the default or given by this option. With the typical umask of `0o022`, the default results in `0o644`. Storage files are also stored in a location that is typically protected already, so the default is usually fine.

When this option is given, the mode is also applied to an existing storage file on every write. Otherwise, an existing storage file keeps its mode. A mode given by this option that, after the umask, leaves the file unreadable by its owner throws.

You would usually not need this, but it could be useful if you use a custom `cwd`. Setting `0o600` makes the file readable only by the owner.

Setting restrictive permissions can cause problems if different users need to read the file.

#### clearInvalidConfig

Type: `boolean`\
Default: `false`

The config is cleared if reading the config file causes a `SyntaxError` (malformed JSON, also when thrown by your own [`deserialize`](#deserialize)), a schema validation error when using the `schema` option, or a decryption failure when using `encryptionKey`, and the cleared store is written over the file. This is a good behavior for unimportant data, as the config file is not intended to be hand-edited, so it usually means the config is corrupt and there's nothing the user can do about it anyway. However, if you let the user edit the config file directly, mistakes might happen and it could be more useful to throw an error when the config is invalid instead of clearing.

A decryption failure includes a changed `encryptionKey` or `encryptionAlgorithm`, and a plaintext config file read with the `aes-256-gcm` or `aes-256-ctr` algorithm (for example, after adding encryption to an existing store). With your own `deserialize` and the `aes-256-cbc` or `aes-256-ctr` algorithm, a changed `encryptionKey` or `encryptionAlgorithm` is cleared only when your `deserialize` throws a `SyntaxError` for the data it cannot read, since those algorithms cannot tell a wrong key apart from damaged data. Any other error thrown by your own [`deserialize`](#deserialize) is thrown as is.

#### serialize

Type: `Function`\
Default: `value => JSON.stringify(value, null, '\t')`

Function to serialize the config object to a UTF-8 string, or to a `Uint8Array`, when writing the config file.

You would usually not need this, but it could be useful if you want to use a format other than JSON.

#### deserialize

Type: `Function`\
Default: `JSON.parse`, ignoring a leading byte order mark

Function to deserialize the config object from a UTF-8 string when reading the config file.

You would usually not need this, but it could be useful if you want to use a format other than JSON.

#### accessPropertiesByDotNotation

Type: `boolean`\
Default: `true`

Access nested properties by dot notation. For example:

```js
import Store from 'electron-store';

const store = new Store();

store.set({
	foo: {
		bar: {
			foobar: '🦄'
		}
	}
});

console.log(store.get('foo.bar.foobar'));
//=> '🦄'
```

Alternatively, you can set this option to `false` so the whole string is treated as one key.

```js
const store = new Store({accessPropertiesByDotNotation: false});

store.set({
	'foo.bar.foobar': '🦄'
});

console.log(store.get('foo.bar.foobar'));
//=> '🦄'
```

With this option on, `__proto__`, `constructor` and `prototype` cannot be used in a key: [`.set()`](#setkey-value) ignores such a key, [`.get()`](#getkey-defaultvalue) returns the default value for it, and the `defaults` and `schema` options throw for it. Set this option to `false` to use them as keys.

A key that is not a valid path, such as `a[x`, throws a `TypeError`.

#### watch

Type: `boolean`\
Default: `false`

Watch for any changes in the config file and call the callback for `onDidChange` or `onDidAnyChange` if set. This is useful if there are multiple processes changing the same config file, for example, if you want changes done in the main process to be reflected in a renderer process.

If the storage file is a symlink, the file it points to when the store is created is watched.

#### cache

Type: `boolean`\
Default: `false`

Keep the store in memory, so reading a value does not read and parse the storage file each time. This makes reads much faster, in particular when the storage file is large.

The cache is dropped on every write and whenever the [`watch`](#watch) option reports a change to the storage file. Writes read the storage file first, so changes made by another process are not lost, but reads only see them when `watch` is enabled or after a write.

The objects returned by [`.store`](#store), `.get()` and iteration, and the values passed to the `onDidChange` and `onDidAnyChange` callbacks, are the cache itself, so the plain objects and arrays in them are frozen. Changing one throws a `TypeError`. Use [`.set()`](#setkey-value) and [`.delete()`](#deletekey) to write, and copy a value first if you want to change it, for example with [`structuredClone()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone).

### Instance

You can use [dot-notation](https://github.com/sindresorhus/dot-prop) in a `key` to access nested properties. A number addresses an element of an array. Setting an index past the end fills the gap with `null`, and `.delete()` removes the element, so the later elements move down.

The instance is [`iterable`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Iteration_protocols) so you can use it directly in a [`for…of`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Statements/for...of) loop.

#### .set(key, value)

Set an item.

The `value` must be JSON serializable. Trying to set a value of type `undefined`, `function`, or `symbol` will result in a `TypeError`, and so will a `bigint` unless you use a custom `serialize`.

#### .set(object)

Set multiple items at once.

Each key replaces the whole value it names, so a nested object is not merged into the one the store holds. With dot notation, a key can be a path, such as `{'foo.bar': 1}`, which sets only that nested property.

#### .get(key, defaultValue?)

Get an item or `defaultValue` if the item does not exist.

#### .reset(...keys)

Reset items to their default values, as defined by the `defaults` or `schema` option. The `default` values of the `schema` option are not used when `ajvOptions.useDefaults` is `false`.

With dot notation, schema defaults below an optional object with no default of its own are unavailable to `reset()` when a parent default omits that object. Include the object in the parent default to reset its descendants individually.

Use `.clear()` to reset all items.

#### .has(key)

Check if an item exists.

#### .delete(key)

Delete an item.

#### .appendToArray(key, value)

Append an item to an array.

If the key doesn't exist, it will be created as an array. If the key exists and is not an array, a `TypeError` will be thrown.

The `value` must be JSON serializable. Trying to set a value of type `undefined`, `function`, or `symbol` will result in a `TypeError`, and so will a `bigint` unless you use a custom `serialize`.

```js
store.set('items', [{name: 'foo'}]);
store.appendToArray('items', {name: 'bar'});
console.log(store.get('items'));
//=> [{name: 'foo'}, {name: 'bar'}]

// Creates array if key doesn't exist
store.appendToArray('newItems', 'first');
console.log(store.get('newItems'));
//=> ['first']
```

#### .clear()

Delete all items.

This resets known items to their default values, if defined by the `defaults` or `schema` option. The `default` values of the `schema` option are not used when `ajvOptions.useDefaults` is `false`.

#### .onDidChange(key, callback)

`callback`: `(newValue, oldValue) => {}`

Watches the given `key`, calling `callback` on any changes.

A change noticed while the storage file cannot be read, for example while another process is writing it, is not reported.

When a key is first set, `oldValue` will be `undefined`, and when a key is deleted, `newValue` will be `undefined`.

Returns a function that unsubscribes when called:

```js
const unsubscribe = store.onDidChange(key, callback);

unsubscribe();
```

#### .onDidAnyChange(callback)

`callback`: `(newValue, oldValue) => {}`

Watches the whole config object, calling `callback` on any changes.

A change noticed while the storage file cannot be read, for example while another process is writing it, is not reported.

`oldValue` and `newValue` will be the config object before and after the change, respectively. You must compare `oldValue` to `newValue` to find out what changed.

Returns a function that unsubscribes when called:

```js
const unsubscribe = store.onDidAnyChange(callback);

unsubscribe();
```

#### .events

An [`EventTarget`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget) that dispatches a `change` event on every write of this instance, and when the [`watch`](#watch) option reports a change to the storage file. This is what `.onDidChange()` and `.onDidAnyChange()` listen on, and it is there if you want to listen directly:

```js
store.events.addEventListener('change', () => {
	console.log('The store changed');
});
```

#### .size

Get the item count.

#### .store

Get all the data as an object or replace the current data with an object:

```js
import Store from 'electron-store';

const store = new Store();

store.store = {
	hello: 'world'
};
```

Unlike [`.set()`](#setkey-value), a whole-store write drops a function or a symbol, like `JSON.stringify` does, instead of throwing. A `bigint` still throws, unless you use a custom `serialize`.

#### .path

Get the path to the storage file.

#### .openInEditor()

Open the storage file in the user's editor.

Returns a promise that resolves when the editor has been opened, or rejects if it failed to open.

### initRenderer()

Initializer to set up the required `ipc` communication channels for the module when a `Store` instance is not created in the main process and you are creating a `Store` instance in the Electron renderer process only.

The renderer process must have access to Node.js built-ins for this to work. See the warning at the top of this readme.

In the main process:

```js
import Store from 'electron-store';

Store.initRenderer();
```

And in the renderer process:

```js
import Store from 'electron-store';

const store = new Store();

store.set('unicorn', '🦄');
console.log(store.get('unicorn'));
//=> '🦄'
```

## FAQ

#### [Advantages over `window.localStorage`](https://github.com/sindresorhus/electron-store/issues/17)

#### Can I use YAML or another serialization format?

The `serialize` and `deserialize` options can be used to customize the format of the config file, as long as the representation is compatible with UTF-8.

Example using YAML:

```js
import Store from 'electron-store';
import yaml from 'js-yaml';

const store = new Store({
	fileExtension: 'yaml',
	serialize: yaml.dump,
	deserialize: yaml.load
});
```

#### How do I get store values in the renderer process when my store was initialized in the main process?

The store is not a singleton, so you will need to either [initialize the store in a file that is imported in both the main and renderer process](https://github.com/sindresorhus/electron-store/issues/15), or you have to pass the values back and forth as messages. Electron provides a handy [`invoke/handle` API](https://www.electronjs.org/docs/api/ipc-main#ipcmainhandlechannel-listener) that works well for accessing these values.

```js
ipcMain.handle('getStoreValue', (event, key) => {
	return store.get(key);
});
```

```js
const foo = await ipcRenderer.invoke('getStoreValue', 'foo');
```

#### Can I use it for large amounts of data?

No. This package reads and writes the entire JSON file on every change. It will get slow with even moderately large data (e.g., 1 MB+). Use it only for small amounts of data like user settings, value caching, state, etc.

For large data, use SQLite or save files to disk and store the path here instead.

#### Is the config file secure?

Config files are stored in [`app.getPath('userData')`](https://electronjs.org/docs/api/app#appgetpathname), which is inside the user's home directory. The home directory is typically private to the user on all platforms.

## Related

- [electron-util](https://github.com/sindresorhus/electron-util) - Useful utilities for developing Electron apps and modules
- [electron-debug](https://github.com/sindresorhus/electron-debug) - Adds useful debug features to your Electron app
- [electron-context-menu](https://github.com/sindresorhus/electron-context-menu) - Context menu for your Electron app
- [electron-dl](https://github.com/sindresorhus/electron-dl) - Simplified file downloads for your Electron app
- [electron-unhandled](https://github.com/sindresorhus/electron-unhandled) - Catch unhandled errors and promise rejections in your Electron app
- [electron-reloader](https://github.com/sindresorhus/electron-reloader) - Simple auto-reloading for Electron apps during development
- [electron-serve](https://github.com/sindresorhus/electron-serve) - Static file serving for Electron apps
- [conf](https://github.com/sindresorhus/conf) - Simple config handling for your app or module
- [More…](https://github.com/search?q=user%3Asindresorhus+electron)
