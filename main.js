
class Pin {
	constructor(component, ID, name, isInput = true) {
		this.ID = ID;
		this.component = component;

		this.name = name;
		this.isInput = isInput;
		this.width = Math.round(name.length / 3);
		this.value = null;

		this.svg = null;
	}
}

var cycIdx = 0;

class Component {
	constructor(inputsCount, outputsCount) {
		this.id = '';

		this.exeIdx = 0;
		this.instName = '';

		this.minWidth = 5;
		this.minHeight = 2;

		this.inputs = [];
		for (var i = 0; i < inputsCount; i++)
			this.inputs.push(new Pin(this, i, '', true));

		this.outputs = [];
		for (var i = 0; i < outputsCount; i++)
			this.outputs.push(new Pin(this, i, '', false));

		this.init();

		this.createSVG();
  }

  init() {}

  createSVG() {
  	var w = this.minWidth;
  	var wpx = w * 8;

  	var h = Math.max(this.minHeight, Math.max(this.inputs.length * 2, this.outputs.length * 2));
  	var hpx = h * 8;

  	this.svg = new SVG.G();
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

		this.svg.on('click', this.clickEvent, this);
		this.svg.on('dblclick', this.dblClickEvent, this);
		this.svg.draggable({snapToGrid: 8});

		var inStepSize = hpx / this.inputs.length;
		for (var i = this.inputs.length - 1; i >= 0; i--) {
			var item = this.inputs[i];
			item.svg = this.svg
				.circle(8)
				.move(-4, (inStepSize * i) + (inStepSize / 2) - 4)
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
			item.svg = this.svg
				.circle(8)
				.move(wpx - 4, (outStepSize * i) + (outStepSize / 2) - 4)
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

		var symbolSVG = new SVG.G();
		this.drawSymbol(symbolSVG);
		symbolSVG.move((wpx / 2) - (symbolSVG.width() / 2), (hpx / 2) - (symbolSVG.height() / 2));
		this.svg.add(symbolSVG);
  }

  drawSymbol(svg) {}

  pinClickedEvent(e) {
  	if (e.shiftKey)
  		this.value = this.value ? 0 : 1;
  	else
  		if (this.component.pinClicked) this.component.pinClicked(this);
  }

  clickEvent(e) { }
  dblClickEvent(e) { }

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
  	this.inputs[index].value = value;
  }

  update() {
  	for (var idx = 0; idx < this.inputs.length; idx++)
  		this.inputs[idx].svg.fill(this.inputs[idx].value ? '#0f0' : '#f00');

  	for (var idx = 0; idx < this.outputs.length; idx++)
  		this.outputs[idx].svg.fill(this.outputs[idx].value ? '#0f0' : '#f00');
  }
}

class INPUT extends Component {
  constructor() {
    super(0, 1);
  }

  clickEvent(e) {
  	this.outputs[0].value = this.outputs[0].value ? 0 : 1;
  }
}

class OUTPUT extends Component {
  constructor() {
    super(1, 0);
  }

  dblClickEvent(e) {
  	var name = prompt('Enter output name', '');

		if ((name != null) && (name != "")) {
		  
		}
  }
}

class NOR_Component extends Component {
  constructor(inputsCount = 2) {
  	if (inputsCount < 2) inputsCount = 2;
    super(inputsCount, 1);

		this.createSVG();
  }

  drawSymbol(svg) {
  	svg.svg('<path d="M 0 0 Q 11.2 0 14 8 Q 11.2 16 0 16 Q 2.8 16 2.8 8 Q 2.8 0 0 0 Z"></path><circle cx="15" cy="8" r="2"></circle>')
			.size(17,16)
			.fill('#cccccc')
			.stroke({ color: '#000', width: 1 });
  }

  execute() {
  	var res = (this.inputs[0].value ? true : false);
  	for (var idx = 1; idx < this.inputs.length; idx++)
  		res = res || (this.inputs[idx].value ? true : false);
  	this.outputs[0].value = !res; 
  }
}

class SR_Component extends Component {
	constructor() {
    super(2, 1);

    this.inputs[0].name = 'S';
    this.inputs[1].name = 'R';

    this.outputs[0].name = 'Q';

		this.createSVG();
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
    super(7, 4);

    this.inputs[0].name = 'A0';
    this.inputs[1].name = 'A1';
    this.inputs[2].name = 'A2';
    this.inputs[3].name = 'A3';

    this.inputs[4].name = 'CS';
    this.inputs[5].name = 'OE';
    this.inputs[6].name = 'RW';

    this.outputs[0].name = 'D0';
    this.outputs[1].name = 'D1';
    this.outputs[2].name = 'D2';
    this.outputs[3].name = 'D3';

    this.ram = Array(Math.pow(2, 4)).fill(0);
    this.ram[1] = 1;
    this.ram[2] = 2;
		this.createSVG();
  }

  execute() {
  	var csPin = this.inputs[4].value;
  	var oePin = this.inputs[5].value;
  	var rwPin = this.inputs[6].value;

  	var a0Pin = this.inputs[0].value;
  	var a1Pin = this.inputs[1].value;
  	var a2Pin = this.inputs[2].value;
  	var a3Pin = this.inputs[3].value;
  	var addr = (a0Pin ? 1 : 0) | (a1Pin ? 2 : 0) | (a2Pin ? 4 : 0) | (a3Pin ? 8 : 0);

  	if (csPin) {
  		if (rwPin) {
	  		if (oePin) {
	  			var ramValue = this.ram[addr];
	  			this.outputs[0].value = (ramValue >> 0) & 0x01;
	  			this.outputs[1].value = (ramValue >> 1) & 0x01;
	  			this.outputs[2].value = (ramValue >> 2) & 0x01;
	  			this.outputs[3].value = (ramValue >> 3) & 0x01;
	  		}
	  	} else {
	  		var d0Pin = this.outputs[0].value;
				var d1Pin = this.outputs[1].value;
				var d2Pin = this.outputs[2].value;
				var d3Pin = this.outputs[3].value;
				var dataValue = (d0Pin ? 1 : 0) | (d1Pin ? 2 : 0) | (d2Pin ? 4 : 0) | (d3Pin ? 8 : 0);

				this.ram[addr] = dataValue;
	  	}
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
	inst.svg.move(100,100);
	draw.add(inst.svg);
	components.push(inst);
}

var wires = [];
var pinSelected = null;
function pinClicked(pin) {
	if (pinSelected == null) {
		pinSelected = pin;
	} else {
		if (pin.isInput == pinSelected.isInput) {
			alert('Connection allowed only for input and output');
			pinSelected = null;
			return;
		}

		wires.push({ I: (pin.isInput) ? pin : pinSelected, O: (pin.isInput) ? pinSelected : pin });

		// TEMP //
		var con = pinSelected.svg.connectable({
		  container: links,
		  markers: markers
		}, pin.svg);

		pinSelected.svg.parent().on('dragmove', con.update);
		pin.svg.parent().on('dragmove', con.update);

		pinSelected = null;
	}
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

		var inst = new toolbox[componentItem.name]();
		inst.id = componentItem.id;
		inst.pinClicked = pinClicked;
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

			pinI.svg.parent().on('dragmove', con.update);
			pinO.svg.parent().on('dragmove', con.update);
		}
	}
}


// Compiler
function compileSource(componentName, source) {
	var compiledCode = [];

	compiledCode.push('class ' + componentName + '_Component extends Component {');

	// Create constructor
	compiledCode.push('\tconstructor() {');

	// Count inputs and outputs
	var inputPinCount = 0;
	var outputPinCount = 0;
	for (var idx = 0; idx < source.components.length; idx++) {
		var componentItem = source.components[idx];

		if (componentItem.name == 'INPUT') {
			inputPinCount++
		} else if (componentItem.name == 'OUTPUT') {
			outputPinCount++;
		}
	}
	compiledCode.push('\t\tsuper(' + inputPinCount + ', ' + outputPinCount + ');');

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
			compiledCode.push('\t\tthis.' + instanceName + ' = new ' + componentItem.name + '();');
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
	console.log(compiledCodeString);
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
var toolbox = { 'INPUT': INPUT, 'OUTPUT': OUTPUT, 'NOR_Component': NOR_Component, 'SR_Component': SR_Component, 'RAM_Component': RAM_Component };
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

// Playground
//addComponent('NOR_Component');
//addComponent('NOR_Component');

cycIdx++;

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

// Simulation
setInterval(function() {
	for (var idx = 0; idx < wires.length; idx++) {
		var wireItem = wires[idx];
		if (wireItem) {
			var pinI = wireItem.I;
			var pinO = wireItem.O;
			pinI.component.inputs[pinI.ID].value = pinO.component.outputs[pinO.ID].value;
		}
	}

	for (var idx = 0; idx < components.length; idx++) {
		var componentItem = components[idx];

		if (componentItem instanceof INPUT) {
		} else if (componentItem instanceof OUTPUT) {
		} else {
			for (var outIdx = 0; outIdx < componentItem.outputs.length; outIdx++)
				componentItem.getOut(outIdx);
			componentItem.update();
		}
	}
	cycIdx++;
}, 500);