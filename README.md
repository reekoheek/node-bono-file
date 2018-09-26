# bono-file

```sh
npm i bono-file
```

Bono file server

## Create server

```js
const http = require('http');
const FileBundle = require('bono-file');

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
let hash = 'change this to file hash';

await fetch(`/files/foo/${hash}`);
```
