var express = require('express')
var app = express()
var cors = require('cors');

var runningSource = null;

var router = undefined;

var bodyParser = require('body-parser'); 
app.use(bodyParser.text()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(cors());

// this should be the only thing on your app
app.use(function (req, res, next) {
  // this needs to be a function to hook on whatever the current router is
  router(req, res, next)
})

function defineStuff() {
  router = express.Router()

  router.post('/code', function(req, res) {
    var code = req.body + '\n inst = new main();';
    defineStuff();
    eval(code);
    res.send('POST request to the homepage');
  });

  router.post('/source', function(req, res) {
    runningSource = req.body;
    res.send('POST request to the homepage');
  });

  router.get('/source', function(req, res) {
    res.send(runningSource);
  });

  router.get('/spy/*', function(req, res) {
    var tree = req.params[0].split('/');

    var spyInstance = inst;
    for (var n of tree) {
      if (n != '')
        spyInstance = spyInstance[n];
    }

    var ret = {};

    var exclude = [];

    for (let [key, value] of Object.entries(spyInstance)) {
			if (!exclude.includes(key)) {
				if (key.startsWith('c')) {
          var extra = {};
          for (let [skey, svalue] of Object.entries(value)) {
            if (skey.startsWith('c')) {
            } else if (skey.startsWith('w')) {
            } else {
              if (skey != 'pins') {
                extra[skey] = svalue;
              }
            }
          }


          var pins = [];
          for (var pIdx in value.pins) {
            var p = value.pins[pIdx];
            if (p.wire == null) {
              var tPin = {
                name: p.name,
                value: p.value
              };
              pins.push(tPin);
            }
          }

          extra['pins'] = pins;

          //console.log(extra);


          ret[key] = pins;
				} else if (key.startsWith('w')) {
          ret[key] = value.value;
				} else {
          ret[key] = value;
				}
			}
    }

    var json = JSON.stringify(ret);

    res.send(json);
  });
}

app.listen(3000)

function spyComponent(instance, key) {

}

defineStuff();

class main {
  constructor() {
  }
  run() {
  }
}

var inst = new main();

setInterval(function() {
  inst.run();
}, 50);