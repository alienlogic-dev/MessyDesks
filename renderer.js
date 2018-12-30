// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var fs = require('fs');
var spawn = require('child_process').spawn;

function compileBoard() {
	var compile = spawn('make', ['all'], {cwd: 'board/messydesk/Debug'});
	compile.stdout.on('data', function (data) {
	  console.log('stdout: ' + data);
	});
	compile.stderr.on('data', function (data) {
	  console.log(String(data));
	});
	compile.on('close', (code) => {
		console.log(`compileBoard process exited with code ${code}`);
		if (code == 0) flashBoard();
	});
}

function flashBoard() {
	var flash = spawn('make', ['flash'], {cwd: 'board/messydesk/Debug'});
	flash.stdout.on('data', function (data) {
	  console.log('stdout: ' + data);
	});
	flash.stderr.on('data', function (data) {
	  console.log(String(data));
	});
}

function generateCppSource() {
	var sourcePath = 'board/messydesk/src/messydesk.cpp';
	
	var cppSource = compile('c++');

	fs.readFile(sourcePath + '.TEMPLATE', 'utf8', function(err, contents) {
	  var cppSourceWithFramework = contents.replace('###DESK_FRAMEWORK###', cppSource.framework).replace('###DESK_WIREBOARD###', cppSource.wireboard);
	  fs.writeFile(sourcePath, cppSourceWithFramework, function(err) {
	    if(err)
	      return console.log(err);
	    
	    compileBoard();
	    console.log("The file was saved!");
		});
	});
}

document.querySelector('#btnCompileBoard').addEventListener('click', generateCppSource);