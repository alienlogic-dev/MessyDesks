var fs = require('fs');
var express = require('express')
var app = express()
var cors = require('cors');
const WebSocket = require('ws');

const { JSDOM } = require( 'jsdom' );
const jsdom = new JSDOM( '' );

// Set window and document from jsdom
const { window } = jsdom;
const { document } = window;
// Also set global window and document before requiring jQuery
global.window = window;
global.document = document;

const $ = global.jQuery = require( 'jquery' );
var sourcecodeFilename = 'sourcecode.json';

const wss = new WebSocket.Server({ port: 8081 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    var tree = message.split('/');
    ws.send(spyInstanceTree(tree));
  });
});

class main {
  constructor() {
  }
  run() {
  }
}

var inst = new main();
var newInst = new main();

var runningSource = null;

var router = undefined;

var bodyParser = require('body-parser'); 
app.use(bodyParser.text()) // for parsing application/json
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(cors());

// this should be the only thing on your app
app.use(function (req, res, next) {
  // this needs to be a function to hook on whatever the current router is
  router(req, res, next)
})

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

function defineStuff() {
  router = express.Router()

  router.post('/upload', function(req, res) {
    logToConsole('Program uploaded from client');

    applySourcecode(req.body);

    fs.writeFile(sourcecodeFilename, JSON.stringify(req.body), 'utf8', function() {
      logToConsole('Program saved on disk');
    });

    res.send('Done.');
  });

  router.get('/source', function(req, res) {
    logToConsole('Client connected');
    res.send(runningSource);
  });

  router.get('/spy/*', function(req, res) {
    var tree = req.params[0].split('/');
    res.send(spyInstanceTree(tree));
  });
}

app.listen(3000);

defineStuff();

function spyInstanceTree(tree) {
  var spyInstance = inst;
  for (var n of tree) {
    if (n != '')
      spyInstance = spyInstance[n];
  }

  var ret = {};

  var exclude = ['settings', 'pins', 'runRequired'];

  for (let [key, value] of Object.entries(spyInstance)) {
    if (!exclude.includes(key)) {
      if (key.startsWith('c')) {
        var extra = {};
        for (let [skey, svalue] of Object.entries(value)) {
          if (skey.startsWith('c')) {
          } else if (skey.startsWith('w')) {
          } else {
            if (!exclude.includes(skey)) {
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

        ret[key] = pins;
      } else if (key.startsWith('w')) {
        ret[key] = value.value;
      } else {
        ret[key] = value;
      }
    }
  }

  return JSON.stringify(ret, getCircularReplacer());
}

function logToConsole(str) {
  var timestampString = (new Date()).toLocaleString('en-US', { hour12: false });
  console.log(`${timestampString} > ${str}`);
}

// Function to spy and copy component instances
function spyComponent(exclude, source, dest) {
  if (typeof source != 'undefined') {
    if (source != null) {
      for (let [key, value] of Object.entries(source)) {
        if (!exclude.includes(key)) {
          if (key.startsWith('c')) {
            //console.log(`Component - ${key}:`, value, dest, key, dest[key]);
            if (key in dest)
              spyComponent(exclude, value, dest[key]);
            //else
            //	console.log(`Skipped Component - ${key}:`, value, dest, key, dest[key]);
          } else if (key.startsWith('w')) {
            //console.log(`Wire - ${key}:`, value, dest, key);
            if (key in dest)
              dest[key].value = value.value;
            //else
            //	console.log(`Skipped Wire - ${key}:`, value, dest, key);
          } else {
            //console.log(`Other - ${key}:`, value, dest, key);
            if (key in dest)
              dest[key] = value;
            //else
            //	console.log(`Skipped Other - ${key}:`, value, dest, key);
          }
        }
      }
    }
  }
}

function applySourcecode(sourcecodeJson) {
  try {
    runningSource = sourcecodeJson.source;
    var code = sourcecodeJson.code + '\n newInst = new main();';
    defineStuff();
    eval(code);

    spyComponent(['pins', 'config'], inst, newInst);

    inst = newInst;

    logToConsole('Program loaded successfully');
  } catch (ex) {
    logToConsole('Program loading error: ');
    logToConsole(ex);
  }
}

function loadFromSourcecodeFile() {
  if (fs.existsSync(sourcecodeFilename)) {
    logToConsole('Loading program from disk');

    let rawdata = fs.readFileSync(sourcecodeFilename);
    let json = JSON.parse(rawdata);

    applySourcecode(json);
  }
}

console.log("   __  __                     _____            _    ");
console.log("  |  \\/  |                   |  __ \\          | |   ");
console.log("  | \\  / | ___  ___ ___ _   _| |  | | ___  ___| | __");
console.log("  | |\\/| |/ _ \\/ __/ __| | | | |  | |/ _ \\/ __| |/ /");
console.log("  | |  | |  __/\\__ \\__ \\ |_| | |__| |  __/\\__ \\   < ");
console.log("  |_|  |_|\\___||___/___/\\__, |_____/ \\___||___/_|\\_\\");
console.log("                         __/ |                      ");
console.log("                        |___/   RUNTIME v0.1             ");
logToConsole('Runtime started');

setTimeout(() => {
  loadFromSourcecodeFile();
}, 1000);

setInterval(function() {
  inst.run();
}, 10);