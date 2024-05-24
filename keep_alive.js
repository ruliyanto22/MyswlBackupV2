var http = require("http");

http.createServer(function (req, res) {
  res.write("On Server");
  res.end();
}).listen(8080);
