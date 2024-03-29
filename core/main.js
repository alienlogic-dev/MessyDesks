// initialize SVG.js
var wireboardWidth = 256;
var wireboardHeight = 256;
var draw = SVG('drawing').size(wireboardWidth*8, wireboardHeight*8);

var mainWireboard = new Wireboard('main', true);
var wireboardStack = [];
var componentStack = [];

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
	},
  A: {
    modifier: {
			meta: true,
			shift: false,
			alt: false
		},
    action: function() {
      for (var c of mainWireboard.components)
        c.select();
    }
  },
  O: {
    modifier: {
			meta: true,
			shift: false,
			alt: false
		},
    action: function() {
			$('#file').click();
    }
  },
  S: {
    modifier: {
			meta: true,
			shift: false,
			alt: false
		},
    action: function() {
			saveProjectToFile();
    }
  }
}

$(document).keydown(function(e) {
  var bypassHotkeys = (!($('#modalComponentOptions').data('bs.modal') || {})._isShown) && (!($('#modalConnectToBoard').data('bs.modal') || {})._isShown) && (!($('#modalNewComponent').data('bs.modal') || {})._isShown) && (!$('#drawing').hasClass('hide'));
	if (bypassHotkeys) {
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
	
					modifierMatch = ((hotkey.modifier.meta == e.metaKey) || (hotkey.modifier.meta == e.ctrlKey)) && (hotkey.modifier.shift == e.shiftKey) && (hotkey.modifier.alt == e.altKey);
				}
	
				if (modifierMatch) {
					if (hotkey.toolbox) { // Create new toolbox component
						addComponentFromToolbox(hotkey.toolbox);
            return false;
					}
          if (hotkey.action) {
            hotkey.action();
            return false;
          }
				}
			}
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

	ret.source = wireboard.toSource(false, forceName);
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

function drawBoardConnection() {
  if (connectedHost) {
    $('#btnConnectBoard').addClass('text-success');
    $('#btnConnectBoard > i').addClass('fa-rotate-90');
    $('#btnCompileBoard').removeAttr('disabled');
  } else {
    $('#btnConnectBoard').removeClass('text-success');
    $('#btnConnectBoard > i').removeClass('fa-rotate-90');
    $('#btnCompileBoard').attr('disabled', '');
  }
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
  componentStack.push(component);
	wireboardStack.push(mainWireboard);
	mainWireboard.removeFromParentSVG();

	if (component.constructor.source) { // Open Source first
		editedSiliconComponentName = null;

		var newWireboard = new Wireboard(component.constructor.name, true);
		newWireboard.fromSource(component.constructor.source);
		newWireboard.addToParentSVG(draw);
	
		var tc = new Component()
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

  var oldComponent = componentStack.pop();
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

var connectedHost = null;

$('#btnConnectBoard').on('click', function(event) {
  if (connectedHost == null) {
	  $('#modalConnectToBoard').modal('show');
  } else {
    if (confirm('Disconnect from board?')) {
      connectedHost = null;
      drawBoardConnection();
    }
  }
});

$('#btnConfirmConnectBoard').on('click', function(event) {
  var boardIP = $('#boardIPAddress').val();
  if ((boardIP != null) && (boardIP != "")) {
    connectedHost = boardIP;
    $.ajax({
      type: 'GET',
      url: `http://${connectedHost}:3000/source/`,
      timeout: 1000,
      success: function(data) {
        drawBoardConnection();

        if (data)
          loadProject(data);

        initWebSocket();
      },
      error: function(data) {
        connectedHost = null;
        drawBoardConnection();
        alert('Error connection to board!');
      }
    });
  }

	$('#modalConnectToBoard').modal('hide');
});

$('#btnCompileBoard').on('click', function(event) {
  $.ajax({
    type: 'POST',
    url: `http://${connectedHost}:3000/upload/`,
    data: JSON.stringify({
      source: saveProject(),
      code: generateCompiledCode()
    }),
    contentType: 'application/json'
  });
});

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

function compileAndLocalDownload() {
	var filename = prompt('Enter project filename', 'project');
	if ((filename != null) && (filename != ""))
		download(generateCompiledCode(), filename + '.js', 'text/plain');
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
	frameworkParts.push(Wire.toString().replace(' extends Cable', '').replace('super();', ''));
	frameworkParts.push(Pin.toString().replace(' extends Pong', '').replace('super();', ''));
	frameworkParts.push(Component.toString().replace(' extends Symbol', '').replace('super();', ''));

	var frameworkCode = frameworkParts.join('\n').replace(/\n\s*\n/g, '\n');
	compiledCodeParts.push(frameworkCode);

	// Generate toolbox code
	var toolboxParts = [];
	for (var tId in toolbox) {
		if (tId != mainWireboard.name) {
			var ts = clearSiliconComponent(tId);
			toolboxParts.push(ts);
		}
	}
	var toolboxCode = toolboxParts.join('\n').replace(/\n\s*\n/g, '\n');
	compiledCodeParts.push(toolboxCode);

	// Generate wireboard code
	var wireboardCode = mainWireboard.toSilicon().replace(/\n\s*\n/g, '\n');
	compiledCodeParts.push(wireboardCode);

	// Add class export for Node.js
	compiledCodeParts.push(`module.exports = ${mainWireboard.name};`);

	var compiledCode = compiledCodeParts.join('\n');

  return compiledCode;
}

initWireboard();

setTimeout(function() {
	window.scrollTo( ($(document).width()-$(window).width())/2, ($(document).height()-$(window).height())/2);
}, 100);

/* Real-Time Simulation */
setInterval(function() {
  if (connectedHost == null)
	  simStep(mainWireboard);
  else
    refreshFromBoard();
}, 250);

function simStep(wireboard) {
	wireboard.simulate();
	wireboard.refresh();
}

var socket = null;

function initWebSocket() {
  socket = new WebSocket(`ws://${connectedHost}:8081`);

  socket.onmessage = function(event) {
    var data = event.data;

    if (data)
      if (data.length > 0) {
        var actualValues = JSON.parse(data);

        for (let [key, value] of Object.entries(actualValues)) {
          if (key.startsWith('c')) {
            if (value.length > 0) {
              var foundComponents = mainWireboard.components.filter(t => t.id == key);
              if (foundComponents.length > 0) {
                var c = foundComponents[0];
                //console.log('Component:', key, c, value);
                for (var p of value) {
                  c.writePin(p.name, p.value);
                }
              }
            }
          } else if (key.startsWith('w')) {
            //console.log('Wire:', key, value);
            var wIdx = +key.substr(1);
            mainWireboard.wires[wIdx].value = value;
          } else {
            //console.log('Else:', key, value);
            mainWireboard[key] = value;
          }
        }

        mainWireboard.refresh();
      }
  };

  socket.onclose = function(event) {
    connectedHost = null;
    drawBoardConnection();
  };

  socket.onerror = function(error) {
    socket = null;
    connectedHost = null;
    drawBoardConnection();

    alert('Error connection to board!');
  };
}


function refreshFromBoard() {
  if (connectedHost) {
    if (socket)
      if (socket.readyState == socket.OPEN) {
        var tree = [];
        for (var c of componentStack)
          tree.push(c.id);

        socket.send(tree.join('/'));
      }
  }
}

setTimeout(function() {
	mainWireboard.fromSource(JSON.parse(examples['blinkled']));
}, 1000);

var examples = {
  blinkled: '{"name":"main","source":{"components":[{"id":"c0","name":"LED","x":976,"y":1016,"config":{}},{"id":"c1","name":"CLOCK","x":872,"y":1024,"config":{"interval":1000}}],"wires":[[{"cid":"c0","pn":"@l0"},{"cid":"c1","pn":"@r0"}]]}}',
  logicgates: '{"name":"main","source":{"components":[{"id":"c2","name":"TOGGLE","x":712,"y":976,"config":{}},{"id":"c3","name":"TOGGLE","x":712,"y":1112,"config":{}},{"id":"c4","name":"AND","x":856,"y":992,"config":{"pinCount":2}},{"id":"c5","name":"OR","x":904,"y":1048,"config":{"pinCount":2}},{"id":"c6","name":"XOR","x":856,"y":1104,"config":{"pinCount":2}},{"id":"c7","name":"LED","x":1008,"y":992,"config":{}},{"id":"c8","name":"LED","x":1008,"y":1048,"config":{}},{"id":"c9","name":"LED","x":1008,"y":1104,"config":{}}],"wires":[[{"cid":"c3","pn":"@r0"},{"cid":"c6","pn":"@l1"},{"cid":"c5","pn":"@l1"},{"cid":"c4","pn":"@l1"}],[{"cid":"c2","pn":"@r0"},{"cid":"c4","pn":"@l0"},{"cid":"c5","pn":"@l0"},{"cid":"c6","pn":"@l0"}],[{"cid":"c7","pn":"@l0"},{"cid":"c4","pn":"@r0"}],[{"cid":"c8","pn":"@l0"},{"cid":"c5","pn":"@r0"}],[{"cid":"c9","pn":"@l0"},{"cid":"c6","pn":"@r0"}]]}}',
  customcomponent: '',
  customjscomponent: '',
  httprouting: '',
}

function loadExample(name) {
	mainWireboard.fromSource(JSON.parse(examples[name]));
	$('#modalViewExamples').modal('hide');
}