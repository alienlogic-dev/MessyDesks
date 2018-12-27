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

class BUTTON extends Component {
  constructor(config = null) {
    super(0, 1);

    this.minWidth = 5;
    this.minHeight = 5;

    this.btnSVG = null;
  }

  drawSymbol(svg) {
    this.btnSVG = svg.rect(24, 24)
      .radius(6)
      .fill('#ccc')
      .stroke({ color: '#666', width: 2 });
      
    svg.size(24, 24);
  }

  mouseDownEvent(e) {
    this.btnSVG.fill('#888');
    this.outputs[0].value = 1;
  }
  mouseUpEvent(e) {
    this.btnSVG.fill('#ccc');
    this.outputs[0].value = 0;
  }
}

class LED extends Component {
  constructor(config = null) {
    super(1, 0);

    this.minWidth = 5;
    this.minHeight = 5;

    this.ledSVG = null;
  }

  drawSymbol(svg) {
    this.ledSVG = svg.circle(24)
      .fill('#3f0000')
      .stroke({ color: '#330000', width: 2 });
      
    svg.size(24, 24);
  }

  execute() {
    if (+this.inputs[0].value)
      this.ledSVG.fill('#ff0000').stroke({ color: '#cc0000', width: 2 });
    else
      this.ledSVG.fill('#3f0000').stroke({ color: '#330000', width: 2 });
  }
}

class Disp_7Seg extends Component {
  constructor(config = null) {
    super(['A', 'B', 'C', 'D', 'E', 'F', 'G', '.'], 0);

    this.minWidth = 12;
    
    this.ledSVG = null;
  }

  drawSymbol(svg) {
    this.ledSVG = new SVG.G();
    this.ledSVG.rect(636, 1000).fill('#000');
    this.segA = this.ledSVG.path('M 575 138 L 494 211 L 249 211 L 194 137 L 213 120 L 559 120 Z');
    this.segB = this.ledSVG.path('M 595 160 L 544 452 L 493 500 L 459 456 L 500 220 L 582 146 Z');
    this.segC = this.ledSVG.path('M 525 560 L 476 842 L 465 852 L 401 792 L 441 562 L 491 516 Z');
    this.segD = this.ledSVG.path('M 457 860 L 421 892 L 94 892 L 69 864 L 144 801 L 394 801 Z');
    this.segE = this.ledSVG.path('M 181 560 L 141 789 L 61 856 L 48 841 L 96 566 L 148 516 Z');
    this.segF = this.ledSVG.path('M 241 218 L 200 453 L 150 500 L 115 454 L 166 162 L 185 145 Z');
    this.segG = this.ledSVG.path('M 485 507 L 433 555 L 190 555 L 156 509 L 204 464 L 451 464 Z');
    this.segDOT = this.ledSVG.circle(92).move(496, 794);

    this.segA.fill('#3f0000');
    this.segB.fill('#3f0000');
    this.segC.fill('#3f0000');
    this.segD.fill('#3f0000');
    this.segE.fill('#3f0000');
    this.segF.fill('#3f0000');
    this.segG.fill('#3f0000');
    this.segDOT.fill('#3f0000');

    this.ledSVG.scale(0.1,0.1);

    svg.add(this.ledSVG);
    svg.size(63.6, 100);
  }

  execute() {
    this.segA.fill(+this.inputs[0].value ? '#ff0000' : '#3f0000');
    this.segB.fill(+this.inputs[1].value ? '#ff0000' : '#3f0000');
    this.segC.fill(+this.inputs[2].value ? '#ff0000' : '#3f0000');
    this.segD.fill(+this.inputs[3].value ? '#ff0000' : '#3f0000');
    this.segE.fill(+this.inputs[4].value ? '#ff0000' : '#3f0000');
    this.segF.fill(+this.inputs[5].value ? '#ff0000' : '#3f0000');
    this.segG.fill(+this.inputs[6].value ? '#ff0000' : '#3f0000');
    this.segDOT.fill(+this.inputs[7].value ? '#ff0000' : '#3f0000');
  }
}

class BCD_7Seg extends Component {
  constructor(config = null) {
    super(['', '', '', ''], 0);

    this.minWidth = 6;
    
    this.ledSVG = null;
    this.segMap = [0x3F, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x67, 0x77, 0x7c, 0x39, 0x5e, 0x79, 0x71];
  }

  drawSymbol(svg) {
    this.ledSVG = new SVG.G();
    this.ledSVG.rect(636, 1000).fill('#000');
    this.segA = this.ledSVG.path('M 575 138 L 494 211 L 249 211 L 194 137 L 213 120 L 559 120 Z');
    this.segB = this.ledSVG.path('M 595 160 L 544 452 L 493 500 L 459 456 L 500 220 L 582 146 Z');
    this.segC = this.ledSVG.path('M 525 560 L 476 842 L 465 852 L 401 792 L 441 562 L 491 516 Z');
    this.segD = this.ledSVG.path('M 457 860 L 421 892 L 94 892 L 69 864 L 144 801 L 394 801 Z');
    this.segE = this.ledSVG.path('M 181 560 L 141 789 L 61 856 L 48 841 L 96 566 L 148 516 Z');
    this.segF = this.ledSVG.path('M 241 218 L 200 453 L 150 500 L 115 454 L 166 162 L 185 145 Z');
    this.segG = this.ledSVG.path('M 485 507 L 433 555 L 190 555 L 156 509 L 204 464 L 451 464 Z');
    this.segDOT = this.ledSVG.circle(92).move(496, 794);

    this.segA.fill('#3f0000');
    this.segB.fill('#3f0000');
    this.segC.fill('#3f0000');
    this.segD.fill('#3f0000');
    this.segE.fill('#3f0000');
    this.segF.fill('#3f0000');
    this.segG.fill('#3f0000');
    this.segDOT.fill('#3f0000');

    this.ledSVG.scale(0.05,0.05);

    svg.add(this.ledSVG);
    svg.size(31.8, 50);
  }

  execute() {
    var data = 0;
    for (var idx = 0; idx < this.inputs.length; idx++) {
      var dPin = +this.inputs[idx].value;
      data = data | (dPin ? (1 << idx) : 0);
    }

    var segData = this.segMap[data];

    this.segA.fill(segData & 0x01 ? '#ff0000' : '#3f0000');
    this.segB.fill(segData & 0x02 ? '#ff0000' : '#3f0000');
    this.segC.fill(segData & 0x04 ? '#ff0000' : '#3f0000');
    this.segD.fill(segData & 0x08 ? '#ff0000' : '#3f0000');
    this.segE.fill(segData & 0x10 ? '#ff0000' : '#3f0000');
    this.segF.fill(segData & 0x20 ? '#ff0000' : '#3f0000');
    this.segG.fill(segData & 0x40 ? '#ff0000' : '#3f0000');
  }
}

class CLOCK extends Component {
  constructor(config = null) {
    super(0, 1);

    this.interval = 10;
    if (config)
      this.interval = +config.interval;

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

  getConfig() {
    return {
      interval: this.interval
    };
  }
}

class R_TRIG extends Component {
  constructor(config = null) {
    super(1, 1);

    this.lastValue = 0;
  }

  execute() {
    this.outputs[0].value = (this.inputs[0].value != this.lastValue) && (+this.inputs[0].value);
    this.lastValue = this.inputs[0].value;
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
      var dPin = +this.inputs[idx].value;
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

var toolbox = { 'INPUT': INPUT, 'OUTPUT': OUTPUT, 'BUTTON': BUTTON, 'LED': LED, 'Disp_7Seg': Disp_7Seg, 'BCD_7Seg': BCD_7Seg, 'CLOCK': CLOCK, 'R_TRIG': R_TRIG, 'TRI_Component': TRI_Component, 'NOR_Component': NOR_Component, 'SR_Component': SR_Component, 'RAM_Component': RAM_Component, 'CPU6502_Component': CPU6502_Component, 'ToBus_Component': ToBus_Component, 'FromBus_Component': FromBus_Component, 'BIN2DEC_Component': BIN2DEC_Component, 'DEC2BIN_Component': DEC2BIN_Component };
drawToolbox();
