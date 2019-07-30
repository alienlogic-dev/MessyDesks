class Wire {
  constructor() {
    this.value = null;
  }
}

class Pin {
  constructor(name, side) {
    this.name = name.replace('!', '').replace('_', '') || '';
    this.component = null;
    this.side = side || 'left';
    this.wire = null;

    this.isInverted = name.startsWith('!'); // Name starts with !
    this.isHidden = name.startsWith('_'); // Name starts with _
  }

  connect(toPin) {
    var reuseWire = null;
    if (this.wire != null) reuseWire = this.wire;
    if (toPin.wire != null) reuseWire = toPin.wire;
    if (reuseWire == null) reuseWire = new Wire();

    this.wire = reuseWire;
    toPin.wire = reuseWire;

    return reuseWire;
  }
}

class Component extends Symbol {
  constructor(config) {
    super();

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
        return fromPin.connect(toPin);
      } else console.error('fromPin cannot be null');
    } else console.error('toPin cannot be null');
    return null;
  }

  getPin(pinName) {
    return this.pins.filter(i => i.name == pinName)[0];
  }

  writePin(pinName, value) {
    var pin = this.getPin(pinName);
    if (pin)
      if (pin.wire)
        pin.wire.value = value;
  }

  readPin(pinName) {
    var pin = this.getPin(pinName);
    if (pin)
      if (pin.wire)
        return pin.wire.value;
    return null;
  }

  debug(actual) {
    console.log(actual);
  }
}