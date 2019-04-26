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
	constructor(config = null) {
		this.id = '';
		this.isSelected = false;

		this.html = '';

		this.exeIdx = 0;
		this.instName = '';

		this.minWidth = 5;
		this.minHeight = 2;

		this.w = 0;
		this.wpx = 0;

		this.h = 0;
		this.hpx = 0;

		this.inputs = [];
		this.outputs = [];

		this.canRepeat = true;

		// Configurations
		this.config = config;
		if (!this.config)
			this.config = this.defaultConfig();
		
		// Init the component
		this.create();
	}

	/* Create default config */
	defaultConfig() { return null; }

	/* Create component */
	create(inputsList, outputsList, biList = 0) {
		// Create pins
		var inputIdx = this.inputs.length;
		var outputIdx = this.outputs.length;

		// Insert bidirectional pins
		if (biList instanceof Array)
			for (var i = 0; i < biList.length; i++) {
				var pinName = biList[i];
				this.inputs.push(new Pin(this, inputIdx++, pinName, true, true));
				this.outputs.push(new Pin(this, outputIdx++, pinName, false, true));
			}
		else
			for (var i = 0; i < biList; i++){
				this.inputs.push(new Pin(this, inputIdx++, '', true, true));
				this.outputs.push(new Pin(this, outputIdx++, '', false, true));
			}

		// Create list of inputs
		if (inputsList instanceof Array)
			this.inputs.length = inputsList.length;
		else
			this.inputs.length = +inputsList;

		for (var i = 0; i < this.inputs.length; i++) {
			if (!this.inputs[i]) {
				var pinName = '';
				if (inputsList instanceof Array)
					pinName = inputsList[i];
	
				if (pinName.length > 0)
					if (this[pinName] === undefined)
						this[pinName] = null;
	
				this.inputs[i] = new Pin(this, i, pinName, true);
			}
		}

		// Create list of outputs
		if (outputsList instanceof Array)
			this.outputs.length = outputsList.length;
		else
			this.outputs.length = +outputsList;

		for (var i = 0; i < this.outputs.length; i++) {
			if (!this.outputs[i]) {
				var pinName = '';
				if (outputsList instanceof Array)
					pinName = outputsList[i];
	
				if (pinName.length > 0)
					if (this[pinName] === undefined)
						this[pinName] = null;
	
				this.outputs[i] = new Pin(this, i, pinName, false);
			}
		}

		// Create main svg
		this.createSVG();
	}

	createSVG() {
		var minW = this.calculateMinWidth();

		this.w = Math.max(this.minWidth, minW);
		this.wpx = this.w * 8;

		this.h = Math.max(this.minHeight, Math.max(this.inputs.length * 2, this.outputs.length * 2));
		this.hpx = this.h * 8;

		if (!this.svg) {
			this.svg = new SVG.G();

			this.svg.on('mousedown', this.mouseDownEvent, this);
			this.svg.on('mouseup', this.mouseUpEvent, this);
			this.svg.on('dblclick', this.dblClickEvent, this);
	
			this.svg.draggable({snapToGrid: 8});
			this.svg.on('dragstart', this.dragstart, this);
			this.svg.on('dragend', this.dragend, this);
		} else
			this.svg.clear();

		this.drawBody(this.wpx, this.hpx);
		this.drawPins(this.wpx, this.hpx);

		this.symbolSVG = new SVG.G();
		this.drawSymbol(this.symbolSVG);

		this.symbolSVG.move((this.wpx / 2) - (this.symbolSVG.width() / 2), (this.hpx / 2) - (this.symbolSVG.height() / 2));
		this.svg.add(this.symbolSVG);
	}

	drawBody(wpx, hpx) {
		this.svgBody = this.svg.rect(wpx, hpx)
			.radius(2)
			.move(0, 0)
			.fill('#cccccc')
			.stroke({ color: '#666666', width: 2 });

		this.svgName = this.svg
			.text(this.constructor.name.replace('_Component',''))
			.font({
							family:	 'Menlo'
						, size:		 12
						, anchor:	 'middle'
						})
			.move(wpx / 2, -15);
	}

	calculateMinWidth() {
		var inMaxWidth = 0;
		for (var i = this.inputs.length - 1; i >= 0; i--) {
			var item = this.inputs[i];

			var textWidth = item.name.length * 5.25;

			if (textWidth > inMaxWidth) inMaxWidth = textWidth;
		}

		var outMaxWidth = 0;
		for (var i = this.outputs.length - 1; i >= 0; i--) {
			var item = this.outputs[i];

			var textWidth = item.name.length * 5.25;

			if (textWidth > outMaxWidth) outMaxWidth = textWidth;
		}

		return (inMaxWidth + outMaxWidth + 24) / 8;	
	}

	drawPins(wpx, hpx) {
		var inStepSize = hpx / this.inputs.length;
		for (var i = this.inputs.length - 1; i >= 0; i--) {
			var item = this.inputs[i];

			if (!item.svg) {
				item.svg = this.svg.rect(8, 8).radius(8);
				
				item.svg
					.on('click', this.pinClickedEvent, item)
					.on('contextmenu', this.pinRemoveWires, item);
			} else
				this.svg.add(item.svg);

			item.svg.move(-4, (inStepSize * i) + (inStepSize / 2) - 4)
				.addClass('pin')
				.fill('#ffcc00')
				.stroke({ color: '#000', width: 1 })
				.data('pin_id', item.ID);

			this.svg
				.text(item.name)
				.font({
								family:	 'Menlo'
							, size:		 9
							, anchor:	 'start'
							})
				.move(6, (inStepSize * i) + (inStepSize / 2) - 6);
		}

		var outStepSize = hpx / this.outputs.length;
		for (var i = this.outputs.length - 1; i >= 0; i--) {
			var item = this.outputs[i];

			if (!item.svg) {
				item.svg = this.svg.rect(8, 8).radius(8);
				
				item.svg
					.on('click', this.pinClickedEvent, item)
					.on('contextmenu', this.pinRemoveWires, item);
			} else
				this.svg.add(item.svg);

			item.svg.move(wpx - 4, (outStepSize * i) + (outStepSize / 2) - 4)
				.fill('#fff')
				.addClass('pin')
				.stroke({ color: '#000', width: 1 })
				.data('pin_id', item.ID);

			this.svg
				.text(item.name)
				.font({
								family:	 'Menlo'
							, size:		 9
							, anchor:	 'end'
							})
				.move(wpx - 6, (outStepSize * i) + (outStepSize / 2) - 6);
		}
	}

	drawSymbol(svg) { }

	updateSymbol() {
		this.symbolSVG.clear();
		this.drawSymbol(this.symbolSVG);
		this.symbolSVG.move((this.wpx / 2) - (this.symbolSVG.width() / 2), (this.hpx / 2) - (this.symbolSVG.height() / 2));
	}

	/* Configuration modal */
	createConfigModal() {
		if (this.config == null) return null;

		var formDiv = $('<div class="form-group m-0"></div>');

		var configItems = Object.keys(this.config);
		for (var idx in configItems) {
			var configItemName = configItems[idx];
			var configItemValue = this.config[configItemName];

			var rowDiv = $('<div class="row mb-2"></div>');

			var colNameDiv = $('<div class="col-2 text-right pt-1"><b></b></div>');
			colNameDiv.find('b').text(configItemName);

			var colValueDiv = $('<div class="col-10"></div>');
			var valueInput = $('<input type="text" class="form-control"/>');
			valueInput.attr('id', `ci_${configItemName}`);
			valueInput.val(configItemValue);
			colValueDiv.html(valueInput);

			rowDiv.append(colNameDiv);
			rowDiv.append(colValueDiv);

			formDiv.append(rowDiv);
		}

		return formDiv;
	}

	openConfig(configModalContent) {
		if (configModalContent) {
			$('#modalComponentOptions .modal-body').html(configModalContent);
			$('#modalComponentOptions').off('click', '.btnComponentOptionsApply');
			$('#modalComponentOptions').on('click', '.btnComponentOptionsApply', this, function(event) {
					var data = event.data;

					var userConfig = {};
					var configInputs = $('[id^=ci_]').toArray();
					for (var idx in configInputs) {
						var configInputElement = configInputs[idx];
						var configItemName = $(configInputElement).attr('id').replace('ci_','');
						var configItemValue = $(configInputElement).val();

						userConfig[configItemName] = configItemValue;
					}

					var ret = data.onVerifyConfig(userConfig);
					if (ret) {
						data.config = userConfig;
						data.create();
						data.onConfigChanged();
						$('#modalComponentOptions').modal('hide');
					}
			});
			$('#modalComponentOptions').modal('show');
		}
	}

	onVerifyConfig(config) { return true; }
	onConfigChanged() { return false; }

	/* Mouse */
	pinRemoveWires(e) {
		e.preventDefault();
		var wire = wires.filter(t => (t.I === this) || (t.O === this));
 		for (var idx in wire)
			removeWire(wire[idx]);
		return false;
	}
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
	mouseDblClickEvent(e) { }

	dblClickEvent(e) {
		if (e.altKey)
			startComponentEdit(this);
		else {
			var configModalContent = this.createConfigModal();
			if (configModalContent)
				this.openConfig(configModalContent);
			else
				if (!this.mouseDblClickEvent(e))
					startComponentEdit(this);
		}
	}

	dragstart(e) {
		this.old_x = this.svg.x();
		this.old_y = this.svg.y();
	}

	dragend(e) {
		if ((this.svg.x() != this.old_x) || (this.svg.y() != this.old_y))
			saveUndoState();
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

	/* Runtime */	
	marshallingInputs(index) {
		var ret = { };			

		for (var idx = 0; idx < this.inputs.length; idx++) {
			var pinName = this.inputs[idx].name;
			if (pinName != null) {
				if (pinName.length == 0) pinName = idx;

				if (index != null)
					ret[pinName] = this.inputs[idx].value[index];
				else
					ret[pinName] = this.inputs[idx].value;
			}
		}

		return ret;
	}

	marshallingOutputs(outputs, index) {
		for (var idx = 0; idx < this.outputs.length; idx++) {
			var pinName = this.outputs[idx].name;
			if (pinName != null) {
				if (pinName.length == 0) pinName = idx;
				if (outputs[pinName] !== undefined)
					if (outputs[pinName] !== null) {
						if (index != null) {
							if (this.outputs[idx].value == null)
								this.outputs[idx].value = [];

							this.outputs[idx].value[index] = outputs[pinName];
						} else
							this.outputs[idx].value = outputs[pinName];
					}
			}
		}
	}

	repeatRequired() {
		if (this.inputs.length == 0) return false;

		for (var idx = 0; idx < this.inputs.length; idx++) {
			var pinValue = this.inputs[idx].value;
			if (!(pinValue instanceof Array))
				return false;
		}

		return true;
	}

	countRepeats() {
		var ret = Number.MAX_SAFE_INTEGER;

		for (var idx = 0; idx < this.inputs.length; idx++) {
			var pinValue = this.inputs[idx].value;
			if (pinValue instanceof Array)
				if (pinValue.length < ret)
					ret = pinValue.length;
		}
		
		return ret;
	}

	init(inputs, outputs) {}
	execute(inputs, outputs) {}
	run() {
		if (cycIdx > this.exeIdx) {
			var needRepeat = this.canRepeat && this.repeatRequired();

			var outputs = { };
			for (var idx = 0; idx < this.outputs.length; idx++) {
				var pinName = this.outputs[idx].name;
				if (pinName != null) {
					if (pinName.length == 0) pinName = idx;
					outputs[pinName] = this.outputs[idx].value;
				}
			}

			if (this.exeIdx == 0) {
				var inputs = this.marshallingInputs();
				this.init(inputs, outputs);
				this.marshallingOutputs(outputs);
			}

			if (needRepeat) {
				var times = this.countRepeats();

				for (var idx = 0; idx < this.outputs.length; idx++)
					this.outputs[idx].value = [];

				for (var i = 0; i < times; i++) {
					var inputs = this.marshallingInputs(i);
					this.execute(inputs, outputs);
					this.marshallingOutputs(outputs, i);
				}
			} else {
				var inputs = this.marshallingInputs();
				this.execute(inputs, outputs);
				this.marshallingOutputs(outputs);				
			}

			this.guiInputs = this.inputs.map(t => t.value).splice(0);
			for (var i = 0; i < this.inputs.length; i++)
				this.inputs[i].value = null;

			this.exeIdx = cycIdx;
			return true;
		}
		return false;
	}

	getOut(index) {
		if (index !== undefined)
			return this.outputs[index].value;
	}

	setIn(index, value) {
		if (value != null)
			this.inputs[index].value = value;
	}

	/* Refresh */	
	draw() {}

	refresh() {
		for (var idx in this.guiInputs) {
			this.inputs[idx].svg.fill((this.guiInputs[idx] == null) ? '#fc0' : (+this.guiInputs[idx] ? '#0c0' : '#c00'));
			this.inputs[idx].svg.radius(this.guiInputs[idx] instanceof Array ? 0 : 8);
		}


		for (var idx = 0; idx < this.outputs.length; idx++) {
			this.outputs[idx].svg.fill((this.outputs[idx].value == null) ? '#fff' : (+this.outputs[idx].value ? '#0c0' : '#c00'));
			this.outputs[idx].svg.radius(this.outputs[idx].value instanceof Array ? 0 : 8);
		}
	
		this.draw();
	}
}
Component.group = 'General';

// initialize SVG.js
var wireboardWidth = 256;
var wireboardHeight = 256;
var draw = SVG('drawing').size(wireboardWidth*8, wireboardHeight*8);

setTimeout(function() {
	window.scrollTo( ($(document).width()-$(window).width())/2, ($(document).height()-$(window).height())/2);
}, 100);

var componentsSVG = new SVG.G();
var wiresSVG = new SVG.G();

// Selection
var mousePosition = {x:0, y:0};
$(document).bind('mousemove',function(mouseMoveEvent){
	mousePosition.x = mouseMoveEvent.pageX;
	mousePosition.y = mouseMoveEvent.pageY;
});

$(document).keydown(function(e) {
	if (!($('#modalComponentOptions').data('bs.modal') || {})._isShown) {
		//console.log(e.keyCode, e.metaKey, e.shiftKey, e.altKey);
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

		if ((e.keyCode == 68) && e.metaKey) { // CMD/CTRL + D -> Duplicate component
			var selectedComponent = null;
			for (var idx = components.length - 1; idx >= 0; idx--) {
				var componentItem = components[idx];

				if (componentItem.isSelected) {
					selectedComponent = componentItem;
					break;
				}
			}

			if (selectedComponent) {
				var ret = addComponent(selectedComponent.constructor.name, selectedComponent.config);
				ret.svg.move(Math.round((document.querySelector('.workbox').scrollLeft + mousePosition.x - 150) / 8) * 8, Math.round((document.querySelector('.workbox').scrollTop + mousePosition.y) / 8) * 8);
			}

			return false;
		}

		if ((e.keyCode == 90) && e.metaKey && !e.shiftKey) { // CMD/CTRL + Z -> Undo
			undo();
			return false;
		}

		if ((e.keyCode == 90) && e.metaKey && e.shiftKey) { // CMD/CTRL + SHIFT + Z -> Redo
			redo();
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

var components = [];
var componentsIdx = 0;
function addComponent(componentName, config = null) {
	var inst = new toolbox[componentName](config);
	inst.id = 'c' + componentsIdx++;
	inst.pinClicked = pinClicked;
	inst.createSVG();
	inst.svg.move(Math.round(document.documentElement.scrollLeft / 8) * 8 + 200, Math.round(document.documentElement.scrollTop / 8) * 8 + 200);
	componentsSVG.add(inst.svg);
	components.push(inst);

	saveUndoState();
	updateSimOrderFromWireboard();

	drawSiliconbox();

	return inst;
}
function removeComponent(component) {
	removeWiresFromComponent(component);
	component.svg.remove();
	var idx = components.indexOf(component);
	components.splice(idx, 1);

	saveUndoState();
	updateSimOrderFromWireboard();
	
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

		var newWire = null;

		if (pin.isBidirectional && pinSelected.isBidirectional) {
			newWire = { I: pin, O: pinSelected };
			wires.push(newWire);

			newWire = { I: pinSelected, O: pin };
			wires.push({ I: pinSelected, O: pin });
		} else {
			if (pin.isInput == pinSelected.isInput) {
				alert('Connection allowed only for input and output');
				pinSelected = null;
				return;
			}

			newWire = { I: (pin.isInput) ? pin : pinSelected, O: (pin.isInput) ? pinSelected : pin };
			wires.push(newWire);
		}

		if (newWire) {
			var con = new WireConnection(pinSelected.svg, pin.svg, wiresSVG);
			newWire.con = con;
			
			saveUndoState();
			updateSimOrderFromWireboard();
		}

		pinSelected = null;
	}
}
function removeWire(wire) {
	wire.con.remove();
	var idx = wires.indexOf(wire);
	wires.splice(idx, 1);

	updateSimOrderFromWireboard();
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
			x: componentItem.svg.x(),
			y: componentItem.svg.y()
		};
		if (componentItem.config)
			newComponent.config = componentItem.config;
		
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
	for (var idx in source.components) {
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

			var newWire = {
				I: pinI,
				O: pinO
			};
			wires.push(newWire);

			var con = new WireConnection(pinI.svg, pinO.svg, wiresSVG);
			newWire.con = con;
		}
	}

	// Simulation
	updateSimOrderFromSource(source);
}

var editorCodes = {};
var selectedEditorCode = 'silicon';
function startEditorCode() {
	selectedEditorCode = 'silicon';
	myCodeMirror.doc.setValue(editorCodes[selectedEditorCode]);
	selectEditorCode(selectedEditorCode);
}
function selectEditorCode(lang) {
	editorCodes[selectedEditorCode] = myCodeMirror.doc.getValue(); // Save changes to selected old editor
	
	selectedEditorCode = lang;
	if (!editorCodes[selectedEditorCode])
		editorCodes[selectedEditorCode] = '';
	myCodeMirror.doc.setValue(editorCodes[selectedEditorCode]); // Select the new editor

	// Change button text
	$('#btnSwitchCode > button').text(lang);
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

		editorCodes['silicon'] = component.constructor.toString();
		for (var idx in availableCompilers)
			editorCodes[idx] = component.constructor[idx];
		startEditorCode();
	}

	clearUndoStack();
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

	selectEditorCode('silicon');
	inSiliconMode = false; // Impossible to end a component edit into another silicon code component
	drawEditbox();

	clearUndoStack();
}
function endLastComponentEdit() {
	if (wireboardSourceStack.length > 0) {
		if (inSiliconMode) {
			selectEditorCode('silicon'); // Apply editor changes

			var ret = applyComponentSilicon(componentEditStack[componentEditStack.length - 1].constructor.name, editorCodes['silicon']);
			for (var idx in availableCompilers)
				if (editorCodes[idx])
					ret[idx] = editorCodes[idx];

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

	inSiliconMode = false; // Impossible to end a component edit into another silicon code component
	drawEditbox();

	clearUndoStack();
}

var inSiliconMode = false;
function switchToSilicon() {
	if (!confirm('Do you want to switch to Silicon code?\nWARNING: Cannot be undone.'))
		return;

	inSiliconMode = true;
	drawSiliconbox();

	var ret = newComponentFromWireboard(componentEditStack[componentEditStack.length - 1].constructor.name);
	editorCodes['silicon'] = ret.toString();
	for (var idx in availableCompilers)
		editorCodes[idx] = crossCompileSource(idx, componentEditStack[componentEditStack.length - 1].constructor.name, ret.source);
	startEditorCode();
}


// Compiler
function compileSource(componentName, source) {
	var compiledCode = [];

	compiledCode.push(`class ${componentName} extends Component {`);

	// Settings
	compiledCode.push('\tsettings() {');
	compiledCode.push('\t\treturn [');
	compiledCode.push('\t\t\t// [ Description, Variable name, Default value ],');
	compiledCode.push('\t\t];');
	compiledCode.push('\t}');

	// Creator
	compiledCode.push('\tcreate() {');

	// Count inputs and outputs
	var inputPinCount = 0;
	var inputAliases = [];
	var outputPinCount = 0;
	var outputAliases = [];
	for (var idx in source.components) {
		var componentItem = source.components[idx];

		if (componentItem.name == 'INPUT') {
			if (componentItem.config) inputAliases.push(componentItem.config.alias); else inputAliases.push('');
			inputPinCount++
		} else if (componentItem.name == 'OUTPUT') {
			if (componentItem.config) outputAliases.push(componentItem.config.alias); else outputAliases.push('');
			outputPinCount++;
		}
	}

	compiledCode.push(`\t\tsuper.create(${JSON.stringify(inputAliases)}, ${JSON.stringify(outputAliases)});`);

	// Create instances
	var aliases = {};

	var inputPinIndex = 0;
	var outputPinIndex = 0;
	for (var idx in source.components) {
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

	// Initiliazer
	compiledCode.push('\tinit(inputs, outputs) {');
	compiledCode.push('\t}');

	// Connect wires
	compiledCode.push('\texecute(inputs, outputs) {');

	var order = generateExecutionOrderFromSource(source);

	for (var idx in order) {
		var orderItem = order[idx];

		var componentOutputWires = source.wires.filter(t => t.O.component == orderItem.id);

		if ((orderItem.name != 'INPUT') && (orderItem.name != 'OUTPUT'))
			compiledCode.push( `\t\tthis.${aliases[orderItem.id]}.run();` );		

		for (var wIdx in componentOutputWires) {
			var wireItem = componentOutputWires[wIdx];
			if (wireItem) {
				var pinI = wireItem.I;
				var componentI = source.components.filter(t => t.id == pinI.component)[0];

				var pinO = wireItem.O;
				var componentO = source.components.filter(t => t.id == pinO.component)[0];

				var outCode = `this.${aliases[pinO.component]}.getOut(${pinO.pin})`;
				if (componentO.name == 'INPUT')
					if (componentO.config.alias.length > 0)
						outCode = `inputs.${componentO.config.alias}`;
					else
						outCode = `inputs[${aliases[componentO.id]}]`;

				var inCode = `this.${aliases[pinI.component]}.setIn(${pinI.pin}, ${outCode})`;
				if (componentI.name == 'OUTPUT')
					if (componentI.config.alias.length > 0)
						inCode = `outputs.${componentI.config.alias} = ${outCode}`;
					else
						inCode = `outputs[${aliases[componentI.id]}] = ${outCode}`;

				compiledCode.push( '\t\t' + inCode + ';' );		
			}
		}
	}

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
	var name = $('#newComponentName').val();

	if ((name != null) && (name != ""))
		if (name in toolbox)
			alert('Component alredy exists!');
		else {
			$('#modalNewComponent').modal('hide');
			newComponentFromSource(name, {
				components: [],
				wires: []
			});

			var inst = new toolbox[name]();
			startComponentEdit(inst);
		}
}
function applyComponentSilicon(componentName, siliconCode) {
	var ret = eval(`${componentName} = (${siliconCode}); ${componentName}`);
	toolbox[componentName] = ret;
	drawGroupedToolbox();
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
		var toolboxItem_original = toolbox_original[idx];

		if (toolboxItem !== toolboxItem_original) {
			if (toolboxItem.source)
				project.toolbox[idx] = toolboxItem.source;
			else {
				var codes = {};
				for (var codeIdx in availableCompilers)
					codes[codeIdx] = toolboxItem[codeIdx];
				project.toolbox[idx] = { silicon: toolboxItem.toString(), codes: codes };
			}
		} 
	}

	// Source from wireboard
	project.source = sourceFromWireboard();

	return project;
}

function loadProject(project) {
	loadToolboxFromProject(project);

	wireboardFromSource(project.source);
}
function loadProjectAsComponent(componentName, project) {
	loadToolboxFromProject(project);

	newComponentFromSource(componentName, project.source);
}

function loadToolboxFromProject(project) {
	// Load the toolbox
	for (var idx in project.toolbox) {
		var toolboxItem = project.toolbox[idx];
		
		var ret = null;
		if (toolboxItem.silicon)
			ret = applyComponentSilicon(idx, toolboxItem.silicon);
		else
			ret = newComponentFromSource(idx, toolboxItem);

		for (var codeIdx in toolboxItem.codes)
			ret[codeIdx] = toolboxItem.codes[codeIdx];
	}
}

// Toolbox
var toolbox_grouped = {};
function groupToolbox() {
	toolbox_grouped = {};
  for (var idx in toolbox) {
    var toolboxItem = toolbox[idx];

    if (!toolbox_grouped[toolboxItem.group])
      toolbox_grouped[toolboxItem.group] = { expanded: false, items: [] };

    toolbox_grouped[toolboxItem.group].items.push( idx );
  }
}
function drawGroupedToolbox() {
	groupToolbox();
	updateGroupedToolbox();
}
function updateGroupedToolbox() {
	var toolboxDiv = $('#toolbox');
	toolboxDiv.html('');
	for (var idx in toolbox_grouped) {
		var toolboxGroup = toolbox_grouped[idx];
		var newToolboxGroupButton = `<li class="list-group-item p-2 text-right list-group-item-dark" onclick="toggleExpandToolboxGroup('${idx}')"><i class="fas fa-caret-right float-left"></i> ${idx} <span class="badge badge-pill badge-secondary">${toolboxGroup.items.length}</span></li>`;
		toolboxDiv.append(newToolboxGroupButton);

		if (toolboxGroup.expanded) {
			for (var gIdx in toolboxGroup.items) {
				var toolboxItem = toolboxGroup.items[gIdx];
				var newToolboxButton = `<li class="list-group-item p-2 text-right" onclick="addComponent('${toolboxItem}')">${toolboxItem.replace('_Component','')}</li>`;
				toolboxDiv.append(newToolboxButton);
			}
		}
	}
}
function toggleExpandToolboxGroup(group) {
	var toolboxGroup = toolbox_grouped[group];
	if (toolboxGroup) {
		toolboxGroup.expanded = !toolboxGroup.expanded;
		updateGroupedToolbox();
	}
}

// GUI
function drawEditbox() {
	if (componentEditStack.length > 0) {
		$('#editbox').removeClass('hidden');
		$('#btnSaveProject, #btnOpenProject, #btnSwitchCompiler, #btnCompileBoard').addClass('hide');
	} else {
		$('#editbox').addClass('hidden');
		$('#btnSaveProject, #btnOpenProject, #btnSwitchCompiler, #btnCompileBoard').removeClass('hide');
	}

	$('#editbox .breadcrumb').html('');
	for (var idx in componentEditStack)
		$('#editbox .breadcrumb').append('<li class="breadcrumb-item">' + componentEditStack[idx].constructor.name.replace('_Component','') + '</li>');
	
	drawSiliconbox();
}
function drawSiliconbox() {
	$('#btnSwitchCode > .dropdown-menu').html(`<button class="dropdown-item" type="button" onclick="selectEditorCode('silicon')">Silicon</button>`);
	for (var idx in availableCompilers)
		$('#btnSwitchCode > .dropdown-menu').append(`<button class="dropdown-item" type="button" onclick="selectEditorCode('${idx}')">${idx}</button>`);

	if (wireboardSourceStack.length > 0) {
		if (inSiliconMode){
			$(myCodeMirror.getWrapperElement()).removeClass('hide');
			$('#drawing').addClass('hide');
			$('#btnSwitchToSilicon, #btnNewComponent').addClass('hide');
			$('#btnSwitchCode').removeClass('hide');
		} else{
			$(myCodeMirror.getWrapperElement()).addClass('hide');
			$('#drawing').removeClass('hide');
			$('#btnSwitchToSilicon, #btnNewComponent').removeClass('hide');
			$('#btnSwitchCode').addClass('hide');
		}
	} else {
		$(myCodeMirror.getWrapperElement()).addClass('hide');
		$('#drawing, #btnNewComponent').removeClass('hide');
		$('#btnSwitchToSilicon').addClass('hide');
		$('#btnSwitchCode').addClass('hide');
	}
}

function saveProjectToFile() {
	var filename = prompt('Enter project filename', 'project');
	if ((filename != null) && (filename != ""))
		download(JSON.stringify(saveProject()), filename + '.prj', 'text/plain');
}

// Undo / Redo
var undoStack = [];
var undoStackPtr = 0;

clearUndoStack();

function clearUndoStack() {
	undoStack = [ saveProject() ];
	undoStackPtr = 0;
	$('#btnUndo').attr('disabled', '');
	$('#btnRedo').attr('disabled', '');
}

function saveUndoState() {
	if (undoStackPtr < 20) {
		undoStackPtr++;
		undoStack[undoStackPtr] = saveProject();
	} else {
		undoStack.shift();
		undoStack.push(saveProject());
	}

	$('#btnUndo').removeAttr('disabled');
	$('#btnRedo').attr('disabled', '');
}

function undo() {
	if (undoStackPtr > 0) {
		undoStackPtr--;
		loadProject(undoStack[undoStackPtr]);

		$('#btnRedo').removeAttr('disabled');
		if (undoStackPtr <= 0)
			$('#btnUndo').attr('disabled', '');
	}
}

function redo() {
	if (undoStackPtr < undoStack.length - 1) {
		undoStackPtr++;
		loadProject(undoStack[undoStackPtr]);

		$('#btnUndo').removeAttr('disabled');
		if (undoStackPtr >= undoStack.length - 1)
			$('#btnRedo').attr('disabled', '');
	}
}

/* Cross compile in other languages */
var availableCompilers = {};
var selectedCompiler = '';

function signNewCompiler(name, compilerClass) {
	availableCompilers[name] = compilerClass;

	$('#btnSwitchCompiler > .dropdown-menu').html('');
	for (var idx in availableCompilers)
		$('#btnSwitchCompiler > .dropdown-menu').append(`<button class="dropdown-item" type="button" onclick="selectCompiler('${idx}')">${idx}</button>`);

	selectCompiler(name);
}

function crossCompileSource(lang, componentName, source) {
	if (availableCompilers[lang]) {
		var cs = availableCompilers[lang].compileSource;
		return cs(componentName, source);;
	}
	return null;
}

function crossCompile(lang) {
	if (availableCompilers[lang]) {
		var fr = availableCompilers[lang].framework;

		var compiledCode = [];
		for (var idx in toolbox) {
			var toolboxItem = toolbox[idx];
			if (toolboxItem.source) {
				var toolboxCode = crossCompileSource(lang, idx, toolboxItem.source);
				compiledCode.push(toolboxCode);
			} else {
				if (toolboxItem[lang])
					compiledCode.push(toolboxItem[lang]);
			}
		}

		var wireboardCode = crossCompileSource(lang, 'MAIN_Component', sourceFromWireboard());
		compiledCode.push(wireboardCode);

		var compiledCodeString = fr() + '\n\n' + compiledCode.join('\n');
		return {
			complete: compiledCodeString,
			framework: fr(),
			wireboard: compiledCode.join('\n')
		};
	}
	return null;
}

function selectCompiler(lang) {
	$('#btnSwitchCompiler > button').text(lang);
	selectedCompiler = lang;
}


// Simulation
var simOrder = [];

function updateSimOrderFromWireboard() {
	var source = sourceFromWireboard();
	updateSimOrderFromSource(source);
}

function updateSimOrderFromSource(source) {
	simOrder = generateExecutionOrderFromSource(source);
}

function simStep() {
	cycIdx++;

	for (var idx = 0; idx < simOrder.length; idx++) {
		var orderItem = simOrder[idx];

		var componentItem = components.filter(t => t.id == orderItem.id)[0];
		if (componentItem) {
			var ret = componentItem.run();

			if (ret) {
				var componentOutputWires = wires.filter(t => t.O.component === componentItem);
				for (var wIdx in componentOutputWires) {
					var wireItem = componentOutputWires[wIdx];
					if (wireItem) {
						var pinI = wireItem.I;
						var pinO = wireItem.O;
						pinI.component.setIn(pinI.ID, pinO.component.getOut(pinO.ID));
					}
				}
			}			
		}
	}
}

function generateExecutionOrderFromSource(source) {
	var executionOrder = [];

	var componentsChildrens = generateChildrensOfSourceComponents(source);

	var aloneComponents = getAloneComponentsFromSource(source);
	for (var idx in aloneComponents) {
		var componentItem = aloneComponents[idx];

		executionOrder.push(componentItem);
		executionOrder = generateOrderFromSourceComponent(componentsChildrens, componentItem, executionOrder);
	}

	return executionOrder.reverse();
}

function generateChildrensOfSourceComponents(source) {
	var globalChildrens = {};

	for (var idx in source.components) {
		var componentItem = source.components[idx];
		var inputWires = source.wires.filter(t => (t.I.component == componentItem.id));
		if (inputWires.length > 0) {
			var childrens = {};
			for (var wIdx in inputWires) {
				var pinOComponent = inputWires[wIdx].O.component;
				if (!childrens[pinOComponent] && (pinOComponent != componentItem.id))
					childrens[pinOComponent] = source.components.filter(t => t.id == pinOComponent)[0];
			}
			globalChildrens[componentItem.id] = childrens;
		}			
	}

	return globalChildrens;
}

function generateOrderFromSourceComponent(childrens, component, order, callStack) {
	if (!order) order = [];

	if (!callStack) callStack = [];
	callStack.push(component);

	var componentChildrens = childrens[component.id];

	for (var cIdx in componentChildrens) {
		var componentItem = componentChildrens[cIdx];
		if (componentItem) {
			if (!callStack.includes(componentItem)) {
				if (order.includes(componentItem)) {
					var fIdx = order.indexOf(componentItem);
					order.splice(fIdx, 1);
				}
				order.push(componentItem);
				generateOrderFromSourceComponent(childrens, componentItem, order, callStack);
			}
		}
	}

	callStack.pop();

	return order;
}

function getAloneComponentsFromSource(source) {
	var aloneComponents = [];

	for (var idx in source.components) {
		var componentItem = source.components[idx];
		var wire = source.wires.filter(t => (t.O.component == componentItem.id));
		if (wire.length == 0)
			aloneComponents.push(componentItem);
	}

	return aloneComponents;
}

function htmlSimStep() {
	simStep();
	for (var idx = 0; idx < components.length; idx++) {
		var componentItem = components[idx];

		if (componentItem instanceof INPUT) {
		} else if (componentItem instanceof OUTPUT) {
		} else {
			componentItem.refresh();
		}
	}
}

function htmlSimStepDelayed() {
	setTimeout(htmlSimStep, 10);
}

$(document).on('keydown', htmlSimStepDelayed);
$(document).on('keyup', htmlSimStepDelayed);
$(document).on('mousedown', htmlSimStepDelayed);
$(document).on('mouseup', htmlSimStepDelayed);

/*
var simInterval = 50;
var simEvent = function() {
	simStep();
	setTimeout(simEvent, simInterval);
}
setTimeout(simEvent, simInterval);

setInterval(function() {
	for (var idx = 0; idx < components.length; idx++) {
		var componentItem = components[idx];

		if (componentItem instanceof INPUT) {
		} else if (componentItem instanceof OUTPUT) {
		} else {
			componentItem.refresh();
		}
	}
}, 250);
*/

// Function to read data from a file
var openFile = function(event) {
	var input = event.target;

	var reader = new FileReader();
	reader.onload = function(){
		var text = reader.result;
		loadProject(JSON.parse(text));
	};
	reader.readAsText(input.files[0]);
};

// Function to read data from a file
function manageImportProjectCheckboxes() {
	if ($('#chkSingleToolbox').prop('checked')) {
		$('#txtImportProject').attr('disabled', '');
		$('#setSingleToolbox').removeAttr('disabled');
	} else {
		$('#txtImportProject').removeAttr('disabled');
		$('#setSingleToolbox').attr('disabled', '');
	}
}
$('#chkEntireProject').on('click', function(e) {
	manageImportProjectCheckboxes();
});
$('#chkSingleToolbox').on('click', function(e) {
	manageImportProjectCheckboxes();
});

var pendingImportProject = null;

function confirmOpenAsLib(project) {
	var importEntireProject = !$('#chkSingleToolbox').prop('checked');

	if (importEntireProject) {
		var componentName = $('#txtImportProject').val();
		if (componentName.length == 0)
			alert('Component name cannot be empty!');
		else
			if (componentName in toolbox)
				alert('Component alredy exists!');
			else {
				loadProjectAsComponent(componentName, pendingImportProject);
				$('#modalImportProject').modal('hide');
			}
	} else {
		for (var idx in pendingImportProject.toolbox)
			if ($(`#chkLbl${idx}`).prop('checked'))
				newComponentFromSource(idx, pendingImportProject.toolbox[idx]);

		$('#modalImportProject').modal('hide');
	}
}

var openAsLib = function(event) {
	var input = event.target;

	var reader = new FileReader();
	reader.onload = function(){
		var text = reader.result;
		pendingImportProject = JSON.parse(text);

    $('#setSingleToolbox').html('');
		for (var idx in pendingImportProject.toolbox) {
			var newItem = `
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" value="" id="chkLbl${idx}"" checked>
                  <label class="form-check-label" for="chkLbl${idx}">
                    ${idx}
                  </label>
                </div>
                `;
      $('#setSingleToolbox').append(newItem);
		}

		$('#modalImportProject').modal('show');
	};
	reader.readAsText(input.files[0]);
};
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

// Focus on first input element into component options modal
$('#modalComponentOptions').on('shown.bs.modal', function () {
	$('#modalComponentOptions input').first().trigger('focus')
})
/*
// Ask before leaving the page
$(window).bind('beforeunload', function(){
  return 'Are you sure you want to leave?';
});
*/