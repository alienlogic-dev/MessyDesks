
class Pin {
	constructor(component, ID, name, isInput = true, isBidirectional = false) {
		this.ID = ID;
		this.component = component;

		this.name = name;
		this.isInput = isInput;
		this.isBidirectional = isBidirectional;
		this.width = Math.round(name.length / 3);
		this.value = null;

		this.svg = null;
	}
}

var cycIdx = 0;

class Component {
	constructor(inputsList, outputsList, biList = 0, withGUI = false) {
		this.id = '';

		this.exeIdx = 0;
		this.instName = '';

		this.minWidth = 5;
		this.minHeight = 2;

		this.inputs = [];
		this.outputs = [];

		var inputIdx = 0;
		var outputIdx = 0;
		// Insert bidirectional pins
		if (biList instanceof Array)
			for (var i = 0; i < biList.length; i++) {
				this.inputs.push(new Pin(this, inputIdx++, biList[i], true, true));
				this.outputs.push(new Pin(this, outputIdx++, biList[i], false, true));
			}
		else
			for (var i = 0; i < biList; i++){
				this.inputs.push(new Pin(this, inputIdx++, '', true, true));
				this.outputs.push(new Pin(this, outputIdx++, '', false, true));
			}

		// Create list of inputs
		if (inputsList instanceof Array)
			for (var i = 0; i < inputsList.length; i++)
				this.inputs.push(new Pin(this, inputIdx++, inputsList[i], true));
		else
			for (var i = 0; i < inputsList; i++)
				this.inputs.push(new Pin(this, inputIdx++, '', true));

		// Create list of outputs
		if (outputsList instanceof Array)
			for (var i = 0; i < outputsList.length; i++)
				this.outputs.push(new Pin(this, outputIdx++, outputsList[i], false));
		else
			for (var i = 0; i < outputsList; i++)
				this.outputs.push(new Pin(this, outputIdx++, '', false));

		this.init();

		if (withGUI) this.createSVG();
  }

  init() {}

  createSVG() {
  	var w = this.minWidth;
  	var wpx = w * 8;

  	var h = Math.max(this.minHeight, Math.max(this.inputs.length * 2, this.outputs.length * 2));
  	var hpx = h * 8;

  	this.svg = new SVG.G();
		this.svg.on('click', this.clickEvent, this);
		this.svg.on('dblclick', this.dblClickEvent, this);
		this.svg.draggable({snapToGrid: 8});

		this.drawBody(wpx, hpx);
		this.drawPins(wpx, hpx);

		var symbolSVG = new SVG.G();
		this.drawSymbol(symbolSVG);

		symbolSVG.move((wpx / 2) - (symbolSVG.width() / 2), (hpx / 2) - (symbolSVG.height() / 2));
		this.svg.add(symbolSVG);
  }

  drawBody(wpx, hpx) {
  	this.svg.rect(wpx, hpx)
			.radius(2)
			.move(0, 0)
			.fill('#cccccc')
			.stroke({ color: '#666666', width: 2 });

		this.svg
			.text(this.constructor.name.replace('_Component',''))
			.font({
						  family:   'Menlo'
						, size:     12
						, anchor:   'middle'
						})
			.move(wpx / 2, -15);
  }

  drawPins(wpx, hpx) {
		var inStepSize = hpx / this.inputs.length;
		for (var i = this.inputs.length - 1; i >= 0; i--) {
			var item = this.inputs[i];

			if (item.isBidirectional)
				item.svg = this.svg.rect(8, 8);
			else
				item.svg = this.svg.circle(8);

			item.svg.move(-4, (inStepSize * i) + (inStepSize / 2) - 4)
				.addClass('pin')
				.fill('#ffcc00')
				.stroke({ color: '#000', width: 1 })
				.data('pin_id', item.ID)
				.on('click', this.pinClickedEvent, item);
			this.svg
				.text(item.name)
				.font({
							  family:   'Menlo'
							, size:     9
							, anchor:   'start'
							})
				.move(6, (inStepSize * i) + (inStepSize / 2) - 6);
		}

		var outStepSize = hpx / this.outputs.length;
		for (var i = this.outputs.length - 1; i >= 0; i--) {
			var item = this.outputs[i];

			if (item.isBidirectional)
				item.svg = this.svg.rect(8, 8);
			else
				item.svg = this.svg.circle(8);

			item.svg.move(wpx - 4, (outStepSize * i) + (outStepSize / 2) - 4)
				.fill('#fff')
				.addClass('pin')
				.stroke({ color: '#000', width: 1 })
				.data('pin_id', item.ID)
				.on('click', this.pinClickedEvent, item);
			this.svg
				.text(item.name)
				.font({
							  family:   'Menlo'
							, size:     9
							, anchor:   'end'
							})
				.move(wpx - 6, (outStepSize * i) + (outStepSize / 2) - 6);
		}
  }

  drawSymbol(svg) { }

  pinClickedEvent(e) {
  	if (e.shiftKey) {
  		var value = prompt('Enter value', this.value);
			if ((value != null) && (value != ""))
			  this.value = value;
  	}
  	else
  		if (e.altKey) {
  			var wire = wires.filter(t => (t.I === this) || (t.O === this));
  			removeWire(wire[0]);
  		}
  		else
  			if (this.component.pinClicked) this.component.pinClicked(this);
  }

  clickEvent(e) { }
  dblClickEvent(e) {
  	startComponentEdit(this);
  }

  /* Config */
  getConfig() { return null; }

  /* Runtime */
  execute() {}

  getOut(index) {
  	if (cycIdx > this.exeIdx) {
  		this.execute();
  		this.exeIdx++;
  	}
  	return this.outputs[index].value;
  }

  setIn(index, value) {
  	if (value != null)
  		this.inputs[index].value = value;
  }

  update() {
  	for (var idx = 0; idx < this.inputs.length; idx++)
  		this.inputs[idx].svg.fill((this.inputs[idx].value == null) ? '#ccc' : (+this.inputs[idx].value ? '#0f0' : '#f00'));

  	for (var idx = 0; idx < this.outputs.length; idx++)
  		this.outputs[idx].svg.fill((this.outputs[idx].value == null) ? '#ccc' : (+this.outputs[idx].value ? '#0f0' : '#f00'));
  }
}

class INPUT extends Component {
  constructor(config = null) {
    super(0, 1);

    this.alias = '';
  	if (config)
  		this.alias = config.alias;
  }

  dblClickEvent(e) {
  	var name = prompt('Enter input name', this.alias);

		if ((name != null) && (name != "")) {
		  this.alias = name;
		  this.aliasSVG.text(this.alias);
		}
  }

  drawBody(wpx, hpx) {
  	this.svg.rect(wpx, hpx)
			.radius(2)
			.move(0, 0)
			.fill('#cccccc')
			.stroke({ color: '#666666', width: 2 });

		this.aliasSVG = this.svg
			.text(this.alias)
			.font({
						  family:   'Menlo'
						, size:     12
						, anchor:   'middle'
						})
			.move(wpx / 2, -15);
  }

  getConfig() {
  	return {
  		alias: this.alias
  	};
  }
}

class OUTPUT extends Component {
  constructor(config = null) {
    super(1, 0);

    this.alias = '';
  	if (config)
  		this.alias = config.alias;
  }

  dblClickEvent(e) {
  	var name = prompt('Enter output name', this.alias);

		if ((name != null) && (name != "")) {
		  this.alias = name;
		  this.aliasSVG.text(this.alias);
		}
  }

  drawBody(wpx, hpx) {
  	this.svg.rect(wpx, hpx)
			.radius(2)
			.move(0, 0)
			.fill('#cccccc')
			.stroke({ color: '#666666', width: 2 });

		this.aliasSVG = this.svg
			.text(this.alias)
			.font({
						  family:   'Menlo'
						, size:     12
						, anchor:   'middle'
						})
			.move(wpx / 2, -15);
  }

  getConfig() {
  	return {
  		alias: this.alias
  	};
  }
}

class NOR_Component extends Component {
  constructor(config = null) {
  	var inputsCount = 2;
  	if (config)
  		inputsCount = config.inputsCount;

  	if (inputsCount < 2) inputsCount = 2;
    super(inputsCount, 1);
  }

  drawSymbol(svg) {
  	svg.svg('<path d="M 0 0 Q 11.2 0 14 8 Q 11.2 16 0 16 Q 2.8 16 2.8 8 Q 2.8 0 0 0 Z"></path><circle cx="15" cy="8" r="2"></circle>')
			.size(17,16)
			.fill('#cccccc')
			.stroke({ color: '#000', width: 1 });
  }

  execute() {
  	var res = (Boolean(+this.inputs[0].value) ? true : false);
  	for (var idx = 1; idx < this.inputs.length; idx++)
  		res = res || (Boolean(+this.inputs[idx].value) ? true : false);
  	this.outputs[0].value = !res ? 1 : 0; 
  }

  getConfig() {
  	return {
  		inputsCount: this.inputs.length
  	};
  }

  dblClickEvent(e) {
  }
}

class SR_Component extends Component {
	constructor() {
    super(['S', 'R'], ['Q']);
  }

  init() {
  	this._c0 = new NOR_Component();
  	this._c1 = new NOR_Component();
  }

  execute() {
		this._c0.setIn(0, this.inputs[1].value);
		this._c0.setIn(1, this._c1.getOut(0));
		
		this._c1.setIn(0, this._c0.getOut(0));
		this._c1.setIn(1, this.inputs[0].value);

		this.outputs[0].value = this._c0.getOut(0);
  }
}

class RAM_Component extends Component {
	constructor() {
    super(
    	['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15', 'CS', 'OE', 'RW'],
    	[],
    	['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']
    );

		this.minWidth = 10;

    this.ram = Array(Math.pow(2, 16)).fill(0);
    this.ram[0xFFFC] = 0x10;
    this.ram[0xFFFD] = 0x00;
  }

  execute() {
  	var csPin = +this.inputs[24].value;
  	var oePin = +this.inputs[25].value;
  	var rwPin = +this.inputs[26].value;

  	var addr = 0x00;
  	for (var i = 0; i < 16; i++)
  		addr = addr | (+this.inputs[i + 8].value ? (1 << i) : 0);

  	for (var i = 0; i < 8; i++)
  		this.outputs[i].value = null;

  	if (csPin) {
  		if (rwPin) {
	  		if (oePin) {
	  			var ramValue = this.ram[addr];
			  	for (var i = 0; i < 8; i++)
			  		this.outputs[i].value = (ramValue >> i) & 0x01;
	  		}
	  	} else {
		  	var dataValue = 0x00;
		  	for (var i = 0; i < 8; i++)
		  		dataValue = dataValue | (+this.inputs[i].value ? (1 << i) : 0);

				this.ram[addr] = dataValue;
	  	}
  	}
  }

  dblClickEvent(e) {
  	var value = prompt('Enter value @ 3', 0);

		if ((value != null) && (value != "")) {
		  this.ram[3] = +value;
		}
  }
}

globalcpu = null;
class CPU6502_Component extends Component {
	constructor() {
    super(
    	['RST', 'CLK'],
    	['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15', 'RW'],
    	['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']
    );

		this.minWidth = 10;

		this.lastRST_state = 0;
		this.lastCLK_state = 0;

    globalcpu = this.cpu = new CPU6502.CPU6502();
    this.cpu.md_component = this;

    this.cpu.read = function(addr) {
    	this.md_component.outputs[24].value = 1; // Rw

	  	for (var i = 0; i < 16; i++)
    		this.md_component.outputs[i + 8].value = (addr >> i) & 0x01;

	  	simStep();

	  	var data = 0x00;
	  	for (var i = 0; i < 8; i++)
	  		data = data | (+this.md_component.inputs[i].value ? (1 << i) : 0);

	    return data;
    }

    this.cpu.write = function(addr, value) {
      mem[addr & 0xFFFF] = value;
    }
  }

  execute() {
  	if ((+this.inputs[8].value == 1) && (this.lastRST_state == 0)){
  		this.lastRST_state = +this.inputs[8].value;
    	this.cpu.reset();
  	}
  	else
  		this.lastRST_state = +this.inputs[8].value;

  	if ((+this.inputs[9].value == 1) && (this.lastCLK_state == 0)){
  		this.lastCLK_state = +this.inputs[9].value;
    	this.cpu.step();
  	}
  	else
  		this.lastCLK_state = +this.inputs[9].value;
  }
}


class ToBus_Component extends Component {
	constructor() {
    super(8, 1);

    this.inputs[0].name = 'D0';
    this.inputs[1].name = 'D1';
    this.inputs[2].name = 'D2';
    this.inputs[3].name = 'D3';
    this.inputs[4].name = 'D4';
    this.inputs[5].name = 'D5';
    this.inputs[6].name = 'D6';
    this.inputs[7].name = 'D7';

    this.outputs[0].name = 'Bus';
  }

  execute() {
  	var data = 0x00;
  	for (var idx = 0; idx < this.inputs.length; idx++) {
  		var dPin = this.inputs[idx].value;
  		data = data | (dPin ? (1 << idx) : 0);
  	}
  	this.outputs[0].value = data;
  }
}

class FromBus_Component extends Component {
	constructor() {
    super(1, 8);

    this.inputs[0].name = 'Bus';

    this.outputs[0].name = 'D0';
    this.outputs[1].name = 'D1';
    this.outputs[2].name = 'D2';
    this.outputs[3].name = 'D3';
    this.outputs[4].name = 'D4';
    this.outputs[5].name = 'D5';
    this.outputs[6].name = 'D6';
    this.outputs[7].name = 'D7';
  }

  execute() {
  	var data = this.inputs[0].value;
  	for (var idx = 0; idx < this.outputs.length; idx++)
  		this.outputs[idx].value = (data >> idx) & 0x01;
  }
}

class TRI_Component extends Component {
	constructor() {
    super(
    	['I', 'En'],
    	[],
    	['Q']
    );
  }

  execute() {
  	var enPin = +this.inputs[2].value;

  	if (enPin) {
  		this.outputs[0].value = this.inputs[1].value;
  	} else {
  		this.outputs[0].value = null;
  	}
  }
}


// initialize SVG.js
var draw = SVG('drawing').size(1024, 1024);

var links = new SVG.G();
var markers = new SVG.G();
var nodes = new SVG.G();

// Wireboard
initWireboard();

var components = [];
function addComponent(componentName) {
	var inst = new toolbox[componentName]();
	inst.id = 'c' + components.length;
	inst.pinClicked = pinClicked;
	inst.createSVG();
	inst.svg.move(200,200);
	draw.add(inst.svg);
	components.push(inst);
}

var wires = [];
var pinSelected = null;
function pinClicked(pin) {
	if (pinSelected == null) {
		pinSelected = pin;
	} else {
		if (pin === pinSelected) {
			alert('Cannot select to the same pin');
			pinSelected = null;
			return;
		}

		if (pin.isBidirectional && pinSelected.isBidirectional) {
			wires.push({ I: pin, O: pinSelected });
			wires.push({ I: pinSelected, O: pin });
		} else {
			if (pin.isInput == pinSelected.isInput) {
				alert('Connection allowed only for input and output');
				pinSelected = null;
				return;
			}

			wires.push({ I: (pin.isInput) ? pin : pinSelected, O: (pin.isInput) ? pinSelected : pin });
		}

		// TEMP //
		var con = pinSelected.svg.connectable({
		  container: links,
		  markers: markers
		}, pin.svg);

		pin.con = con;
		pinSelected.con = con;

		pinSelected.svg.parent().on('dragmove', con.update);
		pin.svg.parent().on('dragmove', con.update);

		pinSelected = null;
	}
}
function removeWire(wire) {
	var idx = wires.indexOf(wire);
	wires.splice(idx, 1);
	wire.I.con.connector.remove();
}

function sourceFromWireboard() {
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
			config: componentItem.getConfig(),
			x: componentItem.svg.x(),
			y: componentItem.svg.y()
		};
		source.components.push(newComponent);
	}

	// Wires
	for (var idx = 0; idx < wires.length; idx++) {
		var wireItem = wires[idx];
		var pinI = wireItem.I;
		var pinO = wireItem.O;

		var newWire = {
			O: {
				component: pinO.component.id,
				pin: pinO.ID
			},
			I: {
				component: pinI.component.id,
				pin: pinI.ID
			}
		};
		source.wires.push(newWire);
	}

	return source;
}
function wireboardFromSource(source) {
	// Clear the wireboard
	initWireboard();
	components = [];
	wires = [];
	
	// Components
	for (var idx = 0; idx < source.components.length; idx++) {
		var componentItem = source.components[idx];

		var inst = new toolbox[componentItem.name](componentItem.config);
		inst.id = componentItem.id;
		inst.pinClicked = pinClicked;
		inst.createSVG();
		inst.svg.move(componentItem.x, componentItem.y);
		draw.add(inst.svg);
		components.push(inst);
	}

	// Wires
	for (var idx = 0; idx < source.wires.length; idx++) {
		var wireItem = source.wires[idx];

		var componentO = components.filter(t => t.id == wireItem.O.component);
		var componentI = components.filter(t => t.id == wireItem.I.component);
		if ((componentO.length > 0) && (componentI.length > 0)) {
			var pinO = componentO[0].outputs[wireItem.O.pin];
			var pinI = componentI[0].inputs[wireItem.I.pin];

			wires.push({
				I: pinI,
				O: pinO
			});

			// TEMP //
			var con = pinI.svg.connectable({
			  container: links,
			  markers: markers
			}, pinO.svg);

			pinI.con = con;
			pinO.con = con;

			pinI.svg.parent().on('dragmove', con.update);
			pinO.svg.parent().on('dragmove', con.update);
		}
	}
}

var wireboardSourceStack = [];
var componentEditStack = [];

function startComponentEdit(component) {
	if (component.constructor.source) {
		wireboardSourceStack.push(sourceFromWireboard());
	  componentEditStack.push(component.constructor.name.replace('_Component',''));
	  wireboardFromSource(component.constructor.source);

	  drawEditbox();
	}
}

function endLastComponentEdit() {
	if (wireboardSourceStack.length > 0) {
		newComponentFromWireboard(componentEditStack[componentEditStack.length - 1]);

		var lastSource = wireboardSourceStack[wireboardSourceStack.length - 1];
		wireboardFromSource(lastSource);

		wireboardSourceStack.splice(-1, 1);
		componentEditStack.splice(-1, 1);
	}
	else
		console.error('No editing pending!');

	drawEditbox();
}

function drawEditbox() {
  if (componentEditStack.length > 0) $('#editbox').removeClass('hidden'); else $('#editbox').addClass('hidden');
  $('#editbox .breadcrumb').html('');
  for (var idx in componentEditStack)
  	$('#editbox .breadcrumb').append('<li class="breadcrumb-item">' + componentEditStack[idx] + '</li>');
}

// Compiler
function compileSource(componentName, source) {
	var compiledCode = [];

	compiledCode.push('class ' + componentName + '_Component extends Component {');

	// Create constructor
	compiledCode.push('\tconstructor() {');

	// Count inputs and outputs
	var inputPinCount = 0;
	var inputAliases = [];
	var outputPinCount = 0;
	var outputAliases = [];
	for (var idx = 0; idx < source.components.length; idx++) {
		var componentItem = source.components[idx];

		if (componentItem.name == 'INPUT') {
			if (componentItem.config) inputAliases.push(componentItem.config.alias); else inputAliases.push('');
			inputPinCount++
		} else if (componentItem.name == 'OUTPUT') {
			if (componentItem.config) outputAliases.push(componentItem.config.alias); else outputAliases.push('');
			outputPinCount++;
		}
	}
	compiledCode.push('\t\tsuper(' + JSON.stringify(inputAliases) + ', ' + JSON.stringify(outputAliases) + ');');

	compiledCode.push('\t}');

	// Create instances
	compiledCode.push('\tinit() {');

	var aliases = {};

	var inputPinIndex = 0;
	var outputPinIndex = 0;
	for (var idx = 0; idx < source.components.length; idx++) {
		var componentItem = source.components[idx];
		var instanceName = componentItem.id;

		if (componentItem.name == 'INPUT') {
			instanceName = inputPinIndex++;
		} else if (componentItem.name == 'OUTPUT') {
			instanceName = outputPinIndex++;
		} else {
			compiledCode.push('\t\tthis.' + instanceName + ' = new ' + componentItem.name + '(' + JSON.stringify(componentItem.config) + ');');
		}

		aliases[componentItem.id] = instanceName;
	}

	compiledCode.push('\t}');

	// Connect wires
	compiledCode.push('\texecute() {');
	var wires = source.wires.slice(0);

	// Inputs
	for (var idx = 0; idx < wires.length; idx++) {
		var wireItem = wires[idx];
		if (wireItem) {
			var pinI = wireItem.I;
			var componentI = source.components.filter(t => t.id == pinI.component)[0];

			var pinO = wireItem.O;
			var componentO = source.components.filter(t => t.id == pinO.component)[0];

			if (componentO.name == 'INPUT') {
				var	outCode = 'this.inputs[' + aliases[componentO.id] + '].value';

				var inCode = 'this.' + aliases[pinI.component] + '.setIn(' + pinI.pin + ', ' + outCode + ')';

				if (componentI.name == 'OUTPUT')
					inCode = 'this.outputs[' + aliases[componentI.id] + '].value' + ' = ' + outCode;

				compiledCode.push( '\t\t' + inCode + ';' );

				wires[idx] = null;
			}
		}
	}

	// Normal
	for (var idx = 0; idx < wires.length; idx++) {
		var wireItem = wires[idx];
		if (wireItem) {
			var pinI = wireItem.I;
			var componentI = source.components.filter(t => t.id == pinI.component)[0];

			var pinO = wireItem.O;
			var componentO = source.components.filter(t => t.id == pinO.component)[0];

			if ((componentI.name != 'OUTPUT') && (componentI.name != 'OUTPUT')) {
				var outCode = 'this.' + aliases[pinO.component] + '.getOut(' + pinO.pin + ')';

				var inCode = 'this.' + aliases[pinI.component] + '.setIn(' + pinI.pin + ', ' + outCode + ')';

				compiledCode.push( '\t\t' + inCode + ';' );

				wires[idx] = null;
			}			
		}
	}

	// Outputs
	for (var idx = 0; idx < wires.length; idx++) {
		var wireItem = wires[idx];
		if (wireItem) {
			var pinI = wireItem.I;
			var componentI = source.components.filter(t => t.id == pinI.component)[0];

			var pinO = wireItem.O;
			var componentO = source.components.filter(t => t.id == pinO.component)[0];


			if (componentI.name == 'OUTPUT') {
				var outCode = 'this.' + aliases[pinO.component] + '.getOut(' + pinO.pin + ')';

				if (componentO.name == 'INPUT')
					outCode = 'this.inputs[' + aliases[componentO.id] + '].value';

				var inCode = 'this.outputs[' + aliases[componentI.id] + '].value' + ' = ' + outCode;

				compiledCode.push( '\t\t' + inCode + ';' );

				wires[idx] = null;
			}			
		}
	}

	if (wires.filter(t => t != null).length > 0)
		console.error('Something went wrong compiling the wires!');

	compiledCode.push('\t}');

	compiledCode.push('}');

	return compiledCode.join('\n');
}

function newComponentFromSource(componentName, source) {
	var compiledCode = [];

	var componentSource = source;
	var componentCode = compileSource(componentName, componentSource);

	compiledCode.push(componentName + '_Component = (');
	compiledCode.push(componentCode);
	compiledCode.push(');');

	compiledCode.push(componentName + '_Component');
	
	// Eval new component
	var compiledCodeString = compiledCode.join('\n');
	var ret = eval(compiledCodeString);

	toolbox[componentName + '_Component'] = ret;
	drawToolbox();
	initWireboard();
	components = [];
	wires = [];

	// Add component source as static
	ret.source = componentSource;
}

function newComponentFromWireboard(componentName) {
	newComponentFromSource(componentName, sourceFromWireboard());
}

// Project
var toolbox = { 'INPUT': INPUT, 'OUTPUT': OUTPUT, 'TRI_Component': TRI_Component, 'NOR_Component': NOR_Component, 'SR_Component': SR_Component, 'RAM_Component': RAM_Component, 'CPU6502_Component': CPU6502_Component, 'ToBus_Component': ToBus_Component, 'FromBus_Component': FromBus_Component };
drawToolbox();

function drawToolbox() {
	var toolboxDiv = $('#toolbox');
	toolboxDiv.html('');

	for (var idx in toolbox) {
		var toolboxItem = toolbox[idx];
		var newToolboxButton = '<button class="btn btn-outline-dark mr-2" onclick="addComponent(\'' + idx + '\')">' + idx.replace('_Component','') + '</button>';
		toolboxDiv.append(newToolboxButton);
	}
}

function saveProject() {
	var project = {
		toolbox: {},
		source: {}
	};

	// Source of toolbox components
	for (var idx in toolbox) {
		var toolboxItem = toolbox[idx];

		if (toolboxItem.source)
			project.toolbox[idx.replace('_Component', '')] = toolboxItem.source;
	}

	// Source from wireboard
	project.source = sourceFromWireboard();

	return project;
}
function loadProject(projectJSON) {
	var project = JSON.parse(projectJSON);

	// Load the toolbox
	for (var idx in project.toolbox) {
		var toolboxItem = project.toolbox[idx];
		newComponentFromSource(idx, toolboxItem);
	}

	wireboardFromSource(project.source);
}

function saveProjectToFile() {
	var filename = prompt('Enter project filename', 'project');
	if ((filename != null) && (filename != ""))
		download(JSON.stringify(saveProject()), filename + '.prj', 'text/plain');
}


var openFile = function(event) {
  var input = event.target;

  var reader = new FileReader();
  reader.onload = function(){
    var text = reader.result;
    loadProject(text);
  };
  reader.readAsText(input.files[0]);
};
// Playground
//addComponent('NOR_Component');
//addComponent('NOR_Component');

function initWireboard() {
	draw.clear();

	// Draw grid
	for (x = 0; x < 128; x++)
		draw.line(x*8, 0, x*8, 1024).stroke({ opacity: 0.1, width: 1 });

	for (y = 0; y < 128; y++)
		draw.line(0, y*8, 1024, y*8).stroke({ opacity: 0.1, width: 1 });

	// Clear wire drawings
	links.clear();
	markers.clear();
	nodes.clear();

	// Add wires to top level
	draw.add(links);
	draw.add(markers);
	draw.add(nodes);
}

// Function to download data to a file
function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

// Simulation
function simStep() {
	cycIdx++;
	for (var idx = 0; idx < wires.length; idx++) {
		var wireItem = wires[idx];
		if (wireItem) {
			var pinI = wireItem.I;
			var pinO = wireItem.O;
			pinI.component.setIn(pinI.ID, pinO.component.getOut(pinO.ID));
		}
	}
}
setInterval(function() {
	simStep();

	for (var idx = 0; idx < components.length; idx++) {
		var componentItem = components[idx];

		if (componentItem instanceof INPUT) {
		} else if (componentItem instanceof OUTPUT) {
		} else {
			componentItem.update();
		}
	}
}, 500);