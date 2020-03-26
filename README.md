# bono-file

```sh
npm i bono-file
```

Bono file server

## Create server

```js
const http = require('http');
const { FileBundle } = require('bono-file');

const PORT = process.env.PORT || 3000;

const bundle = new FileBundle({ dataDir: '/path/to/data/dir' });
const server = http.createServer(bundle.callback());

server.listen(PORT, () => console.info('Listening at', PORT));
```

## Upload

```html
<form method="POST" action="http://localhost:3000/upload?bucket=/foo" enctype="multipart/form-data">
  <input type="file" name="file" multiple>

  <input type="submit">
</form>
```

## Get file

```js
let file = 'change this to filename';

await fetch(`/files/foo/${file}`); // get as mimetype
await fetch(`/files/foo/${file}?attachment=1`); // download with default name
await fetch(`/files/foo/${file}?attachment=1&name=foo.txt`); // download with specified name
```

## Use middlewares

```js
const http = require('http');
const Bundle = require('bono');

const { FileSystem, upload, download } = require('bono-file');

const PORT = process.env.PORT || 3000;

const fs = new FileSystem({ dataDir: '/path/to/data/dir' });

const bundle = new Bundle();

bundle.use(upload({ fs }));
bundle.use(download({ fs }));

const server = http.createServer(bundle.callback());

server.listen(PORT, () => console.info('Listening at', PORT));
```
