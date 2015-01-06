var express = require('express')
var app = express();
var fs = require('fs')

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

/*
app.get('/', function(request, response) {
  response.send('Hello World 2!')
})
*/

// read the content from an external file instead of being hardcoded
app.get('/', function(request, response) {
  response.send(fs.readFileSync('index.html').toString())
})


app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
