class Wire extends Cable {
  constructor() {
    super();
    
    this.value = null;
    this.references = [];
  }
}

class Pin extends Pong {
  constructor(name, side) {
    super();
    
    this.name = name.replace('!', '').replace('_', '') || '';
    this.component = null;
    this.side = side || 'left';
    this.wire = null;
    this.value = null;

    this.isInverted = name.startsWith('!'); // Name starts with !
    this.isHidden = name.startsWith('_'); // Name starts with _
  }

  tryStaticReference() {
    if (this.component) {
      var pIdx = this.component.pins.filter(t => t.side == this.side).indexOf(this);
      if (pIdx < 0) return this.name;
      return `@${this.side[0].toLowerCase()}${pIdx}`;
    }
    return this.name;
  }

  connectToWire(toWire) {
    // Same wire check
    if (this.wire != null)
      if (this.wire == toWire)
        return null;

    if (this.wire != toWire) toWire.references.push(this);
    this.wire = toWire;
  }
}

class Component extends Symbol {
  constructor(config) {
    super();

    this.runRequired = false;

    this.pins = [];

    this.config = this.defaultConfig();

    if (config)
      for (var k in config)
        this.config[k] = config[k];

    this.construct();

    try {
      this.init();
    } catch (e) {
      console.log(e);
    }
  }

  construct() {}
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
              newPin.component = this;
              newPins.push(newPin);
            } else {
              var pinInfo_prefix = (i.prefix != null) ? i.prefix : s.charAt(0).toUpperCase();
              var pinInfo_count = i.count || 0;
              var pinInfo_offset = i.offset || 0;
              var pinInfo_step = i.step || 1;

              for (var c = pinInfo_offset; c < pinInfo_count; c += pinInfo_step) {
                var newPin = new Pin(pinInfo_prefix + c.toString(), s);
                newPin.component = this;
                newPins.push(newPin);
              }
            }
          }
        } else console.error('Pin info argument is not an array');
      }

      this.pins = this.pins.concat(newPins);
    }
  }

  defaultConfig() { return {} }

  execute(actual) { return null; }

  run() {
    this.runRequired = false;

    var actual = {};
    for (var p of this.pins) {
      actual[p.side] = actual[p.side] || {};
      actual[p.side][p.name] = (p.wire == null) ? p.value : p.wire.value;
    }

    var output = null;
    try {
      output = this.execute(actual);
    } catch (e) {
      console.log(e);
    }
    
    if (output) {
      for (var p of this.pins) {
        if (p.name in output) {
          if (p.wire)
            p.wire.value = output[p.name];
          else
            p.value = output[p.name];
        }
      }
    }

    return output;
  }

  getPin(pinName) {
    if (pinName.startsWith('@')) { // Use format @ [side letter] [pin number] ex. @l12 [left - 12]
      var pinSide = pinName.substr(1,1).toLowerCase();
      var pinNumber = +pinName.substr(2);
      return this.pins.filter(i => i.side.toLowerCase().startsWith(pinSide))[pinNumber];
    } else
      return this.pins.filter(i => i.name == pinName)[0];
  }

  connectPinToWire(pinName, wire) {
    return this.getPin(pinName).connectToWire(wire);
  }

  writePin(pinName, value) {
    var pin = this.getPin(pinName);
    if (pin) {
      this.runRequired = true;
      if (pin.wire)
        pin.wire.value = value;
      else
        pin.value = value;
    }
  }

  readPin(pinName) {
    if (this.runRequired)
      this.run();

    var pin = this.getPin(pinName);
    if (pin)
      if (pin.wire)
        return pin.wire.value;
      else
        return pin.value;
    
    return null;
  }
}