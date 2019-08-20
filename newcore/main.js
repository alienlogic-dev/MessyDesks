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
	if (!e.metaKey && !e.ctrlKey) // Use CMD or CTRL key for multiple selection
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

	drawComponentQuickActions();
});

var hotkeys = {
	I: {
		modifier: {
			meta: false,
			shift: false,
			alt: false
		},
		toolbox: 'INPUT'
	},
	O: {
		modifier: {
			meta: false,
			shift: false,
			alt: false
		},
		toolbox: 'OUTPUT'
	}
}

$(document).keydown(function(e) {
	if ((!($('#modalComponentOptions').data('bs.modal') || {})._isShown) && (!($('#modalNewComponent').data('bs.modal') || {})._isShown) && (!$('#drawing').hasClass('hide'))) {
		//console.log(String.fromCharCode(e.keyCode), e.metaKey, e.shiftKey, e.altKey);
		var keyCh = String.fromCharCode(e.keyCode).toUpperCase();
		if (keyCh in hotkeys) {
			var hotkey = hotkeys[keyCh];

			if (hotkey) {
				var modifierMatch = true;
				if (hotkey.modifier) {
					hotkey.modifier.meta = hotkey.modifier.meta || false;
					hotkey.modifier.shift = hotkey.modifier.shift || false;
					hotkey.modifier.alt = hotkey.modifier.alt || false;
	
					modifierMatch = (hotkey.modifier.meta == e.metaKey) && (hotkey.modifier.shift == e.shiftKey) && (hotkey.modifier.alt == e.altKey);
				}
	
				if (modifierMatch) {
					if (hotkey.toolbox) { // Create new toolbox component
						addComponentFromToolbox(hotkey.toolbox);
					}
				}
			}
		}

		if ((e.keyCode == 79) && e.metaKey) { // CMD/CTRL + O -> Open project
			$('#file').click();
			return false;
		}

		if ((e.keyCode == 83) && e.metaKey) { // CMD/CTRL + S -> Save project
			saveProjectToFile();
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

function btnStartComponentEdit() {	
	for (var c of mainWireboard.components) {
		if (c.isSelected) {
			startComponentEdit(c);
			break;
		}
	}
}

function componentFromSource(src, forceName) {
	var wireboard = new Wireboard(forceName || '');
	wireboard.fromSource(src);
	componentFromWireboard(wireboard, forceName);
}

function componentFromWireboard(wireboard, forceName) {
	var componentName = forceName || wireboard.name;
	var siliconCode = wireboard.toSilicon(forceName);

	var ret = componentFromSilicon(componentName, siliconCode);

	ret.source = wireboard.toSource(forceName);
	ret.dependecies = wireboard.getDependencies();

	wireboard.clear();
	return ret;
}

function componentFromSilicon(componentName, siliconCode) {
	var ret = eval(`${componentName} = (${siliconCode}); ${componentName}`);
	toolbox[componentName] = ret;
	return ret;
}

function newEmptyComponent() {
	var name = $('#newComponentName').val();

	if ((name != null) && (name != ""))
		$('#newComponentName').val('');

		if (name in toolbox)
			alert('Component alredy exists!');
		else {
			$('#modalNewComponent').modal('hide');

			if (newComponentSourceFromWireboard)
				componentFromWireboard(mainWireboard, name);
			else
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

function replaceSelectedComponents() {
  var newComponentName = $('#replaceNewComponentName').val();

  for (var cIdx = mainWireboard.components.length - 1; cIdx >= 0; cIdx--) {
    var c = mainWireboard.components[cIdx];
		if (c.isSelected) {
      mainWireboard.updateComponent(c, newComponentName);
		}
	}

	$('#modalReplaceComponent').modal('hide');
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

  updateToolboxSelect();
}

function updateToolboxSelect() {
  var toolboxSelects = $('.toolboxSelect');
  toolboxSelects.each(function() {
    $(this).html('');

    for (var t in toolbox) {
      var newToolboxButton = `<option value="${t}">${t}</option>`;
      $(this).append(newToolboxButton);
    }
  });
}

/* Editor */
var editedSiliconComponentName = null;

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
	
	$('#editbox .breadcrumb').append('<li class="breadcrumb-item">' + (editedSiliconComponentName ? editedSiliconComponentName : mainWireboard.name) + '</li>');

	drawSiliconbox();
	drawComponentQuickActions();
}

function drawSiliconbox() {
	if (wireboardStack.length > 0) {
		if (editedSiliconComponentName){
			$('#siliconCodeArea').removeClass('hide');
			$('#drawing').addClass('hide');
			$('#btnSwitchToSilicon, #btnNewComponent').addClass('hide');
			$('#btnSwitchCode').removeClass('hide');
		} else {
			$('#siliconCodeArea').addClass('hide');
			$('#drawing').removeClass('hide');
			$('#btnSwitchToSilicon, #btnNewComponent').removeClass('hide');
			$('#btnSwitchCode').addClass('hide');
		}
	} else {
		$('#siliconCodeArea').addClass('hide');
		$('#drawing, #btnNewComponent').removeClass('hide');
		$('#btnSwitchToSilicon').addClass('hide');
		$('#btnSwitchCode').addClass('hide');
	}
}

function drawComponentQuickActions() {
	// Check if any object is selected
	var selectedComponents = mainWireboard.components.filter(t => t.isSelected == true);

	if ((selectedComponents.length == 1) && !editedSiliconComponentName)
		$('#btnStartComponentEdit').removeClass('hide');
	else
		$('#btnStartComponentEdit').addClass('hide');

	if (selectedComponents.length > 0)
		$('#btnReplaceComponents').removeClass('hide');
	else
		$('#btnReplaceComponents').addClass('hide');
}

function switchToSilicon() {
	if (editedSiliconComponentName)
		editedSiliconComponentName = null;
	else
		editedSiliconComponentName = mainWireboard.name;

	siliconEditor.setValue(mainWireboard.toSilicon());

	drawEditbox();
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

	if (component.constructor.source) { // Open Source first
		editedSiliconComponentName = null;

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
	} else { // Open Silicon only
		editedSiliconComponentName = component.constructor.name;
		siliconEditor.setValue(component.constructor.toString());
	}

	drawEditbox();
}

function endComponentEdit(cancel) {
	cancel = (cancel == null) ? false : cancel;

	mainWireboard.removeFromParentSVG();

	if (!cancel) {
		if (editedSiliconComponentName)
			componentFromSilicon(editedSiliconComponentName, siliconEditor.getValue());
		else
			componentFromWireboard(mainWireboard);

		// Update itself and every component with a dependency
		var dependeciesToUpdate = [];
		generateDirtyDependenciesList(dependeciesToUpdate, editedSiliconComponentName ? editedSiliconComponentName : mainWireboard.name);

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
	editedSiliconComponentName = null;

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

var newComponentSourceFromWireboard = false;

$('#btnNewComponent').on('click', function(event) {
	newComponentSourceFromWireboard = false;
	$('#modalNewComponent').modal('show');
});

$('#btnNewEmptyComponent').on('click', function(event) {
	newComponentSourceFromWireboard = false;
	$('#modalNewComponent').modal('show');
});

$('#btnNewWireboardComponent').on('click', function(event) {
	newComponentSourceFromWireboard = true;
	$('#modalNewComponent').modal('show');
});

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

/* Project Save / Open */
function saveProject() {
	var project = {
		toolbox: [],
		wireboard: {}
	};

	for (var tId in toolbox) {
		var t = toolbox[tId];

		// TODO: Save with dependencies order ?
		if (t.source) {
			project.toolbox.push(t.source);
		} else {
			project.toolbox.push({
				name: tId,
				silicon: t.toString()
			});
		}
	}

	project.wireboard = mainWireboard.toSource();

	return project;
}

function saveProjectToFile() {
	var filename = prompt('Enter project filename', 'project');
	if ((filename != null) && (filename != ""))
		download(JSON.stringify(saveProject()), filename + '.prj', 'text/plain');
}

function loadProject(project) {
	if (!project) return null;

	project.toolbox = project.toolbox || [];
	project.wireboard = project.wireboard || {};

	for (var t of project.toolbox) {
		if (t.source) {
			componentFromSource(t);
		} else if (t.silicon) {
			componentFromSilicon(t.name, t.silicon);
		} else
			console.error('Error in project!');
	}

	mainWireboard.fromSource(project.wireboard);
}

// Function to read data from a file
var openFile = function(event, callback) {
	var input = event.target;

	var reader = new FileReader();
	reader.onload = function(){
		var text = reader.result;
		loadProject(JSON.parse(text));
	};
	reader.readAsText(input.files[0]);
};

/* Clean Compiled code generator */
function clearSiliconComponent(componentName) {
	var t = toolbox[componentName];
	var tk = Object.getOwnPropertyNames(t.prototype);
	var s = Object.getOwnPropertyNames(Symbol.prototype);

	var classParts = [];

	classParts.push(`class ${t.name} extends Component {`);

	for (var i of arrayDiff(tk, s)) {
		var code = t.prototype[i].toString();
		classParts.push('\t' + code);
	}

	classParts.push(`}`);

	return classParts.join('\n');
}

function generateCompiledCode() {
	var compiledCodeParts = [];

	// Generate framework code
	var frameworkParts = [];
	frameworkParts.push(Wire.toString().replace(' extends Cable', '').replace('super();\n', ''));
	frameworkParts.push(Pin.toString().replace(' extends Pong', '').replace('super();\n', ''));
	frameworkParts.push(Component.toString().replace(' extends Symbol', '').replace('super();\n', ''));

	var frameworkCode = frameworkParts.join('\n').replace(/\n\s*\n/g, '\n');
	compiledCodeParts.push(frameworkCode);

	// Generate toolbox code
	var toolboxParts = [];
	for (var tId in toolbox) {
		var ts = clearSiliconComponent(tId);
		toolboxParts.push(ts);
	}
	var toolboxCode = toolboxParts.join('\n').replace(/\n\s*\n/g, '\n');
	compiledCodeParts.push(toolboxCode);

	// Generate wireboard code
	var wireboardCode = mainWireboard.toSilicon().replace(/\n\s*\n/g, '\n');
	compiledCodeParts.push(wireboardCode);

	var compiledCode = compiledCodeParts.join('\n');
	console.log(compiledCode);
}

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
	mainWireboard.fromSource(JSON.parse('{"name":"main","source":{"components":[{"id":"c0","name":"LED","x":688,"y":872,"config":{}},{"id":"c1","name":"CLOCK","x":576,"y":872,"config":{}}],"wires":[[{"cid":"c0","pn":"@l0"},{"cid":"c1","pn":"@r0"}]]}}'))
}, 1000);
