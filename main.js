
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
  	if (e.shiftKey) {
  		this.value = this.value ? 0 : 1;
  		this.svg.fill(this.value ? '#0f0' : '#f00');
  	}
  	else
  		if (this.component.pinClicked) this.component.pinClicked(this);
  }

  /* Runtime */
  execute() {}

  getOut(index) {
  	if (cycIdx > this.exeIdx) {
  		this.execute();
  		this.exeIdx++;
  	}
  	this.outputs[index].svg.fill(this.outputs[index].value ? '#0f0' : '#f00');
  	return this.outputs[index].value;
  }

  setIn(index, value) {
  	this.inputs[index].value = value;
  }
}

class INPUT extends Component {
  constructor() {
    super(0, 1);
  }
}

class OUTPUT extends Component {
  constructor() {
    super(1, 0);
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

// Compiler
function compile() {
	var compiledCode = [];

	// Create instances
	for (var idx = 0; idx < components.length; idx++) {
		var instanceName = '_c' + idx;
		var componentItem = components[idx];

		if (componentItem instanceof INPUT) {
			instanceName = 'in' + idx;
		} else if (componentItem instanceof OUTPUT) {
			instanceName = 'out' + idx;
		} else {
			compiledCode.push('var ' + instanceName + ' = new ' + componentItem.constructor.name + '();');
		}

		componentItem.instName = instanceName;
	}

	compiledCode.push('');

	// Connect wires
	for (var idx = 0; idx < wires.length; idx++) {
		var wireItem = wires[idx];
		var pinI = wireItem.I;
		var pinO = wireItem.O;

		var outCode = pinO.component.instName + '.getOut(' + pinO.ID + ')';

		if (pinO.component instanceof INPUT)
			outCode = pinO.component.instName;

		var inCode = pinI.component.instName + '.setIn(' + pinI.ID + ', ' + outCode + ')';

		if (pinI.component instanceof OUTPUT)
			inCode = pinI.component.instName + ' = ' + outCode;

		compiledCode.push( inCode + ';' );
	}

	console.log(compiledCode.join('\n'));
}

function compileWireboardAsComponent(componentName) {
	var compiledCode = [];

	compiledCode.push('class ' + componentName + '_Component extends Component {');

	// Create constructor
	compiledCode.push('\tconstructor() {');

	var inputPinCount = 0;
	var outputPinCount = 0;

	for (var idx = 0; idx < components.length; idx++) {
		var componentItem = components[idx];

		if (componentItem instanceof INPUT) {
			inputPinCount++
		} else if (componentItem instanceof OUTPUT) {
			outputPinCount++;
		}
	}
	compiledCode.push('\t\tsuper(' + inputPinCount + ', ' + outputPinCount + ');');

	compiledCode.push('\t}');

	// Create instances
	compiledCode.push('\tinit() {');

	var inputPinIndex = 0;
	var outputPinIndex = 0;

	for (var idx = 0; idx < components.length; idx++) {
		var componentItem = components[idx];
		var instanceName = '_' + componentItem.id;

		if (componentItem instanceof INPUT) {
			instanceName = 'this.inputs[' + inputPinIndex++ + '].value';
		} else if (componentItem instanceof OUTPUT) {
			instanceName = 'this.outputs[' + outputPinIndex++ + '].value';
		} else {
			compiledCode.push('\t\tthis.' + instanceName + ' = new ' + componentItem.constructor.name + '();');
		}

		componentItem.instName = instanceName;
	}

	compiledCode.push('\t}');

	// Connect wires
	compiledCode.push('\texecute() {');

	for (var idx = 0; idx < wires.length; idx++) {
		var wireItem = wires[idx];
		var pinI = wireItem.I;
		var pinO = wireItem.O;

		var outCode = 'this.' + pinO.component.instName + '.getOut(' + pinO.ID + ')';

		if (pinO.component instanceof INPUT)
			outCode = pinO.component.instName;

		var inCode = 'this.' + pinI.component.instName + '.setIn(' + pinI.ID + ', ' + outCode + ')';

		if (pinI.component instanceof OUTPUT)
			inCode = pinI.component.instName + ' = ' + outCode;

		compiledCode.push( '\t\t' + inCode + ';' );
	}

	compiledCode.push('\t}');

	compiledCode.push('}');

	return compiledCode.join('\n');
}

function createComponentFromWireboard(componentName) {
	var compiledCode = [];

	var componentCode = compileWireboardAsComponent(componentName);

	compiledCode.push(componentName + '_Component = (');
	compiledCode.push(componentCode);
	compiledCode.push(');');

	// Eval new component
	compiledCode.push('toolbox[\'' + componentName + '_Component\'] = ' + componentName + '_Component;');
	compiledCode.push('drawToolbox();initWireboard();components=[];wires=[];addComponent(\'' + componentName + '\');');
	var compiledCodeString = compiledCode.join('\n');
	console.log(compiledCodeString);
	eval(compiledCodeString);
}

// Project
var toolbox = { 'INPUT': INPUT, 'OUTPUT': OUTPUT, 'NOR_Component': NOR_Component };
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

function projectFromWireboard() {
	var project = {
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
		project.components.push(newComponent);
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
		project.wires.push(newWire);
	}

	return JSON.stringify(project);
}

function wireboardFromProject(projectJSON) {
	var project = JSON.parse(projectJSON);

	// Clear the wireboard
	initWireboard();
	components = [];
	wires = [];
	
	// Components
	for (var idx = 0; idx < project.components.length; idx++) {
		var componentItem = project.components[idx];

		var inst = new toolbox[componentItem.name]();
		inst.id = componentItem.id;
		inst.pinClicked = pinClicked;
		inst.svg.move(componentItem.x, componentItem.y);
		draw.add(inst.svg);
		components.push(inst);
	}

	// Wires
	for (var idx = 0; idx < project.wires.length; idx++) {
		var wireItem = project.wires[idx];

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

// Playground
addComponent('NOR_Component');
addComponent('NOR_Component');

cycIdx++;

function initWireboard() {
	draw.clear();

	// Draw grid
	for (x = 0; x < 128; x++)
		draw.line(x*8, 0, x*8, 1024).stroke({ opacity: 0.1, width: 1 });

	for (y = 0; y < 128; y++)
		draw.line(0, y*8, 1024, y*8).stroke({ opacity: 0.1, width: 1 });

	// Add wires to top level
	draw.add(links);
	draw.add(markers);
	draw.add(nodes);
}

// Simulation
setInterval(function() {
	for (var idx = 0; idx < components.length; idx++) {
		var componentItem = components[idx];

		if (componentItem instanceof INPUT) {
		} else if (componentItem instanceof OUTPUT) {
		} else {
			componentItem.getOut(0);
		}
	}
	cycIdx++;
}, 500);