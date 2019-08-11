class INPUT extends Component {
  init() {
    this.create({
      right: ['_Q']
    });

    this.value = null;
  }

  initGUI() {
    this.minWidth = 5;
  }

  defaultConfig() {
    return { alias: '', side: 'left' };
  }

  execute(actual) {
    return { 'Q': this.value };
  }

  setValue(value) {
    this.value = value;
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
  init() {
    this.create({
      left: ['_I']
    });

    this.value = null;
  }

  initGUI() {
    this.minWidth = 5;
  }
  
  defaultConfig() {
    return { alias: '' };
  }

  execute(actual) {
    this.value = actual.left['I'];
    return null;
  }

  getValue() {
    return this.value;
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

class CONST extends Component {
  init() {
    this.create({
      right: ['Q']
    })
  }

  defaultConfig() {
    return { value: null };
  }

  execute(actual) {
    return { 'Q': this.config.value };
  }

  forceValue(value) {
    this.config.value = value;
  }
}

class LED extends Component {
  init() {
    this.create({ left: ['_I'] });
  }

  initGUI() {
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

  draw() {
    if (+this.readPin('I'))
      this.ledSVG.fill('#ff0000').stroke({ color: '#cc0000', width: 2 });
    else
      this.ledSVG.fill('#3f0000').stroke({ color: '#330000', width: 2 });
  }
}


class TOGGLE extends Component {
  init() {
    this.value = false;

    this.create({ right: ['_Q'] });
    this.writePin('Q', this.value);
  }

  initGUI() {
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
  }
  mouseUpEvent(e) {
    this.btnSVG.fill('#ccc');
    this.value = !this.value;
    this.writePin('Q', this.value);
  }
  mouseDblClickEvent(e) { return true; }
}

toolbox['INPUT'] = INPUT;
toolbox['OUTPUT'] = OUTPUT;
toolbox['CONST'] = CONST;
toolbox['LED'] = LED;
toolbox['TOGGLE'] = TOGGLE;