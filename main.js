
class Pin {
	constructor(name, isInput = true) {
		this.name = name;
		this.isInput = isInput;
		this.width = Math.round(name.length / 3);
	}
}

class Component {
	constructor(inputsCount, outputsCount) {
		this.minWidth = 5;
		this.minHeight = 2;

		this.inputs = [];
		for (var i = 0; i < inputsCount; i++)
			this.inputs.push(new Pin('', true));

		this.outputs = [];
		for (var i = 0; i < outputsCount; i++)
			this.outputs.push(new Pin('', false));

		this.createSVG();
  }

  createSVG() {
  	var w = this.minWidth;
  	var wpx = w * 8;

  	var h = Math.max(this.minHeight, Math.max(this.inputs.length * 2, this.outputs.length * 2));
  	var hpx = h * 8;

  	this.svg = new SVG.G();
		this.svg.rect(wpx, hpx)
			.radius(2)
			.move(0, 0)
			.fill('#cccccc')
			.stroke({ color: '#666666', width: 2 });

		this.svg.draggable({snapToGrid: 8});

		var inStepSize = hpx / this.inputs.length;
		for (var i = this.inputs.length - 1; i >= 0; i--) {
			var item = this.inputs[i];
			this.svg
				.circle(8)
				.move(-4, (inStepSize * i) + (inStepSize / 2) - 4)
				.fill('#ffcc00')
				.stroke({ color: '#000', width: 1 });
			this.svg
				.text(item.name)
				.font({
							  family:   'Menlo'
							, size:     9
							, anchor:   'start'
							})
				.move(6, (inStepSize * i) + (inStepSize / 2) - 6);
		}

		var outStepSize = hpx / this.outputs.length;
		for (var i = this.outputs.length - 1; i >= 0; i--) {
			var item = this.outputs[i];
			this.svg
				.circle(8)
				.move(wpx - 4, (outStepSize * i) + (outStepSize / 2) - 4)
				.fill('#fff')
				.stroke({ color: '#000', width: 1 });
			this.svg
				.text(item.name)
				.font({
							  family:   'Menlo'
							, size:     9
							, anchor:   'end'
							})
				.move(wpx - 6, (outStepSize * i) + (outStepSize / 2) - 6);
		}

		var symbolSVG = new SVG.G();
		this.drawSymbol(symbolSVG);
		symbolSVG.move((wpx / 2) - (symbolSVG.width() / 2), (hpx / 2) - (symbolSVG.height() / 2));
		this.svg.add(symbolSVG);
  }

  drawSymbol(svg) { }
}

class NOR_Component extends Component {
  constructor(inputsCount = 2) {
  	if (inputsCount < 2) inputsCount = 2;
    super(inputsCount, 1);

		this.createSVG();
  }

  drawSymbol(svg) {
  	svg.svg('<path d="M 0 0 Q 11.2 0 14 8 Q 11.2 16 0 16 Q 2.8 16 2.8 8 Q 2.8 0 0 0 Z"></path><circle cx="15" cy="8" r="2"></circle>')
			.size(17,16)
			.fill('#cccccc')
			.stroke({ color: '#000', width: 1 });
  }
}


// initialize SVG.js
var draw = SVG('drawing').size(1024, 1024);

for (x = 0; x < 128; x++)
	draw.line(x*8, 0, x*8, 1024).stroke({ opacity: 0.1, width: 1 });

for (y = 0; y < 128; y++)
	draw.line(0, y*8, 1024, y*8).stroke({ opacity: 0.1, width: 1 });

var test = new NOR_Component();
var test2 = new NOR_Component(5);

draw.add(test.svg);
draw.add(test2.svg);
