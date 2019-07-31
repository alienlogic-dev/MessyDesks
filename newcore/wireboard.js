class Wireboard {
  constructor(hasGUI) {
    this.hasGUI = hasGUI || false;

    if (this.hasGUI) {
      this.componentsSVG = new SVG.G();
      this.wiresSVG = new SVG.G();

      this.pinSelected = null;
    }

    this.components = [];
    this.componentsIdx = 0;

    this.wires = [];
  }

  /* GUI */
  clear() {
    this.componentsSVG.clear();
    this.wiresSVG.clear();
  }

  addToParentSVG(parentSVG) {
    parentSVG.add(this.componentsSVG);
    parentSVG.add(this.wiresSVG);
  }

  /* Components manager */
  addComponent(componentName, config = null) {
    var inst = new toolbox[componentName](config);
    inst.id = 'c' + this.componentsIdx++;

    if (this.hasGUI) {
      inst.x = Math.round(document.documentElement.scrollLeft / 8) * 8 + 200;
      inst.y = Math.round(document.documentElement.scrollTop / 8) * 8 + 200;
  
      inst.pinClicked = this.pinClicked;
      inst.createSVG();
      inst.svg.move(inst.x, inst.y);
      this.componentsSVG.add(inst.svg);
    }

    this.components.push(inst);
  }

  /* Wires manager */
  pinClicked(pin) {
    if (this.pinSelected == null) {
      this.pinSelected = pin;
    } else {
      if (pin === this.pinSelected) {
        alert('Cannot select to the same pin');
        this.pinSelected = null;
        return;
      }
  
      var wire = this.pinSelected.connectToPin(pin);
  
      if (wire) {
        if (!this.wires.includes(wire))
          this.wires.push(wire);
  
        var con = new WireConnection(this.pinSelected.svg, pin.svg, this.wiresSVG);
      }
  
      this.pinSelected = null;
    }
  }

  /* Source manager */
  toSource() {
    var source = {
      components: [],
      wires: []
    };

    // Components
    for (var idx = 0; idx < components.length; idx++) {
      var componentItem = components[idx];
      var newComponent = {
        id: componentItem.id,
        name: componentItem.constructor.name,
        x: componentItem.x,
        y: componentItem.y
      };
      if (componentItem.config)
        newComponent.config = componentItem.config;
      
      source.components.push(newComponent);
    }

    // Wires
    for (var idx = 0; idx < wires.length; idx++) {
      var wireItem = wires[idx];

      var newWire = [];

      for (var p of wireItem.references) {
        var newWireConnection = {
          cid: p.component.id,
          pn: p.name
        };
        newWire.push(newWireConnection);
      }

      source.wires.push(newWire);
    }

    return source;
  }

  fromSource(source) {
    // Clear the wireboard
    initWireboard();
    components = [];
    wires = [];

    // Components
    for (var idx in source.components) {
      var componentItem = source.components[idx];

      var inst = new toolbox[componentItem.name](componentItem.config);
      inst.id = componentItem.id;
      inst.x = componentItem.x;
      inst.y = componentItem.y;

      if (hasGUI) {
        inst.pinClicked = pinClicked;
        inst.createSVG();
        inst.svg.move(inst.x, inst.y);
        componentsSVG.add(inst.svg);
      }

      components.push(inst);

      componentsIdx = Math.max(componentsIdx, +(componentItem.id.replace('c','')) + 1);
    }

    // Wires
    for (var idx = 0; idx < source.wires.length; idx++) {
      var wireItem = source.wires[idx];

      var newWire = new Wire();

      var _firstPin = null;
      for (var c of wireItem) {
        var componentRef = components.filter(t => t.id == c.cid)[0];
        var componentPin = componentRef.getPin(c.pn);
        componentPin.connectToWire(newWire);

        if (hasGUI) {
          if (_firstPin) {
            var con = new WireConnection(_firstPin.svg, componentPin.svg, wiresSVG);
          } else
            _firstPin = componentPin;
        }
      }

      this.wires.push(newWire);
    }
  }

  /* Compiler */
  compile() {
  }
}