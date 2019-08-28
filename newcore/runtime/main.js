var fs = require('fs');
var express = require('express')
var app = express()
var cors = require('cors');
const WebSocket = require('ws');
var NanoTimer = require('nanotimer');

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

  return JSON.stringify(ret, getCircularReplacer());
}

function logToConsole(str) {
  var timestampString = (new Date()).toLocaleString('en-US', { hour12: false });
  console.log(`${timestampString} > ${str}`);
}

function applySourcecode(sourcecodeJson) {
  try {
    runningSource = sourcecodeJson.source;
    var code = sourcecodeJson.code + '\n inst = new main();';
    defineStuff();
    eval(code);

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