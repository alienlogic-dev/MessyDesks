class INPUT extends Component {
  constructor(config = null) {
    super(0, 1);

    this.alias = '';
  	if (config)
  		this.alias = config.alias;
  }

  dblClickEvent(e) {
  	var name = prompt('Enter input name', this.alias);

		if ((name != null) && (name != "")) {
		  this.alias = name;
		  this.aliasSVG.text(this.alias);
		}
  }

  drawBody(wpx, hpx) {
  	this.svgBody = this.svg.rect(wpx, hpx)
			.radius(2)
			.move(0, 0)
			.fill('#cccccc')
			.stroke({ color: '#666666', width: 2 });

		this.aliasSVG = this.svg
			.text(this.alias)
			.font({
						  family:   'Menlo'
						, size:     12
						, anchor:   'middle'
						})
			.move(wpx / 2, -15);
  }

  getConfig() {
  	return {
  		alias: this.alias
  	};
  }
}

class OUTPUT extends Component {
  constructor(config = null) {
    super(1, 0);

    this.alias = '';
  	if (config)
  		this.alias = config.alias;
  }

  dblClickEvent(e) {
  	var name = prompt('Enter output name', this.alias);

		if ((name != null) && (name != "")) {
		  this.alias = name;
		  this.aliasSVG.text(this.alias);
		}
  }

  drawBody(wpx, hpx) {
  	this.svgBody = this.svg.rect(wpx, hpx)
			.radius(2)
			.move(0, 0)
			.fill('#cccccc')
			.stroke({ color: '#666666', width: 2 });

		this.aliasSVG = this.svg
			.text(this.alias)
			.font({
						  family:   'Menlo'
						, size:     12
						, anchor:   'middle'
						})
			.move(wpx / 2, -15);
  }

  getConfig() {
  	return {
  		alias: this.alias
  	};
  }
}

class CLOCK extends Component {
  constructor(config = null) {
    super(0, 1);

    this.interval = 10;
    this.lastTimestamp = Math.floor(Date.now());
  }

  execute() {
  	var timestamp = Math.floor(Date.now());
  	if ((timestamp - this.lastTimestamp) > this.interval) {
  		this.outputs[0].value = !this.outputs[0].value;
  		this.lastTimestamp = timestamp;
  	}
  }

  dblClickEvent(e) {
  	var interval = prompt('Enter interval', this.interval);

		if ((interval != null) && (interval != "")) {
		  this.interval = +interval;
		}
  }
}

class TRI_Component extends Component {
  constructor() {
    super(
      ['I', 'En'],
      [],
      ['Q']
    );
  }

  execute() {
    var enPin = +this.inputs[2].value;

    if (enPin) {
      this.outputs[0].value = this.inputs[1].value;
    } else {
      this.outputs[0].value = null;
    }
  }
}

class NOR_Component extends Component {
  constructor(config = null) {
  	var inputsCount = 2;
  	if (config)
  		inputsCount = config.inputsCount;

  	if (inputsCount < 2) inputsCount = 2;
    super(inputsCount, 1);
  }

  drawSymbol(svg) {
  	svg.svg('<path d="M 0 0 Q 11.2 0 14 8 Q 11.2 16 0 16 Q 2.8 16 2.8 8 Q 2.8 0 0 0 Z"></path><circle cx="15" cy="8" r="2"></circle>')
			.size(17,16)
			.fill('#cccccc')
			.stroke({ color: '#000', width: 1 });
  }

  execute() {
  	var res = (Boolean(+this.inputs[0].value) ? true : false);
  	for (var idx = 1; idx < this.inputs.length; idx++)
  		res = res || (Boolean(+this.inputs[idx].value) ? true : false);
  	this.outputs[0].value = !res ? 1 : 0; 
  }

  getConfig() {
  	return {
  		inputsCount: this.inputs.length
  	};
  }

  dblClickEvent(e) {
  }
}


class SR_Component extends Component {
	constructor() {
    super(['S', 'R'], ['Q']);
  }

  init() {
  	this._c0 = new NOR_Component();
  	this._c1 = new NOR_Component();
  }

  execute() {
		this._c0.setIn(0, this.inputs[1].value);
		this._c0.setIn(1, this._c1.getOut(0));
		
		this._c1.setIn(0, this._c0.getOut(0));
		this._c1.setIn(1, this.inputs[0].value);

		this.outputs[0].value = this._c0.getOut(0);
  }
}


class RAM_Component extends Component {
	constructor() {
    super(
    	['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15', 'CS', 'OE', 'RW'],
    	[],
    	['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']
    );

		this.minWidth = 10;

    this.ram = Array(Math.pow(2, 16)).fill(0);
    this.ram[0xFFFC] = 0x00;
    this.ram[0xFFFD] = 0x10;

    this.ram[0x1000] = 0xE6;
    this.ram[0x1001] = 0x00;

    this.ram[0x1002] = 0x4C;
    this.ram[0x1003] = 0x00;
    this.ram[0x1004] = 0x10;
  }

  execute() {
  	var csPin = +this.inputs[24].value;
  	var oePin = +this.inputs[25].value;
  	var rwPin = +this.inputs[26].value;

  	var addr = 0x00;
  	for (var i = 0; i < 16; i++)
  		addr = addr | (+this.inputs[i + 8].value ? (1 << i) : 0);

  	for (var i = 0; i < 8; i++)
  		this.outputs[i].value = null;

  	if (csPin) {
  		if (rwPin) {
	  		if (oePin) {
	  			var ramValue = this.ram[addr];
			  	for (var i = 0; i < 8; i++)
			  		this.outputs[i].value = (ramValue >> i) & 0x01;
	  		}
	  	} else {
		  	var dataValue = 0x00;
		  	for (var i = 0; i < 8; i++)
		  		dataValue = dataValue | (+this.inputs[i].value ? (1 << i) : 0);

				this.ram[addr] = dataValue;
	  	}
  	}
  }

  dblClickEvent(e) {
  	var value = prompt('Enter value @ 3', 0);

		if ((value != null) && (value != "")) {
		  this.ram[3] = +value;
		}
  }
}

class CPU6502_Component extends Component {
	constructor() {
    super(
    	['RST', 'CLK'],
    	['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15', 'RW'],
    	['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']
    );

		this.minWidth = 10;

		this.lastRST_state = 0;
		this.lastCLK_state = 0;

		this.cpu = new CPU6502.CPU6502();
    this.cpu.md_component = this;

    this.cpu.read = function(addr) {
    	//console.log('read @ ' + addr.toString(16));

    	this.md_component.outputs[24].value = 1; // Rw

	  	for (var i = 0; i < 16; i++)
    		this.md_component.outputs[i + 8].value = (addr >> i) & 0x01;

	  	simStep();

	  	var data = 0x00;
	  	for (var i = 0; i < 8; i++)
	  		data = data | (+this.md_component.inputs[i].value ? (1 << i) : 0);

	    return data;
    }

    this.cpu.write = function(addr, value) {
    	//console.log('write ' + value.toString(16) + ' @ ' + addr.toString(16));

	  	for (var i = 0; i < 16; i++)
    		this.md_component.outputs[i + 8].value = (addr >> i) & 0x01;

	  	for (var i = 0; i < 8; i++)
    		this.md_component.outputs[i].value = (value >> i) & 0x01;

	  	simStep();

    	this.md_component.outputs[24].value = 0; // rW

    }
  }

  execute() {
  	if ((+this.inputs[8].value == 1) && (this.lastRST_state == 0)){
  		this.lastRST_state = +this.inputs[8].value;
    	this.cpu.reset();
  	}
  	else
  		this.lastRST_state = +this.inputs[8].value;

  	if ((+this.inputs[9].value == 1) && (this.lastCLK_state == 0)){
  		this.lastCLK_state = +this.inputs[9].value;
    	this.cpu.step();
  	}
  	else
  		this.lastCLK_state = +this.inputs[9].value;
  }
}


class ToBus_Component extends Component {
	constructor(config = null) {
  	var size = 8;
  	if (config)
  		size = config.size;

  	if (size < 2) size = 2;
    super(size, 1);

    for (var idx = 0; idx < size; idx++)
    	this.inputs[idx].name = 'D' + idx;

    this.outputs[0].name = 'Bus';
  }

  execute() {
  	var data = [];
  	for (var idx = 0; idx < this.inputs.length; idx++)
  		data.push(this.inputs[idx].value);
  	this.outputs[0].value = data;
  }
}

class FromBus_Component extends Component {
	constructor(config = null) {
  	var size = 8;
  	if (config)
  		size = config.size;

  	if (size < 2) size = 2;
    super(1, size);

    this.inputs[0].name = 'Bus';

    for (var idx = 0; idx < size; idx++)
    	this.outputs[idx].name = 'D' + idx;
  }

  execute() {
  	var data = this.inputs[0].value;
    if (data)
    	for (var idx = 0; idx < data.length; idx++)
    		this.outputs[idx].value = data[idx];
  }
}


class BIN2DEC_Component extends Component {
  constructor(config = null) {
    var size = 8;
    if (config)
      size = config.size;

    if (size < 2) size = 2;
    super(size, 1);

    for (var idx = 0; idx < size; idx++)
      this.inputs[idx].name = 'D' + idx;

    this.outputs[0].name = 'Bus';
  }

  execute() {
    var data = 0;
    for (var idx = 0; idx < this.inputs.length; idx++) {
      var dPin = this.inputs[idx].value;
      data = data | (dPin ? (1 << idx) : 0);
    }

    this.outputs[0].value = data;
  }
}

class DEC2BIN_Component extends Component {
  constructor(config = null) {
    var size = 8;
    if (config)
      size = config.size;

    if (size < 2) size = 2;
    super(1, size);

    this.inputs[0].name = 'Bus';

    for (var idx = 0; idx < size; idx++)
      this.outputs[idx].name = 'D' + idx;
  }

  execute() {
    var data = this.inputs[0].value;
    for (var idx = 0; idx < this.outputs.length; idx++)
      this.outputs[idx].value = (data >> idx) & 0x01;
  }
}

var toolbox = { 'INPUT': INPUT, 'OUTPUT': OUTPUT, 'CLOCK': CLOCK, 'TRI_Component': TRI_Component, 'NOR_Component': NOR_Component, 'SR_Component': SR_Component, 'RAM_Component': RAM_Component, 'CPU6502_Component': CPU6502_Component, 'ToBus_Component': ToBus_Component, 'FromBus_Component': FromBus_Component, 'BIN2DEC_Component': BIN2DEC_Component, 'DEC2BIN_Component': DEC2BIN_Component };
drawToolbox();
