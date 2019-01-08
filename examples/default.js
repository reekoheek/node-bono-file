const http = require('http');
const FileBundle = require('..');

const PORT = process.env.PORT || 3000;

let bundle = new FileBundle();

bundle.get('/', ctx => {
  ctx.body = `
    <html>
      <body>
        <form method="POST" enctype="multipart/form-data" action="/upload?bucket=/foo">
          <input type="file" name="file" multiple>
          <input type="submit">
        </form>
      </body>
    </html>
  `;
});

let server = http.createServer(bundle.callback());
server.listen(PORT, () => console.info(`Listening on port ${PORT}`));
