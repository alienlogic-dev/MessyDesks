class CONST extends Component {
  defaultConfig() {
    return {
      value : ''
    };
  }

  init() {
    this.minHeight = 3;
    this.minWidth = this.config.value.length;
    super.create(0, 1);
  }

  drawBody(wpx, hpx) {
    this.svgBody = this.svg.rect(wpx, hpx)
      .radius(2)
      .move(0, 0)
      .fill('#cccccc')
      .stroke({ color: '#666666', width: 2 });

    this.valueSVG = this.svg
      .text(this.config.value.toString())
      .font({
              family:   'Menlo'
            , size:     12
            , anchor:   'middle'
            })
      .move(wpx / 2, 0);
  }

  execute(inputs, outputs) {
    outputs[0] = this.config.value;
  }
}

class INPUT extends Component {
  defaultConfig() {
    return {
      alias: ''
    };
  }

  init() {
    super.create(0, 1);
  }

  drawBody(wpx, hpx) {
  	this.svgBody = this.svg.rect(wpx, hpx)
			.radius(2)
			.move(0, 0)
			.fill('#cccccc')
      .stroke({ color: '#666666', width: 2 });
      
		this.aliasSVG = this.svg
			.text(this.config.alias.toString())
			.font({
						  family:   'Menlo'
						, size:     12
						, anchor:   'middle'
						})
			.move(wpx / 2, -15);
  }
}

class OUTPUT extends Component {
  defaultConfig() {
    return {
      alias: ''
    };
  }

  init() {
    super.create(1, 0);
  }

  drawBody(wpx, hpx) {
  	this.svgBody = this.svg.rect(wpx, hpx)
			.radius(2)
			.move(0, 0)
			.fill('#cccccc')
			.stroke({ color: '#666666', width: 2 });

		this.aliasSVG = this.svg
			.text(this.alias ? this.alias.toString() : '')
			.font({
						  family:   'Menlo'
						, size:     12
						, anchor:   'middle'
						})
			.move(wpx / 2, -15);
  }
}



class BUTTON extends Component {
  init() {
    this.minWidth = 5;
    this.minHeight = 5;

    this.btnSVG = null;

    super.create(0, 1);

    this.outputs[0].value = 0;
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
  mouseDblClickEvent(e) { return true; }
}

class TOGGLE extends Component {
  init() {
    this.minWidth = 5;
    this.minHeight = 5;

    this.btnSVG = null;

    super.create(0, 1);

    this.outputs[0].value = 0;
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
  }
  mouseUpEvent(e) {
    this.btnSVG.fill('#ccc');
    this.outputs[0].value = !this.outputs[0].value;
  }
  mouseDblClickEvent(e) { return true; }
}

class CLOCK extends Component {
  constructor(config = null) {
    if (!config)
      config = {
        interval: 10
      };
    
    super(config, 0, 1);

    this.lastTimestamp = Math.floor(Date.now());
  }

  execute(inputs, outputs) {
    var timestamp = Math.floor(Date.now());
    if ((timestamp - this.lastTimestamp) > +this.config.interval) {
      this.outputs[0].value = !this.outputs[0].value;
      this.lastTimestamp = timestamp;
    }
  }

  onConfigChanged(config) {
    this.svgName.text(this.config.interval.toString());
    return true;
  }
}

class R_TRIG extends Component {
  constructor(config = null) {
    super(config, 1, 1);

    this.lastValue = 0;
  }

  execute(inputs, outputs) {
    this.outputs[0].value = (this.inputs[0].value != this.lastValue) && (+this.inputs[0].value);
    this.lastValue = this.inputs[0].value;
  }
}

class TRI_Component extends Component {
  constructor() {
    super(config, 
      ['I', 'En'],
      [],
      ['Q']
    );
  }

  execute(inputs, outputs) {
    var enPin = +this.inputs[2].value;

    if (enPin) {
      this.outputs[0].value = this.inputs[1].value;
    } else {
      this.outputs[0].value = null;
    }
  }
}

class LED extends Component {
  init() {
    this.minWidth = 5;
    this.minHeight = 5;

    this.ledSVG = null;

    this.value = null;

    super.create(1, 0);
  }

  drawSymbol(svg) {
    this.ledSVG = svg.circle(24)
      .fill('#3f0000')
      .stroke({ color: '#330000', width: 2 });
      
    svg.size(24, 24);
  }

  execute(inputs, outputs) {
    this.value = +this.inputs[0].value;
  }

  draw() {
    if (+this.value)
      this.ledSVG.fill('#ff0000').stroke({ color: '#cc0000', width: 2 });
    else
      this.ledSVG.fill('#3f0000').stroke({ color: '#330000', width: 2 });
  }
}

class Disp_7Seg extends Component {
  constructor(config = null) {
    super(config, ['A', 'B', 'C', 'D', 'E', 'F', 'G', '.'], 0);

    this.minWidth = 12;
    
    this.ledSVG = null;

    this.values = [];
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

  execute(inputs, outputs) {
    this.values = [];
    for (var idx in this.inputs)
      this.values.push(this.inputs[idx].value);
  }

  draw() {
    this.segA.fill(+this.values[0] ? '#ff0000' : '#3f0000');
    this.segB.fill(+this.values[1] ? '#ff0000' : '#3f0000');
    this.segC.fill(+this.values[2] ? '#ff0000' : '#3f0000');
    this.segD.fill(+this.values[3] ? '#ff0000' : '#3f0000');
    this.segE.fill(+this.values[4] ? '#ff0000' : '#3f0000');
    this.segF.fill(+this.values[5] ? '#ff0000' : '#3f0000');
    this.segG.fill(+this.values[6] ? '#ff0000' : '#3f0000');
    this.segDOT.fill(+this.values[7] ? '#ff0000' : '#3f0000');
  }
}

class BCD_7Seg extends Component {
  constructor(config = null) {
    super(config, ['', '', '', ''], 0);

    this.minWidth = 6;
    
    this.ledSVG = null;
    this.segMap = [0x3F, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x67, 0x77, 0x7c, 0x39, 0x5e, 0x79, 0x71];
    this.segData = 0x00;
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

  execute(inputs, outputs) {
    var data = 0;
    for (var idx = 0; idx < this.inputs.length; idx++) {
      var dPin = +this.inputs[idx].value;
      data = data | (dPin ? (1 << idx) : 0);
    }

    this.segData = this.segMap[data];
  }

  draw() {
    this.segA.fill(this.segData & 0x01 ? '#ff0000' : '#3f0000');
    this.segB.fill(this.segData & 0x02 ? '#ff0000' : '#3f0000');
    this.segC.fill(this.segData & 0x04 ? '#ff0000' : '#3f0000');
    this.segD.fill(this.segData & 0x08 ? '#ff0000' : '#3f0000');
    this.segE.fill(this.segData & 0x10 ? '#ff0000' : '#3f0000');
    this.segF.fill(this.segData & 0x20 ? '#ff0000' : '#3f0000');
    this.segG.fill(this.segData & 0x40 ? '#ff0000' : '#3f0000');
  }
}

class Disp extends Component {
  constructor(config = null) {
    if (!config)
      config = {
        digits: 12
      };
    
    super(config, [''], 0);
  }

  init() {
    this.ledSVGs = [];

    this.segA = [];
    this.segB = [];
    this.segC = [];
    this.segD = [];
    this.segE = [];
    this.segF = [];
    this.segG = [];
    this.segDOT = [];

    this.segMap = [0x3F, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x67, 0x77, 0x7c, 0x39, 0x5e, 0x79, 0x71];
    this.value = null;

    this.minHeight = 8;
    this.minWidth = Math.round((31.8 * this.config.digits) / 8) + 2;
  }

  onConfigChanged(config) {
    this.construct(config, 1, 0);
    return true;
  }

  drawSymbol(svg) {
    for (var idx = 0; idx < this.config.digits; idx++) {
      var ret = this.draw7Seg(idx);
      svg.add(ret);
    }

    svg.size(31.8 * this.config.digits, 50);
  }

  draw7Seg(idx) {
    var ledSVG = new SVG.G();
    ledSVG.rect(636, 1000).fill('#000');
    this.segA[idx] = ledSVG.path('M 575 138 L 494 211 L 249 211 L 194 137 L 213 120 L 559 120 Z');
    this.segB[idx] = ledSVG.path('M 595 160 L 544 452 L 493 500 L 459 456 L 500 220 L 582 146 Z');
    this.segC[idx] = ledSVG.path('M 525 560 L 476 842 L 465 852 L 401 792 L 441 562 L 491 516 Z');
    this.segD[idx] = ledSVG.path('M 457 860 L 421 892 L 94 892 L 69 864 L 144 801 L 394 801 Z');
    this.segE[idx] = ledSVG.path('M 181 560 L 141 789 L 61 856 L 48 841 L 96 566 L 148 516 Z');
    this.segF[idx] = ledSVG.path('M 241 218 L 200 453 L 150 500 L 115 454 L 166 162 L 185 145 Z');
    this.segG[idx] = ledSVG.path('M 485 507 L 433 555 L 190 555 L 156 509 L 204 464 L 451 464 Z');
    this.segDOT[idx] = ledSVG.circle(92).move(496, 794);

    this.segA[idx].fill('#3f0000');
    this.segB[idx].fill('#3f0000');
    this.segC[idx].fill('#3f0000');
    this.segD[idx].fill('#3f0000');
    this.segE[idx].fill('#3f0000');
    this.segF[idx].fill('#3f0000');
    this.segG[idx].fill('#3f0000');
    this.segDOT[idx].fill('#3f0000');

    ledSVG.scale(0.05,0.05);

    ledSVG.move(idx * 635, 0);

    this.ledSVGs.push(ledSVG);
    return ledSVG;
  }

  fill7Seg(idx, value) {
    var segData = this.segMap[value];

    this.segA[idx].fill(segData & 0x01 ? '#ff0000' : '#3f0000');
    this.segB[idx].fill(segData & 0x02 ? '#ff0000' : '#3f0000');
    this.segC[idx].fill(segData & 0x04 ? '#ff0000' : '#3f0000');
    this.segD[idx].fill(segData & 0x08 ? '#ff0000' : '#3f0000');
    this.segE[idx].fill(segData & 0x10 ? '#ff0000' : '#3f0000');
    this.segF[idx].fill(segData & 0x20 ? '#ff0000' : '#3f0000');
    this.segG[idx].fill(segData & 0x40 ? '#ff0000' : '#3f0000');
  }

  execute(inputs, outputs) {
    this.value = +this.inputs[0].value;
  }

  draw() {
    for (var idx = 0; idx < this.config.digits; idx++) {
      var digit = Math.floor((this.value / Math.pow(10, idx)) % 10);
      this.fill7Seg(this.config.digits - idx - 1, digit);
    }
  }
}

class NOT_Component extends Component {
  constructor(config = null) {
    super(config, 1, 1);
  }

  drawSymbol(svg) {
  }

  execute(inputs, outputs) {
    this.outputs[0].value = !(+this.inputs[0].value); 
  }
}

class AND_Component extends Component {
  init() {
    if (this.config.inputsCount < 2) this.config.inputsCount = 2;
    super.create(+this.config.inputsCount, 1);
  }

  defaultConfig() {
    return {
      inputsCount: 2
    };
  }

  drawSymbol(svg) {
    svg.svg('<path d="M 0 0 Q 16 0 16 8 Q 16 16 0 16 L 0 0 Z"></path>')
      .size(16,16)
      .fill('#cccccc')
      .stroke({ color: '#000', width: 1 });
  }

  execute(inputs, outputs) {
    var res = (Boolean(+this.inputs[0].value) ? true : false);
    for (var idx = 1; idx < this.inputs.length; idx++)
      res = res && (Boolean(+this.inputs[idx].value) ? true : false);
    this.outputs[0].value = res ? 1 : 0; 
  }
}

class NAND_Component extends Component {
  constructor(config = null) {
    var inputsCount = 2;
    if (config)
      inputsCount = config.inputsCount;

    if (inputsCount < 2) inputsCount = 2;
    super(config, inputsCount, 1);
  }

  drawSymbol(svg) {
    svg.svg('<path d="M 0 0 Q 14 0 14 8 Q 14 16 0 16 L 0 0 Z"></path><circle cx="15" cy="8" r="2"></circle>')
      .size(17,16)
      .fill('#cccccc')
      .stroke({ color: '#000', width: 1 });
  }

  execute(inputs, outputs) {
    var res = (Boolean(+this.inputs[0].value) ? true : false);
    for (var idx = 1; idx < this.inputs.length; idx++)
      res = res && (Boolean(+this.inputs[idx].value) ? true : false);
    this.outputs[0].value = !res ? 1 : 0; 
  }
}

class OR_Component extends Component {
  constructor(config = null) {
    var inputsCount = 2;
    if (config)
      inputsCount = config.inputsCount;

    if (inputsCount < 2) inputsCount = 2;
    super(config, inputsCount, 1);
  }

  drawSymbol(svg) {
    svg.svg('<path d="M 0 0 Q 12.8 0 16 8 Q 12.8 16 0 16 Q 3.2 16 3.2 8 Q 3.2 0 0 0 Z"></path>')
      .size(16,16)
      .fill('#cccccc')
      .stroke({ color: '#000', width: 1 });
  }

  execute(inputs, outputs) {
    var res = (Boolean(+this.inputs[0].value) ? true : false);
    for (var idx = 1; idx < this.inputs.length; idx++)
      res = res || (Boolean(+this.inputs[idx].value) ? true : false);
    this.outputs[0].value = res ? 1 : 0; 
  }

  getConfig() {
    return {
      inputsCount: this.inputs.length
    };
  }

  openConfig(e) {
  }
}

class NOR_Component extends Component {
  constructor(config = null) {
  	var inputsCount = 2;
  	if (config)
  		inputsCount = config.inputsCount;

  	if (inputsCount < 2) inputsCount = 2;
    super(config, inputsCount, 1);
  }

  drawSymbol(svg) {
  	svg.svg('<path d="M 0 0 Q 11.2 0 14 8 Q 11.2 16 0 16 Q 2.8 16 2.8 8 Q 2.8 0 0 0 Z"></path><circle cx="15" cy="8" r="2"></circle>')
			.size(17,16)
			.fill('#cccccc')
			.stroke({ color: '#000', width: 1 });
  }

  execute(inputs, outputs) {
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

  openConfig(e) {
  }
}

class XOR_Component extends Component {
  constructor(config = null) {
    var inputsCount = 2;
    if (config)
      inputsCount = config.inputsCount;

    if (inputsCount < 2) inputsCount = 2;
    super(config, inputsCount, 1);
  }

  drawSymbol(svg) {
    svg.svg('<path d="M 3 0 Q 13.4 0 16 8 Q 13.4 16 3 16 Q 5.6 16 5.6 8 Q 5.6 0 3 0 Z"></path><path d="M 0 16 Q 2.6 16 2.6 8 Q 2.6 0 0 0"></path>')
      .size(16,16)
      .fill('#cccccc')
      .stroke({ color: '#000', width: 1 });
  }

  execute(inputs, outputs) {
    var res = (Boolean(+this.inputs[0].value) ? true : false);
    for (var idx = 1; idx < this.inputs.length; idx++)
      res = res ^ (Boolean(+this.inputs[idx].value) ? true : false);
    this.outputs[0].value = res ? 1 : 0; 
  }

  getConfig() {
    return {
      inputsCount: this.inputs.length
    };
  }

  openConfig(e) {
  }
}

class XNOR_Component extends Component {
  constructor(config = null) {
    var inputsCount = 2;
    if (config)
      inputsCount = config.inputsCount;

    if (inputsCount < 2) inputsCount = 2;
    super(config, inputsCount, 1);
  }

  drawSymbol(svg) {
    svg.svg('<path d="M 3 0 Q 11.8 0 14 8 Q 11.8 16 3 16 Q 5.2 16 5.2 8 Q 5.2 0 3 0 Z"></path><path d="M 0 16 Q 2.2 16 2.2 8 Q 2.2 0 0 0"></path><circle cx="16" cy="8" r="2"></circle>')
      .size(16,16)
      .fill('#cccccc')
      .stroke({ color: '#000', width: 1 });
  }

  execute(inputs, outputs) {
    var res = (Boolean(+this.inputs[0].value) ? true : false);
    for (var idx = 1; idx < this.inputs.length; idx++)
      res = res ^ (Boolean(+this.inputs[idx].value) ? true : false);
    this.outputs[0].value = !res ? 1 : 0; 
  }

  getConfig() {
    return {
      inputsCount: this.inputs.length
    };
  }

  openConfig(e) {
  }
}

class SR_Component extends Component {
	constructor() {
    super(config, ['S', 'R'], ['Q']);
  }

  init() {
  	this._c0 = new NOR_Component();
  	this._c1 = new NOR_Component();
  }

  execute(inputs, outputs) {
		this._c0.setIn(0, this.inputs[1].value);
		this._c0.setIn(1, this._c1.getOut(0));
		
		this._c1.setIn(0, this._c0.getOut(0));
		this._c1.setIn(1, this.inputs[0].value);

		this.outputs[0].value = this._c0.getOut(0);
  }
}


class RAM_Component extends Component {
	constructor() {
    super(config, 
    	['Addr', 'CS', 'OE', 'RW'],
    	[],
    	['Data']
    );

		this.minWidth = 10;

    this.ram = Array(Math.pow(2, 16)).fill(0);
    this.ram[0xFFFC] = 0x00;
    this.ram[0xFFFD] = 0x10;

    this.ram[0x1000] = 0xE6;
    this.ram[0x1001] = 0x20;

    this.ram[0x1002] = 0x4C;
    this.ram[0x1003] = 0x00;
    this.ram[0x1004] = 0x10;
  }

  execute(inputs, outputs) {
  	var csPin = +this.CS;
  	var oePin = +this.OE;
  	var rwPin = +this.RW;

  	var addr = +this.Addr;

  	this.outputs[0].value = null;

  	if (csPin) {
  		if (rwPin) {
	  		if (oePin)
          this.outputs[0].value = this.ram[addr];
	  	} else
				this.ram[addr] = +this.inputs[0].value;
  	}
  }
}

class CPU6502_Component extends Component {
	constructor() {
    super(config, 
    	['RST', 'CLK'],
    	['Addr', 'RW'],
    	['Data']
    );

		this.minWidth = 10;

		this.lastRST_state = 0;
		this.lastCLK_state = 0;

		this.cpu = new CPU6502.CPU6502();
    this.cpu.md_component = this;

    this.cpu.read = function(addr) {
    	this.md_component.RW = 1; // Rw
      this.md_component.Addr = addr; // Addr

      simStep();

      var data = +this.md_component.inputs[0].value;
	    return data;
    }

    this.cpu.write = function(addr, value) {
      this.md_component.Addr = addr; // Addr
      this.md_component.outputs[0].value = value;

	  	simStep();

      this.md_component.RW = 0; // wR
    }
  }

  execute(inputs, outputs) {
  	if ((+this.RST == 1) && (this.lastRST_state == 0)){
  		this.lastRST_state = +this.RST;
    	this.cpu.reset();
  	}
  	else
  		this.lastRST_state = +this.RST;

  	if ((+this.CLK == 1) && (this.lastCLK_state == 0)){
  		this.lastCLK_state = +this.CLK;
    	this.cpu.step();
  	}
  	else
  		this.lastCLK_state = +this.CLK;
  }
}


class ToBus_Component extends Component {
	constructor(config = null) {
  	var size = 8;
  	if (config)
  		size = config.size;

  	if (size < 2) size = 2;
    super(config, size, 1);

    for (var idx = 0; idx < size; idx++)
    	this.inputs[idx].name = 'D' + idx;

    this.outputs[0].name = 'Bus';
  }

  execute(inputs, outputs) {
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
    super(config, 1, size);

    this.inputs[0].name = 'Bus';

    for (var idx = 0; idx < size; idx++)
    	this.outputs[idx].name = 'D' + idx;
  }

  execute(inputs, outputs) {
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
    super(config, size, 1);

    for (var idx = 0; idx < size; idx++)
      this.inputs[idx].name = 'D' + idx;

    this.outputs[0].name = 'Bus';
  }

  execute(inputs, outputs) {
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
    super(config, 1, size);

    this.inputs[0].name = 'Bus';

    for (var idx = 0; idx < size; idx++)
      this.outputs[idx].name = 'D' + idx;
  }

  execute(inputs, outputs) {
    var data = this.inputs[0].value;
    for (var idx = 0; idx < this.outputs.length; idx++)
      this.outputs[idx].value = (data >> idx) & 0x01;
  }
}

class PIN_IN extends Component {
  constructor(config = null) {
    super(config, 0, 1);

    this.pinNumber = 0;
    if (config)
      this.pinNumber = config.pinNumber;
  }

  createSVG() {
    super.createSVG();
    this.svgName.text(this.pinNumber.toString());
  }

  createConfigModal() {
    return `
            <div class="form-group">
              <input id="constValue" ng-model="yourName" type="number" class="form-control" placeholder="Value" value="${this.pinNumber}">
            </div>
            `;
  }

  onConfigChanged(config) {
    var value = $('#constValue').val();
    if ((value != null) && (value != "")) {
      this.pinNumber = +value;
      this.svgName.text(this.pinNumber.toString());
    }
    return true;
  }

  getConfig() {
    return {
      pinNumber: this.pinNumber
    };
  }
}

class PIN_OUT extends Component {
  constructor(config = null) {
    super(config, 1, 0);

    this.group = 'Focus';

    this.pinNumber = 0;
    if (config)
      this.pinNumber = config.pinNumber;
  }

  createSVG() {
    super.createSVG();
    this.svgName.text(this.pinNumber.toString());
  }

  createConfigModal() {
    return `
            <div class="form-group">
              <input id="constValue" ng-model="yourName" type="number" class="form-control" placeholder="Value" value="${this.pinNumber}">
            </div>
            `;
  }

  onConfigChanged(config) {
    var value = $('#constValue').val();
    if ((value != null) && (value != "")) {
      this.pinNumber = +value;
      this.svgName.text(this.pinNumber.toString());
    }
    return true;
  }

  getConfig() {
    return {
      pinNumber: this.pinNumber
    };
  }
}



class ToObject extends Component {
  constructor(config = null) {
    if (!config)
      config = {
        fields: ''
      };
    
    super(config, 0, 1);

    this.minWidth = 5;
  }

  execute(inputs, outputs) {
    var ret = {};
    for (var key in inputs)
      ret[key] = inputs[key];
    outputs[0] = ret;
  }

  onConfigChanged(config) {
    this.construct(config, config.fields.split(','), 1);
    return true;
  }
}


class FromObject extends Component {
  constructor(config = null) {
    super(config, 1, 0);

    this.minWidth = 5;

    this.fields = '';
    if (config) {
      this.fields = config.fields;
      this.construct(1, this.fields.split(','));
    }
  }

  execute(inputs, outputs) {
    for (var key in outputs)
      outputs[key] = inputs[0][key];
  }

  getConfig() {
    return {
      fields: this.fields
    };
  }

  createConfigModal() {
    return `
            <div class="form-group">
              <input id="ToObjFields" type="text" class="form-control" placeholder="Fields" value="${this.fields}">
            </div>
            `;
  }

  onConfigChanged(config) {
    var fields = $('#ToObjFields').val();
    if ((fields != null) && (fields != "")) {
      this.fields = fields;
      this.construct(1, fields.split(','));
    }
    return true;
  }
}

class Repeat extends Component {
  constructor(config = null) {
    super(config, [ 'item', 'times' ], 1);

    this.minWidth = 5;
  }

  execute(inputs, outputs) {
    if (inputs.item) {
      if (inputs.item instanceof Object)
        outputs[0] = new Array(+inputs.times).fill(null).map(()=> (Object.assign({}, inputs.item)));
      else
        outputs[0] = new Array(+inputs.times).fill(null).map(()=> (inputs.item));
    } else
      outputs[0] = Array.apply(null, {length: +inputs.times}).map(Number.call, Number);
  }
}

class CONSOLE extends Component {
  constructor(config = null) {
    super(config, 1, 0);

    this.minWidth = 5;
    this.canRepeat = false;
  }

  execute(inputs, outputs) {
    if (inputs[0])
      console.log(inputs[0]);
  }
}

/* Math */
class Add extends Component {
  constructor(config = null) {
    super(config, 2, 1);

    this.minWidth = 5;
  }

  execute(inputs, outputs) {
    var ret = 0;
    for (var idx in inputs)
      ret += +inputs[idx];
    outputs[0] = ret;
  }
}


/* REST */
class GET_Component extends Component {
  constructor(config = null) {
    super(config, 1, [ 'data', 'status' ]);

    this.minHeight = 3;
    this.oldInput = 0;

    this.value = '';
    if (config)
      this.value = config.value;
  }

  execute(inputs, outputs) {
    var exeInput = this.inputs[0].value;

    if (exeInput && !this.oldInput)
      $.get(this.value).then(t => this.data = t);
    else
      if (!exeInput)
        this.data = null;
    
    this.oldInput = exeInput;
  }

  createConfigModal() {
    return `
            <div class="form-group">
              <input id="constValue" type="text" class="form-control" placeholder="Value" value="${this.value}">
            </div>
            `;
  }

  onConfigChanged(config) {
    var value = $('#constValue').val();
    if ((value != null) && (value != "")) {
      this.value = value;
      this.valueSVG.text(this.value.toString());
    }
    return true;
  }

  drawBody(wpx, hpx) {
    this.svgBody = this.svg.rect(wpx, hpx)
      .radius(2)
      .move(0, 0)
      .fill('#cccccc')
      .stroke({ color: '#666666', width: 2 });

    this.valueSVG = this.svg
      .text(this.value.toString())
      .font({
              family:   'Menlo'
            , size:     12
            , anchor:   'middle'
            })
      .move(wpx / 2, 0);
  }

  getConfig() {
    return {
      value: this.value
    };
  }
}


/* Groups */
CONST.group = 'MessyDesk';
INPUT.group = 'MessyDesk';
OUTPUT.group = 'MessyDesk';
CONSOLE.group = 'MessyDesk';
ToObject.group = 'MessyDesk';
FromObject.group = 'MessyDesk';
Repeat.group = 'MessyDesk';

Add.group = 'Math';

LED.group = 'Leds';
Disp.group = 'Leds';
Disp_7Seg.group = 'Leds';
BCD_7Seg.group = 'Leds';

TRI_Component.group = 'Gates';
NOT_Component.group = 'Gates';
AND_Component.group = 'Gates';
NAND_Component.group = 'Gates';
OR_Component.group = 'Gates';
NOR_Component.group = 'Gates';
XOR_Component.group = 'Gates';
XNOR_Component.group = 'Gates';

PIN_IN.group = 'Focus Board';
PIN_OUT.group = 'Focus Board';

GET_Component.group = 'HTTP';

var toolbox = {
  'CONST': CONST,
  'INPUT': INPUT,
  'OUTPUT': OUTPUT,
  'CONSOLE': CONSOLE,
  'ToObject': ToObject,
  'FromObject': FromObject,
  'Repeat': Repeat,

  'Add': Add,

  'TOGGLE': TOGGLE,
  'BUTTON': BUTTON,
  'CLOCK': CLOCK,
  'R_TRIG': R_TRIG,
  
  'LED': LED,
  'Disp': Disp,
  'Disp_7Seg': Disp_7Seg,
  'BCD_7Seg': BCD_7Seg,

  'NOT_Component': NOT_Component,
  'AND_Component': AND_Component,
  'NAND_Component': NAND_Component,
  'OR_Component': OR_Component,
  'NOR_Component': NOR_Component,
  'XOR_Component': XOR_Component,
  'XNOR_Component': XNOR_Component,
  'TRI_Component': TRI_Component,

  'SR_Component': SR_Component,
  'RAM_Component': RAM_Component,
  'CPU6502_Component': CPU6502_Component,

  'ToBus_Component': ToBus_Component,
  'FromBus_Component': FromBus_Component,
  'BIN2DEC_Component': BIN2DEC_Component,
  'DEC2BIN_Component': DEC2BIN_Component,

  'PIN_IN': PIN_IN,
  'PIN_OUT': PIN_OUT,

  'GET': GET_Component
};
var toolbox_original = Object.assign({}, toolbox);

drawGroupedToolbox();
