// initialize SVG.js
var wireboardWidth = 256;
var wireboardHeight = 256;
var draw = SVG('drawing').size(wireboardWidth*8, wireboardHeight*8);

var componentsSVG = new SVG.G();
var wiresSVG = new SVG.G();

var toolbox = { };

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

var siliconEditor = null;
$(window).on('load', function() {
	siliconEditor = monaco.editor.create(document.getElementById('siliconCodeArea'), {
		value: [
			'function x() {',
			'\tconsole.log("Hello world!");',
			'}'
		].join('\n'),
		language: 'javascript',
		automaticLayout: true
	});
});

initWireboard();

setTimeout(function() {
	window.scrollTo( ($(document).width()-$(window).width())/2, ($(document).height()-$(window).height())/2);
}, 100);

/* Components */
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
}

/* Wiring */
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

    var wire = pinSelected.connectToPin(pin);

    if (wire) {
      if (!wires.includes(wire))
        wires.push(wire);

      var con = new WireConnection(pinSelected.svg, pin.svg, wiresSVG);
    }

		pinSelected = null;
	}
}

/* Source manager */
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

    var newWire = new Wire();

    var _firstPin = null;
    for (var c of wireItem) {
		  var componentRef = components.filter(t => t.id == c.cid)[0];
      var componentPin = componentRef.getPin(c.pn);
      componentPin.connectToWire(newWire);

      if (_firstPin) {
        var con = new WireConnection(_firstPin.svg, componentPin.svg, wiresSVG);
      } else
        _firstPin = componentPin;
    }

    this.wires.push(newWire);
	}
}

/* Real-Time Simulation */
var simInterval = 50;
var simEvent = function() {
	//simStep();
	setTimeout(simEvent, simInterval);
}
setTimeout(simEvent, simInterval);

setInterval(function() {
	for (var idx = 0; idx < components.length; idx++) {
		var componentItem = components[idx];

			componentItem.refresh();
/*
		if (componentItem instanceof INPUT) {
		} else if (componentItem instanceof OUTPUT) {
		} else {
			componentItem.refresh();
		}
*/
	}
}, 250);