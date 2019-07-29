class Wire {
  constructor() {
    this.value = null;
  }
}

class Pin {
  constructor(name, side) {
    this.name = name || '';
    this.component = null;
    this.side = side || 'left';
    this.wire = null;
  } 
}

class Component {
  constructor(config) {
    this.pins = [];
    this.config = config || this.defaultConfig();

    this.init();
  }

  init() {}

  create(pinsInfo) {
    // ex.
    // left: ['a', 'b', 'c']
    // left: { prefix: 'I', count: 10, offset: 1, step: 2 }
    var sides = ['left', 'right', 'top', 'bottom'];
    for (var s of sides) {
      var item = pinsInfo[s];
      var newPins = [];

      if (item) {
        if (Array.isArray(item)) {
          for (var i of item) {
            if (i !== Object(i)) { // Primitive
              var newPin = new Pin(i, s);
              //newPin.component = this;
              newPins.push(newPin);
            } else {
              var pinInfo_prefix = (i.prefix != null) ? i.prefix : s.charAt(0).toUpperCase();
              var pinInfo_count = i.count || 0;
              var pinInfo_offset = i.offset || 0;
              var pinInfo_step = i.step || 1;

              for (var c = pinInfo_offset; c < pinInfo_count; c += pinInfo_step) {
                var newPin = new Pin(pinInfo_prefix + c.toString(), s);
                //newPin.component = this;
                newPins.push(newPin);
              }
            }
          }
        } else console.error('Pin info argument is not an array');
      }

      // TODO: Check if pin already exists, keep the instance
      this.pins = this.pins.concat(newPins);
    }
  }

  defaultConfig() { return {} }

  execute(actual) { console.log('execute'); return null; }

  run() {
    var actual = {};
    for (var p of this.pins) {
      actual[p.side] = actual[p.side] || {};
      actual[p.side][p.name] = (p.wire == null) ? null : p.wire.value;
    }

    var output = this.execute(actual);

    if (output) {
      for (var p of this.pins) {
        if (output[p.name] != null) {
          if (p.wire)
            p.wire.value = output[p.name];
        }
      }      
    }
  }

  connectPin(pinName, toPin) {
    if (toPin) {
      var fromPin = this.getPin(pinName);
      if (fromPin) {
        var reuseWire = null;
        if (fromPin.wire != null) reuseWire = fromPin.wire;
        if (toPin.wire != null) reuseWire = toPin.wire;
        if (reuseWire == null) reuseWire = new Wire();

        fromPin.wire = reuseWire;
        toPin.wire = reuseWire;
      } else console.error('fromPin cannot be null');
    } else console.error('toPin cannot be null');
  }

  getPin(pinName) {
    return this.pins.filter(i => i.name == pinName)[0];
  }

  debug(actual) {
    console.log(actual);
  }
}

class CONST extends Component {
  init() {
    this.create({
      right: ['Q']
    })
  }

  defaultConfig() {
    return { value: null };
  }

  execute(actual) {
    return { 'Q': this.config.value };
  }

  forceValue(value) {
    this.config.value = value;
  }
}

class AND extends Component {
  init() {
    var n = this.config.pinCount;
    if (n < 2) n = 2;

    this.create({
      left: [{ prefix: '', count: n }],
      right: ['Q']
    })
  }

  defaultConfig() {
    return { pinCount: 2 };
  }

  execute(actual) {
    this.debug(actual);

    var ret = true;
    for (var i in actual.left)
      ret = ret && (actual.left[i] || false);

    return { 'Q': ret }
  }
}

class NAND extends Component {
  init() {
    var n = this.config.pinCount;
    if (n < 2) n = 2;

    this.create({
      left: [{ prefix: '', count: n }],
      right: 'Q'
    })
  }

  defaultConfig() {
    return { pinCount: 2 };
  }

  execute(actual) {
    this.debug(actual);
    return { '0': true }
  } 
}

var constA = new CONST({ value: true });
var constB = new CONST({ value: true });

var c1 = new AND();
var c2 = new AND();

c1.connectPin('0', constA.getPin('Q'))
c1.connectPin('1', c2.getPin('Q'))

c2.connectPin('0', c1.getPin('Q'))
c2.connectPin('1', constB.getPin('Q'))


constA.run();
constB.run();
c1.run()
c2.run()

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

readline.question(`What's your name?`, (name) => {
  
  console.log(`Hi ${name}!`)
  readline.close()
})