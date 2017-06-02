# electron-store [![Build Status: Linux and macOS](https://travis-ci.org/sindresorhus/electron-store.svg?branch=master)](https://travis-ci.org/sindresorhus/electron-store) [![Build status: Windows](https://ci.appveyor.com/api/projects/status/m2m9o6gq77xxi2eg/branch/master?svg=true)](https://ci.appveyor.com/project/sindresorhus/electron-store/branch/master)

> Simple data persistence for your [Electron](https://electron.atom.io) app or module - Save and load user preferences, app state, cache, etc

Electron doesn't have a built-in way to persist user preferences and other data. This module handles that for you, so you can focus on building your app. The data is saved in a JSON file in [`app.getPath('userData')`](http://electron.atom.io/docs/api/app/#appgetpathname).

You can use this module directly in both the main and renderer process.

*[This project was recently renamed from `electron-config`.](https://github.com/sindresorhus/electron-store/issues/4)*


## Install

```
$ npm install electron-store
```


## Usage

```js
const Store = require('electron-store');
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

### Store([options])

Returns a new instance.

### options

#### defaults

Type: `Object`

Default data.

#### name

Type: `string`<br>
Default: `config`

Name of the storage file (without extension).

This is useful if you want multiple storage files for your app. Or if you're making a reusable Electron module that persists some data, in which case you should **not** use the name `config`.

#### cwd

Type: `string`<br>
Default: [`app.getPath('userData')`](http://electron.atom.io/docs/api/app/#appgetpathname)

Storage file location. *Don't specify this unless absolutely necessary!*

If a relative path, it's relative to the default cwd. For example, `{cwd: 'unicorn'}` would result in a storage file in `~/Library/Application Support/App Name/unicorn`.

### Instance

You can use [dot-notation](https://github.com/sindresorhus/dot-prop) in a `key` to access nested properties.

The instance is [`iterable`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Iteration_protocols) so you can use it directly in a [`for…of`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Statements/for...of) loop.

#### .set(key, value)

Set an item.

#### .set(object)

Set multiple items at once.

#### .get(key, [defaultValue])

Get an item or `defaultValue` if the item does not exist.

#### .has(key)

Check if an item exists.

#### .delete(key)

Delete an item.

#### .clear()

Delete all items.

#### .size

Get the item count.

#### .store

Get all the data as an object or replace the current data with an object:

```js
conf.store = {
	hello: 'world'
};
```

#### .path

Get the path to the storage file.


## Related

- [electron-debug](https://github.com/sindresorhus/electron-debug) - Adds useful debug features to your Electron app
- [electron-context-menu](https://github.com/sindresorhus/electron-context-menu) - Context menu for your Electron app
- [electron-dl](https://github.com/sindresorhus/electron-dl) - Simplified file downloads for your Electron app
- [electron-unhandled](https://github.com/sindresorhus/electron-unhandled) - Catch unhandled errors and promise rejections in your Electron app
- [conf](https://github.com/sindresorhus/conf) - Simple config handling for your app or module


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
