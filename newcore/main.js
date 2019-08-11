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

draw.on('click', function(e) {
	if (!e.metaKey) // Use CMD or CTRL key for multiple selection
		for (var c of mainWireboard.components)
			c.deselect();

	for (var c of mainWireboard.components) {
		if (pointInRect(e, c.svg.rbox())) {
			if (!e.metaKey)
				c.select();
			else
				if (c.isSelected)
					c.deselect();
				else
					c.select();

			break;
		}
	}
});


$(document).keydown(function(e) {
	if ((!($('#modalComponentOptions').data('bs.modal') || {})._isShown) && (!($('#modalNewComponent').data('bs.modal') || {})._isShown)) {
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
			mainWireboard.removeSelectedComponents();
			return false;
		}
	}
});

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

function newEmptyComponent() {
	var name = $('#newComponentName').val();

	if ((name != null) && (name != ""))
		if (name in toolbox)
			alert('Component alredy exists!');
		else {
			$('#modalNewComponent').modal('hide');
			componentFromSource({
				name: name,
				source:	{
					components: [],
					wires: []
				}
			});

			var inst = new toolbox[name]();
			startComponentEdit(inst);
		}
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
	
	$('#editbox .breadcrumb').append('<li class="breadcrumb-item">' + mainWireboard.name + '</li>');

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

	var wireIdx = 0;
	destWireboard = newWireboard.wires.reduce(function(map, obj) {
			map[`w${wireIdx}`] = obj;
			wireIdx++;
			return map;
	}, destWireboard);

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
	componentFromSource(JSON.parse('{"name":"flipflop","source":{"components":[{"id":"c0","name":"INPUT","x":608,"y":832,"config":{"alias":"I0","side":"left"}},{"id":"c1","name":"INPUT","x":608,"y":896,"config":{"alias":"I1","side":"left"}},{"id":"c2","name":"OUTPUT","x":840,"y":832,"config":{"alias":"O0"}},{"id":"c3","name":"NAND","x":720,"y":832,"config":{"pinCount":2}},{"id":"c4","name":"NAND","x":720,"y":888,"config":{"pinCount":2}}],"wires":[[{"cid":"c3","pn":"0"},{"cid":"c0","pn":"Q"}],[{"cid":"c1","pn":"Q"},{"cid":"c4","pn":"1"}],[{"cid":"c4","pn":"0"},{"cid":"c3","pn":"Q"},{"cid":"c2","pn":"I"}],[{"cid":"c4","pn":"Q"},{"cid":"c3","pn":"1"}]]}}'))
	mainWireboard.fromSource(JSON.parse('{"name":"main","source":{"components":[{"id":"c0","name":"flipflop","x":768,"y":832,"config":{}},{"id":"c1","name":"LED","x":864,"y":816,"config":{}},{"id":"c2","name":"TOGGLE","x":608,"y":832,"config":{}},{"id":"c3","name":"TOGGLE","x":608,"y":896,"config":{}}],"wires":[[{"cid":"c1","pn":"I"},{"cid":"c0","pn":"O0"}],[{"cid":"c2","pn":"Q"},{"cid":"c0","pn":"I0"}],[{"cid":"c3","pn":"Q"},{"cid":"c0","pn":"I1"}]]}}'))
}, 1000);
