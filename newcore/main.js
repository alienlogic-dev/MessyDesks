// initialize SVG.js
var wireboardWidth = 256;
var wireboardHeight = 256;
var draw = SVG('drawing').size(wireboardWidth*8, wireboardHeight*8);

var mainWireboard = new Wireboard('main', true);
var wireboardStack = [];

var toolboxChangeTimer = null;
const toolboxChangeWatcher = {
	set(target, property, value) {
		target[property] = value;

		if (toolboxChangeTimer) clearTimeout(toolboxChangeTimer);
		toolboxChangeTimer = setTimeout(function() { updateToolboxBar() }, 250);

    return true;
	}
}

var toolbox = new Proxy({}, toolboxChangeWatcher);

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

/* Toolbox */
function addComponentFromToolbox(componentName) {
	mainWireboard.addComponent(componentName);
}

function updateToolboxBar() {
	var toolboxDiv = $('#toolbox');
	toolboxDiv.html('');

	for (var t in toolbox) {
		var newToolboxButton = `<li class="list-group-item p-2 text-right" onclick="addComponentFromToolbox('${t}')">${t}</li>`;
		toolboxDiv.append(newToolboxButton);
	}
}

/* Editor */
function drawEditbox() {
	if (wireboardStack.length > 0) {
		$('#editbox').removeClass('hidden');
		$('#btnSaveProject, #btnOpenProject, #btnSwitchCompiler, #btnCompileBoard').addClass('hide');
	} else {
		$('#editbox').addClass('hidden');
		$('#btnSaveProject, #btnOpenProject, #btnSwitchCompiler, #btnCompileBoard').removeClass('hide');
	}

	$('#editbox .breadcrumb').html('');
	for (var idx in wireboardStack)
		$('#editbox .breadcrumb').append('<li class="breadcrumb-item">' + wireboardStack[idx].name + '</li>');
	
//	drawSiliconbox();
}

function cancelLastComponentEdit() {
	endComponentEdit(true);
}

function endLastComponentEdit() {
	endComponentEdit(false);
}

function startComponentEdit(component) {
	wireboardStack.push(mainWireboard);
	mainWireboard.removeFromParentSVG();

	var newWireboard = new Wireboard(component.constructor.name, true);
	newWireboard.fromSource(component.constructor.source);
	newWireboard.addToParentSVG(draw);

	var tc = new Component()
	tc.init();
	tc.initGUI();
	tc.createSVG();
	tc.pinClicked = null;

	var tck = Object.keys(tc);

	var destWireboard = newWireboard.components.reduce(function(map, obj) {
			map[obj.id] = obj;
			return map;
	}, {});

	spyComponent(tck, component, destWireboard);
	simStep(newWireboard);

	mainWireboard = newWireboard;

	drawEditbox();
}

function endComponentEdit(cancel) {
	cancel = (cancel == null) ? false : cancel;

	if (!cancel) {
		componentFromWireboard(mainWireboard);
	}

	mainWireboard.removeFromParentSVG();

	var oldWireboard = wireboardStack.pop();
	oldWireboard.addToParentSVG(draw);

	mainWireboard = oldWireboard;

	drawEditbox();
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
	simStep(mainWireboard);
}, 250);

function simStep(wireboard) {
	wireboard.simulate();

	for (var c of wireboard.components)
		c.refresh();
}

setTimeout(function() {
		componentFromSource(JSON.parse('{"name":"main","dependecies":[],"source":{"components":[{"id":"c0","name":"AND","x":920,"y":1040,"config":{"pinCount":2}},{"id":"c1","name":"INPUT","x":608,"y":1040,"config":{"alias":"","side":"left"}},{"id":"c2","name":"INPUT","x":656,"y":1096,"config":{"alias":"","side":"left"}},{"id":"c3","name":"OUTPUT","x":1064,"y":1040,"config":{"alias":""}}],"wires":[[{"cid":"c2","pn":"Q"},{"cid":"c0","pn":"1"}],[{"cid":"c0","pn":"0"},{"cid":"c1","pn":"Q"}],[{"cid":"c3","pn":"I"},{"cid":"c0","pn":"Q"}]]},"silicon":""}'))
		mainWireboard.fromSource(JSON.parse('{"name":"main","dependecies":[],"source":{"components":[{"id":"c0","name":"TOGGLE","x":608,"y":1064,"config":{}},{"id":"c1","name":"TOGGLE","x":608,"y":1008,"config":{}},{"id":"c2","name":"main","x":664,"y":1040,"config":{}},{"id":"c3","name":"LED","x":824,"y":1040,"config":{}}],"wires":[[{"cid":"c0","pn":"Q"},{"cid":"c2","pn":"I1"}],[{"cid":"c2","pn":"I0"},{"cid":"c1","pn":"Q"}],[{"cid":"c2","pn":"O0"},{"cid":"c3","pn":"I"}]]},"silicon":""}'))
}, 1000);
