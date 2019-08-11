class Wireboard {
  constructor(name, hasGUI) {
    this.name = name || 'main';
    this.hasGUI = hasGUI || false;

    if (this.hasGUI) {
      this.componentsSVG = new SVG.G();
      this.wiresSVG = new SVG.G();

      this.pinSelected = null;
    }

    this.components = [];
    this.componentsIdx = 0;

    this.wires = [];

    this.executionOrder = [];
  }

  /* GUI */
  clear() {
    this.components = [];
    this.wires = [];
    this.executionOrder = [];

    if (this.hasGUI) {
      this.componentsSVG.clear();
      this.wiresSVG.clear();
    }
  }

  addToParentSVG(parentSVG) {
    parentSVG.add(this.componentsSVG);
    parentSVG.add(this.wiresSVG);
  }

  removeFromParentSVG() {
    this.componentsSVG.remove();
    this.wiresSVG.remove();
  }

  /* Generics */
  newComponent(componentName, id, x, y, config, needUpdate) {
    needUpdate = (needUpdate == null) ? true : needUpdate;

    componentName = componentName || '';
    x = x || 0;
    y = y || 0;
    config = config || null;

    var inst = new toolbox[componentName](config);
    inst.id = id || ('c' + this.componentsIdx++);
    inst.x = x;
    inst.y = y;

    if (this.hasGUI) {
      var wireboardRef = this;
      inst.initGUI();
      inst.pinClicked = function(p, r) { wireboardRef.pinClicked(p, r) };
      inst.createSVG();
      inst.svg.move(inst.x, inst.y);
      this.componentsSVG.add(inst.svg);
    }

    this.components.push(inst);

    if (needUpdate)
      this.updateExecutionOrder();
  }

  newWire(fromPin, toPin, needUpdate) {
    needUpdate = needUpdate || true;

    if ((fromPin.wire != null) && (toPin.wire != null)) {
      if (fromPin.wire == toPin.wire) // Same wire, do nothing
        return null;
      else {
        // Keep the 'biggest' wire
        var keepWire = fromPin.wire;
        if (toPin.wire.references.length > keepWire.references.length) keepWire = toPin.wire;

        var deleteWire = (fromPin.wire == keepWire) ? toPin.wire : fromPin.wire;

        keepWire.references = keepWire.references.concat(deleteWire.references);

        for (var rp of deleteWire.references)
          rp.wire = keepWire;
        
        deleteWire.references = null;

        var wIdx = this.wires.indexOf(deleteWire);
        this.wires.splice(wIdx, 1);

        if (this.hasGUI) {
          deleteWire.svg.remove();
          keepWire.refresh();
        }
      }
    } else {
      var reuseWire = null;
      if (fromPin.wire != null) reuseWire = fromPin.wire;
      if (toPin.wire != null) reuseWire = toPin.wire;
      if (reuseWire == null) {
        reuseWire = new Wire();

        if (this.hasGUI) {
          reuseWire.createSVG();
          this.wiresSVG.add(reuseWire.svg);
        }
      }
  
      if (fromPin.wire != reuseWire) reuseWire.references.push(fromPin);
      fromPin.wire = reuseWire;
  
      if (toPin.wire != reuseWire) reuseWire.references.push(toPin);
      toPin.wire = reuseWire;
  
      if (!this.wires.includes(reuseWire))
        this.wires.push(reuseWire);

      if (this.hasGUI) {
        reuseWire.refresh();
      }
    }

    if (needUpdate)
      this.updateExecutionOrder();
  }

  /* Components manager */
  addComponent(componentName, config = null) {
    var px = 0;
    var py = 0;

    if (this.hasGUI) {
      px = Math.round(document.documentElement.scrollLeft / 8) * 8 + 200;
      py = Math.round(document.documentElement.scrollTop / 8) * 8 + 200;
    }

    this.newComponent(componentName, null, px, py, config);
  }

  removeSelectedComponents() {
    for (var cIdx = this.components.length - 1; cIdx >= 0; cIdx--) {
      var c = this.components[cIdx];

      if (c.isSelected) {
        for (var p of c.pins)
          this.disconnectPinFromWire(p, false);
        
        c.svg.remove();
        this.components.splice(cIdx, 1);          
      }
    }

    this.updateExecutionOrder();
  }

  /* Wires manager */
  pinClicked(pin, removeWire) {
    if (removeWire) {
      this.pinSelected = null;
      this.disconnectPinFromWire(pin);
    } else {
      if (this.pinSelected == null) {
        this.pinSelected = pin;
      } else {
        if (pin === this.pinSelected) {
          alert('Cannot select to the same pin');
          this.pinSelected = null;
          return;
        }
    
        this.newWire(this.pinSelected, pin);
  
        this.pinSelected = null;
      }
    }
  }

  disconnectPinFromWire(pin, needUpdate) {
    needUpdate = needUpdate || true;

    if (pin.wire != null) {
      var pIdx = pin.wire.references.indexOf(pin);
      pin.wire.references.splice(pIdx, 1);

      // Wire can only exists with 2 pin or more connected
      if (pin.wire.references.length < 2) {
        // Remove last single connection to alone pin
        for (var rIdx = 0; rIdx < pin.wire.references.length; rIdx++)
          pin.wire.references[rIdx].wire = null;

        var wIdx = this.wires.indexOf(pin.wire);
        this.wires.splice(wIdx, 1);          
      }
      
      pin.wire.refresh();
    }

    if (needUpdate)
      this.updateExecutionOrder();
  }

  /* Source manager */
  toSource() {
    var ret = {
      name: this.name,
      source: {
        components: [],
        wires: []
      }
    };

    // Components
    for (var idx = 0; idx < this.components.length; idx++) {
      var componentItem = this.components[idx];
      var newComponent = {
        id: componentItem.id,
        name: componentItem.constructor.name,
        x: this.hasGUI ? componentItem.svg.x() : componentItem.x,
        y: this.hasGUI ? componentItem.svg.y() : componentItem.y,
      };
      if (componentItem.config)
        newComponent.config = componentItem.config;
      
      ret.source.components.push(newComponent);
    }

    // Wires
    for (var idx = 0; idx < this.wires.length; idx++) {
      var wireItem = this.wires[idx];

      var newWire = [];

      for (var p of wireItem.references) {
        var newWireConnection = {
          cid: p.component.id,
          pn: p.name
        };
        newWire.push(newWireConnection);
      }

      ret.source.wires.push(newWire);
    }

    return ret;
  }

  fromSource(src) {
    // Clear the wireboard
    this.clear();

    this.name = src.name;

    // Components
    for (var componentItem of src.source.components) {
      this.newComponent(componentItem.name, componentItem.id, componentItem.x, componentItem.y, componentItem.config, false);

      this.componentsIdx = Math.max(this.componentsIdx, +(componentItem.id.replace('c','')) + 1);
    }

    // Wires
    for (var wireItem of src.source.wires) {
      var _firstPin = null;
      for (var c of wireItem) {
        var componentRef = this.components.filter(t => t.id == c.cid)[0];
        var componentPin = componentRef.getPin(c.pn);

        if (_firstPin) {
          this.newWire(_firstPin, componentPin, false);
        } else
          _firstPin = componentPin;
      }
    }

    this.updateExecutionOrder();
  }

  /* Wireboard core */
  getAloneComponents() {
    var aloneComponents = [];

    for (var idx in this.components) {
      var componentItem = this.components[idx];
      // Pins on the right are treated as outputs
      var rightConnectedPins = componentItem.pins.filter(p => (p.side == 'right') && (p.wire != null));
      if (rightConnectedPins.length == 0)
        aloneComponents.push(componentItem);
    }
  
    return aloneComponents;
  }

  generateExecutionOrderOfComponent(component, order, callStack) {
    if (!order) order = [];

    if (!callStack) callStack = [];
    callStack.push(component);

    // Pins NOT on the right are treated as inputs
    var inputConnectedPins = component.pins.filter(p => (p.side != 'right') && (p.wire != null));

    for (var p of inputConnectedPins) {
      var sourcePins = p.wire.references.filter(t => t.side == 'right');

      for (var s of sourcePins) {
        var sourceComponent = s.component;

        if (sourceComponent) {
          if (!callStack.includes(sourceComponent)) {
            if (order.includes(sourceComponent)) {
              var fIdx = order.indexOf(sourceComponent);
              order.splice(fIdx, 1);
            }
            order.push(sourceComponent);
            this.generateExecutionOrderOfComponent(sourceComponent, order, callStack);
          }
        }
      }
    }

    callStack.pop();

    return order;
  }

  updateExecutionOrder() {
    var exeOrder = [];

    var aloneComponents = this.getAloneComponents();
    for (var c of aloneComponents) {
      exeOrder.push(c);
      exeOrder = this.generateExecutionOrderOfComponent(c, exeOrder);
    }

    this.executionOrder = exeOrder.reverse();
  }

  /* Simulation */
  simulate() {
    for (var c of this.executionOrder)
      c.run();
  }

  /* Compiler */
  toSilicon() {
    var compiledCode = [];

    this.updateExecutionOrder();

    compiledCode.push(`class ${this.name} extends Component {`);

    // Create init
    compiledCode.push(`\tinit() {`);

    var createConfig = {
      top: [],
      left: [],
      bottom: [],
      right: []
    };

    var inputComponents = this.components.filter(t => t.constructor.name == 'INPUT');
    var inputIdx = 0;
    for (var c of inputComponents) {
      c.config.alias = ((c.config.alias == null) || (c.config.alias == '')) ? `I${inputIdx.toString()}` : c.config.alias;
      createConfig[(c.config.side || 'left').toLowerCase()].push(c.config.alias);
      inputIdx++;
    }

    var outputComponents = this.components.filter(t => t.constructor.name == 'OUTPUT');
    var outputIdx = 0;
    for (var c of outputComponents) {
      c.config.alias = ((c.config.alias == null) || (c.config.alias == '')) ? `O${outputIdx.toString()}` : c.config.alias;
      createConfig.right.push(c.config.alias);
      outputIdx++;
    }

    compiledCode.push(`\t\tthis.create(${JSON.stringify(createConfig)})`);

    // Create component instances
    var realComponents = this.components;
    for (var c of realComponents) {
			compiledCode.push(`\t\tthis.${c.id} = new ${c.constructor.name}(${JSON.stringify(c.config)});`);
    }

    // Create wire instances
    for (var wIdx in this.wires) {
      var w = this.wires[wIdx];
      compiledCode.push(`\t\tthis.w${wIdx} = new Wire();`);
    }

    // Create connections
    for (var wIdx in this.wires) {
      var w = this.wires[wIdx];
      for (var p of w.references) {
        compiledCode.push(`\t\tthis.${p.component.id}.connectPinToWire("${p.name}", this.w${wIdx})`);
      }
    }

    compiledCode.push(`\t}`);

    // Create execution
    compiledCode.push(`\texecute(actual) {`);
    compiledCode.push(`\t\tvar ret = {};`);

    for (var c of this.executionOrder) {
      if (c.constructor.name == 'INPUT')
        compiledCode.push(`\t\tthis.${c.id}.setValue(actual["${c.config.side}"]["${c.config.alias}"]);`);
        
      compiledCode.push(`\t\tthis.${c.id}.run();`);

      if (c.constructor.name == 'OUTPUT')
        compiledCode.push(`\t\tret["${c.config.alias}"] = this.${c.id}.getValue();`);
    }
    compiledCode.push(`\t\treturn ret;`);
    compiledCode.push(`\t}`);

    compiledCode.push(`}`);

  	return compiledCode.join('\n');
  }
}