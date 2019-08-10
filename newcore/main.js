// initialize SVG.js
var wireboardWidth = 256;
var wireboardHeight = 256;
var draw = SVG('drawing').size(wireboardWidth*8, wireboardHeight*8);

var mainWireboard = new Wireboard('main', true);
var wireboardStack = [];

var toolbox = { };

function initWireboard() {
	draw.clear();

	var pattern = draw.pattern(8, 8, function(add) {
		add.line(8, 0, 8, 8).stroke('#ddd');
		add.line(0, 8, 8, 8).stroke('#ddd');
	})
	draw.rect(wireboardWidth*8, wireboardHeight*8).fill(pattern);

	// Clear wire drawings
	mainWireboard.clear();

	// Add wires to top level
	mainWireboard.addToParentSVG(draw);
}

function componentFromSource(src, forceName) {
	var wireboard = new Wireboard(forceName || '');
	wireboard.fromSource(src);
	componentFromWireboard(wireboard, forceName);
}

function componentFromWireboard(wireboard, forceName) {
	var componentName = forceName || wireboard.name;
	var siliconCode = wireboard.toSilicon();

	var ret = eval(`${componentName} = (${siliconCode}); ${componentName}`);
	toolbox[componentName] = ret;
	ret.source = wireboard.toSource();

	wireboard.clear();
	return ret;
}

function startComponentEdit(component) {
	console.log(component.constructor.source);
	wireboardStack.push(mainWireboard);
	mainWireboard = new Wireboard(component.constructor.name, true);
	mainWireboard.fromSource(component.constructor.source);
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

/* Real-Time Simulation */
var simInterval = 50;
var simEvent = function() {
	//simStep();
	setTimeout(simEvent, simInterval);
}
setTimeout(simEvent, simInterval);

setInterval(function() {
	mainWireboard.simulate();

	for (var idx = 0; idx < mainWireboard.components.length; idx++) {
		var componentItem = mainWireboard.components[idx];

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