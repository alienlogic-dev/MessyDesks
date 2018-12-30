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
		this.isSelected = false;

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
		this.svg.on('mousedown', this.mouseDownEvent, this);
		this.svg.on('mouseup', this.mouseUpEvent, this);
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
  	this.svgBody = this.svg.rect(wpx, hpx)
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
 				for (var idx in wire)
  				removeWire(wire[idx]);
  		}
  		else
  			if (this.component.pinClicked) this.component.pinClicked(this);
  }

  mouseDownEvent(e) { }
  mouseUpEvent(e) { }
  dblClickEvent(e) {
  	startComponentEdit(this);
  }

  /* Selection */
  select() {
  	this.svgBody.stroke({ color: '#0000ff', width: 2 });
  	this.isSelected = true;
  }
  deselect() {
  	this.svgBody.stroke({ color: '#666666', width: 2 });
  	this.isSelected = false;
	}

  /* Config */
  getConfig() { return null; }

  /* Runtime */
  execute() {}

  getOut(index) {
  	if (cycIdx > this.exeIdx) {
  		this.execute();
  		for (var i = 0; i < this.inputs.length; i++)
  			this.inputs[i].value = null;
  		this.exeIdx = cycIdx;
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

// initialize SVG.js
var wireboardWidth = 256;
var wireboardHeight = 256;
var draw = SVG('drawing').size(wireboardWidth*8, wireboardHeight*8);

var componentsSVG = new SVG.G();
var wiresSVG = new SVG.G();

// Selection
$(document).keydown(function(e) {
	//console.log(e.keyCode);
	if ((e.keyCode == 79) && e.metaKey) { // CMD/CTRL + O -> Open project
		$('#file').click();
		return false;
	}

	if ((e.keyCode == 83) && e.metaKey) { // CMD/CTRL + S -> Save project
		saveProjectToFile();
		return false;
	}

	if ((e.keyCode == 65) && e.metaKey) { // CMD/CTRL + A -> Select all
		for (var idx in components)
			components[idx].select();
		return false;
	}

	if (e.keyCode == 8) { // DEL -> Delete selected components
		for (var idx = components.length - 1; idx >= 0; idx--) {
			var componentItem = components[idx];

			if (componentItem.isSelected)
				removeComponent(componentItem);
		}
		return false;
	}
});

// GUI
draw.on('click', function(e) {
	var clickedComponent = null;

	if (!e.metaKey) // Use CMD or CTRL key for multiple selection
		for (var idx in components)
			components[idx].deselect();

	for (var idx in components) {
		if (pointInRect(e, components[idx].svg.rbox())) {
			clickedComponent = components[idx];

			if (!e.metaKey)
				clickedComponent.select();
			else
				if (clickedComponent.isSelected)
					clickedComponent.deselect();
				else
					clickedComponent.select();

			break;
		}
	}
});

function pointInRect(p, rect) {
	var inX = (p.x >= (rect.x2 - rect.w)) && (p.x <= rect.x2);
	var inY = (p.y >= (rect.y2 - rect.h)) && (p.y <= rect.y2);
	return inX && inY;
}

// Wireboard
initWireboard();
var myCodeMirror = CodeMirror.fromTextArea($('#siliconCodeArea')[0]);
$(myCodeMirror.getWrapperElement()).addClass('hide');

var components = [];
var componentsIdx = 0;
function addComponent(componentName) {
	var inst = new toolbox[componentName]();
	inst.id = 'c' + componentsIdx++;
	inst.pinClicked = pinClicked;
	inst.createSVG();
	inst.svg.move(200,200);
	componentsSVG.add(inst.svg);
	components.push(inst);

	drawSiliconbox();
}
function removeComponent(component) {
	removeWiresFromComponent(component);
	component.svg.remove();
	var idx = components.indexOf(component);
	components.splice(idx, 1);

	drawSiliconbox();
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
		var con = new WireConnection(pinSelected.svg, pin.svg, wiresSVG);

		pin.con = con;
		pinSelected.con = con;

		pinSelected = null;
	}
}
function removeWire(wire) {
	wire.O.con.remove();
	wire.I.con.remove();
	var idx = wires.indexOf(wire);
	wires.splice(idx, 1);
}
function removeWiresFromComponent(component) {
	for (var idx = wires.length - 1; idx >= 0; idx--) {
		var wireItem = wires[idx];
		if ((wireItem.I.component === component) || (wireItem.O.component === component))
			removeWire(wireItem);
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
		componentsSVG.add(inst.svg);
		components.push(inst);

		componentsIdx = Math.max(componentsIdx, +(componentItem.id.replace('c','')) + 1);
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
			var con = new WireConnection(pinI.svg, pinO.svg, wiresSVG);

			pinI.con = con;
			pinO.con = con;
		}
	}
}

var wireboardSourceStack = [];
var componentEditStack = [];
function startComponentEdit(component) {
	wireboardSourceStack.push(sourceFromWireboard());
  componentEditStack.push(component);

	if (component.constructor.source) {
		inSiliconMode = false;
	  wireboardFromSource(component.constructor.source);
		drawEditbox();
	} else {
		inSiliconMode = true;

	  // Clear the wireboard
		initWireboard();
		components = [];
		wires = [];

		drawEditbox();
		myCodeMirror.doc.setValue(component.constructor.toString());
	}
}
function cancelLastComponentEdit() {
	if (wireboardSourceStack.length > 0) {
		var lastSource = wireboardSourceStack[wireboardSourceStack.length - 1];
		wireboardFromSource(lastSource);

		wireboardSourceStack.splice(-1, 1);
		componentEditStack.splice(-1, 1);
	}
	else
		console.error('No editing pending!');

	drawEditbox();
}
function endLastComponentEdit() {
	if (wireboardSourceStack.length > 0) {
		if (inSiliconMode) {
			var ret = applyComponentSilicon(componentEditStack[componentEditStack.length - 1].constructor.name, myCodeMirror.doc.getValue());
			ret.source = null;
		} else
			newComponentFromWireboard(componentEditStack[componentEditStack.length - 1].constructor.name);

		var lastSource = wireboardSourceStack[wireboardSourceStack.length - 1];
		wireboardFromSource(lastSource);

		wireboardSourceStack.splice(-1, 1);
		componentEditStack.splice(-1, 1);
	}
	else
		console.error('No editing pending!');

	drawEditbox();
}

var inSiliconMode = false;
function switchToSilicon() {
	if ((inSiliconMode == false) && (components.length > 0))
		if (!confirm('Do you want to switch to Silicon code?\nWARNING: Cannot be undone.'))
			return;

	if (inSiliconMode)
		if (!confirm('Do you want to switch back to blocks?\nWARNING: All the logic will be lost.'))
			return;

	inSiliconMode = !inSiliconMode;
	drawSiliconbox();
	if (inSiliconMode) {
		var ret = newComponentFromWireboard(componentEditStack[componentEditStack.length - 1].constructor.name);
		myCodeMirror.doc.setValue(ret.toString());
	}
}

// Compiler
function compileSource(componentName, source) {
	var compiledCode = [];

	compiledCode.push(`class ${componentName} extends Component {`);

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
	compiledCode.push(`\t\tsuper(${JSON.stringify(inputAliases)}, ${JSON.stringify(outputAliases)});`);

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
			compiledCode.push(`\t\tthis.${instanceName} = new ${componentItem.name}(${JSON.stringify(componentItem.config)});`);
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
				var	outCode = `this.inputs[${aliases[componentO.id]}].value`;

				var inCode = `this.${aliases[pinI.component]}.setIn(${pinI.pin}, ${outCode})`;

				if (componentI.name == 'OUTPUT')
					inCode = `this.outputs[${aliases[componentI.id]}].value = ${outCode}`;

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
				var outCode = `this.${aliases[pinO.component]}.getOut(${pinO.pin})`;

				var inCode = `this.${aliases[pinI.component]}.setIn(${pinI.pin}, ${outCode})`;

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
				var outCode = `this.${aliases[pinO.component]}.getOut(${pinO.pin})`;

				if (componentO.name == 'INPUT')
					outCode = `this.inputs[${aliases[componentO.id]}].value`;

				var inCode = `this.outputs[${aliases[componentI.id]}].value = ${outCode}`;

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

	var ret = applyComponentSilicon(componentName, componentCode);

	// Add component source as static
	ret.source = componentSource;

	return ret;
}
function newComponentFromWireboard(componentName) {
	var ret = newComponentFromSource(componentName, sourceFromWireboard());

	initWireboard();
	components = [];
	wires = [];

	return ret;
}
function newEmptyComponent() {
	prompt({
	    title: 'Enter new component name',
	    value: 'empty'
	})
	.then((name) => {
		if ((name != null) && (name != ""))
			if (name in toolbox)
				alert('Component alredy exists!');
			else
				newComponentFromSource(name, {
					components: [],
					wires: []
				});
	})
	.catch(console.error);
}
function applyComponentSilicon(componentName, siliconCode) {
	var ret = eval(`${componentName} = (${siliconCode}); ${componentName}`);
	toolbox[componentName] = ret;
	drawToolbox();
	return ret;
}


// Project
var toolbox = { };

function saveProject() {
	var project = {
		toolbox: {},
		source: {}
	};

	// Source of toolbox components
	for (var idx in toolbox) {
		var toolboxItem = toolbox[idx];

		if (toolboxItem.source)
			project.toolbox[idx] = toolboxItem.source;
		else
			project.toolbox[idx] = { silicon: toolboxItem.toString() };
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
		if (toolboxItem.silicon)
			applyComponentSilicon(idx, toolboxItem.silicon);
		else
			newComponentFromSource(idx, toolboxItem);
	}

	wireboardFromSource(project.source);
}

function drawToolbox() {
	var toolboxDiv = $('#toolbox');
	toolboxDiv.html('');

	for (var idx in toolbox) {
		var toolboxItem = toolbox[idx];
		var newToolboxButton = `<li class="list-group-item p-2 text-right" onclick="addComponent('${idx}')">${idx.replace('_Component','')}</li>`;
		toolboxDiv.append(newToolboxButton);
	}
}
function drawEditbox() {
  if (componentEditStack.length > 0) $('#editbox').removeClass('hidden'); else $('#editbox').addClass('hidden');
  $('#editbox .breadcrumb').html('');
  for (var idx in componentEditStack)
  	$('#editbox .breadcrumb').append('<li class="breadcrumb-item">' + componentEditStack[idx].constructor.name.replace('_Component','') + '</li>');
  drawSiliconbox();
}
function drawSiliconbox() {
	if ((wireboardSourceStack.length > 0))
		$('#btnSwitchToSilicon').removeClass('hide');
	else
		$('#btnSwitchToSilicon').addClass('hide');

	if (inSiliconMode && (wireboardSourceStack.length > 0)){
		$(myCodeMirror.getWrapperElement()).removeClass('hide');
		$('#drawing').addClass('hide');
		$('#btnSwitchToSilicon').addClass('btn-dark');
	} else{
		$(myCodeMirror.getWrapperElement()).addClass('hide');
		$('#drawing').removeClass('hide');
		$('#btnSwitchToSilicon').removeClass('btn-dark');
	}
}


function saveProjectToFile() {
	//prompt('Enter project filename', 'project')
	//.then((filename) => {
	//	if ((filename != null) && (filename != ""))
	download(JSON.stringify(saveProject()), 'project.prj', 'text/plain');
	//});
}

function compile(lang) {
	var fr = function(){return ''};
	var cs = compileSource;
	if (lang == 'c++') {
		cs = cpp_compiler.compileSource;
		fr = cpp_compiler.framework;
	}

	var compiledCode = [];
	for (var idx in toolbox) {
		var toolboxItem = toolbox[idx];
		if (toolboxItem.source) {
			var toolboxCode = cs(idx, toolboxItem.source);
			compiledCode.push(toolboxCode);
		}
	}

	var wireboardCode = cs('MAIN', sourceFromWireboard());
	compiledCode.push(wireboardCode);

	var compiledCodeString = fr() + '\n\n' + compiledCode.join('\n');
	return {
		complete: compiledCodeString,
		framework: fr(),
		wireboard : compiledCode.join('\n')
	};
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

	var pattern = draw.pattern(8, 8, function(add) {
		add.line(8, 0, 8, 8).stroke('#ddd');
		add.line(0, 8, 8, 8).stroke('#ddd');
	})
	draw.rect(wireboardWidth*8, wireboardHeight*8).fill(pattern);

	// Clear wire drawings
	componentsSVG.clear();
	wiresSVG.clear();

	// Add wires to top level
	draw.add(componentsSVG);
	draw.add(wiresSVG);
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
}, 5);

setInterval(function() {
	for (var idx = 0; idx < components.length; idx++) {
		var componentItem = components[idx];

		if (componentItem.outputs.length == 0)
			componentItem.execute();

		if (componentItem instanceof INPUT) {
		} else if (componentItem instanceof OUTPUT) {
		} else {
			componentItem.update();
		}
	}
}, 250);