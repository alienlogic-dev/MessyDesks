// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var spawn = require('child_process').spawn;

function compileBoard() {
	var compile = spawn('make', ['all'], {cwd: 'board/messydesk/Debug'});
	compile.stdout.on('data', function (data) {
	  console.log('stdout: ' + data);
	});
	compile.stderr.on('data', function (data) {
	  console.log(String(data));
	});
}

document.querySelector('#btnCompileBoard').addEventListener('click', compileBoard);
