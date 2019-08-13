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
	ret.dependecies = wireboard.getDependencies();

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
	mainWireboard.createComponent(componentName);
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
	if (component.constructor.source) {
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
}

function endComponentEdit(cancel) {
	cancel = (cancel == null) ? false : cancel;

	mainWireboard.removeFromParentSVG();

	if (!cancel) {
		componentFromWireboard(mainWireboard);

		// Update itself and every component with a dependency
		var dependeciesToUpdate = [];
		generateDirtyDependenciesList(dependeciesToUpdate, mainWireboard.name);

		for (var w of wireboardStack) {
			var componentsToUpdate = [];

			for (var c of w.components)
				if (dependeciesToUpdate.includes(c.constructor.name))
					componentsToUpdate.push(c);

			for (var c of componentsToUpdate) {
				console.log('update component', w, c);
				w.updateComponent(c, c.constructor.name);
			}
		}
	}

	var oldWireboard = wireboardStack.pop();

	oldWireboard.addToParentSVG(draw);
	mainWireboard = oldWireboard;

	drawEditbox();
}

function generateDirtyDependenciesList(dirtyList, componentName) {
	dirtyList = dirtyList || [];
	dirtyList.push(componentName);
	for (var t of Object.values(toolbox)) {
		if (t.dependecies)
			if (t.dependecies.includes(componentName))
				if (!dirtyList.includes(t.name))
					generateDirtyDependenciesList(dirtyList, t.name);
	}
}

$('#modalComponentOptions').on('click', '.btnComponentOptionsApply', this, function(event) {
	var component = $('#modalComponentOptions').data('component');

	var userConfig = {};
	var configInputs = $('[id^=ci_]').toArray();
	for (var idx in configInputs) {
		var configInputElement = configInputs[idx];
		var configItemName = $(configInputElement).attr('id').replace('ci_','');
		var configItemValue = $(configInputElement).val();

		userConfig[configItemName] = configItemValue;
	}

	var ret = component.onVerifyConfig(userConfig);
	if (ret) {
		mainWireboard.updateComponent(component, component.constructor.name, userConfig);
		component.onConfigChanged();
		$('#modalComponentOptions').modal('hide');
	}
});

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
	wireboard.refresh();
}

setTimeout(function() {
//	componentFromSource(JSON.parse('{"name":"not","source":{"components":[{"id":"c0","name":"INPUT","x":536,"y":784,"config":{"alias":"I0","side":"left"}},{"id":"c1","name":"OUTPUT","x":688,"y":784,"config":{"alias":"O0"}},{"id":"c2","name":"NAND","x":616,"y":784,"config":{"pinCount":2}}],"wires":[[{"cid":"c2","pn":"@r0"},{"cid":"c1","pn":"@l0"}],[{"cid":"c2","pn":"@l1"},{"cid":"c0","pn":"@r0"},{"cid":"c2","pn":"@l0"}]]}}'));
//	componentFromSource(JSON.parse('{"name":"flipflop","source":{"components":[{"id":"c0","name":"INPUT","x":608,"y":832,"config":{"alias":"I0","side":"left"}},{"id":"c1","name":"INPUT","x":608,"y":896,"config":{"alias":"I1","side":"left"}},{"id":"c2","name":"OUTPUT","x":920,"y":832,"config":{"alias":"O0"}},{"id":"c3","name":"NAND","x":720,"y":832,"config":{"pinCount":2}},{"id":"c4","name":"NAND","x":720,"y":888,"config":{"pinCount":2}},{"id":"c5","name":"not","x":792,"y":840,"config":{}}],"wires":[[{"cid":"c3","pn":"@l0"},{"cid":"c0","pn":"@r0"}],[{"cid":"c1","pn":"@r0"},{"cid":"c4","pn":"@l1"}],[{"cid":"c4","pn":"@l0"},{"cid":"c3","pn":"@r0"},{"cid":"c5","pn":"@l0"}],[{"cid":"c4","pn":"@r0"},{"cid":"c3","pn":"@l1"}],[{"cid":"c5","pn":"@r0"},{"cid":"c2","pn":"@l0"}]]}}'));
//	componentFromSource(JSON.parse('{"name":"flopflip","source":{"components":[{"id":"c0","name":"flipflop","x":816,"y":776,"config":{}},{"id":"c1","name":"NAND","x":720,"y":760,"config":{"pinCount":2}},{"id":"c2","name":"NAND","x":720,"y":832,"config":{"pinCount":2}},{"id":"c3","name":"INPUT","x":608,"y":728,"config":{"alias":"I0","side":"left"}},{"id":"c4","name":"INPUT","x":608,"y":840,"config":{"alias":"I1","side":"left"}},{"id":"c5","name":"OUTPUT","x":936,"y":776,"config":{"alias":"O0"}},{"id":"c6","name":"COUNTER","x":896,"y":712,"config":{}}],"wires":[[{"cid":"c1","pn":"@r0"},{"cid":"c0","pn":"@l0"}],[{"cid":"c2","pn":"@r0"},{"cid":"c0","pn":"@l1"}],[{"cid":"c3","pn":"@r0"},{"cid":"c1","pn":"@l0"},{"cid":"c1","pn":"@l1"}],[{"cid":"c4","pn":"@r0"},{"cid":"c2","pn":"@l0"},{"cid":"c2","pn":"@l1"}],[{"cid":"c5","pn":"@l0"},{"cid":"c0","pn":"@r0"},{"cid":"c6","pn":"@l0"}]]}}'))
//	mainWireboard.fromSource(JSON.parse('{"name":"main","source":{"components":[{"id":"c1","name":"LED","x":864,"y":816,"config":{}},{"id":"c2","name":"TOGGLE","x":608,"y":832,"config":{}},{"id":"c3","name":"TOGGLE","x":608,"y":896,"config":{}},{"id":"c5","name":"TOGGLE","x":536,"y":736,"config":{}},{"id":"c6","name":"LED","x":688,"y":768,"config":{}},{"id":"c7","name":"not","x":608,"y":768,"config":{}},{"id":"c4","name":"flopflip","x":712,"y":864,"config":{}}],"wires":[[{"cid":"c2","pn":"@r0"},{"cid":"c4","pn":"@l0"}],[{"cid":"c3","pn":"@r0"},{"cid":"c4","pn":"@l1"}],[{"cid":"c1","pn":"@l0"},{"cid":"c4","pn":"@r0"}],[{"cid":"c7","pn":"@r0"},{"cid":"c6","pn":"@l0"}],[{"cid":"c7","pn":"@l0"},{"cid":"c5","pn":"@r0"}]]}}'))
}, 1000);
