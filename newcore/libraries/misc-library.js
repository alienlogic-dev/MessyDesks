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
    this.minWidth = 5;
    this.minHeight = 5;

    this.ledSVG = null;

    this.create({ left: ['_I'] });
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
    this.minWidth = 5;
    this.minHeight = 5;

    this.value = false;

    this.btnSVG = null;

    this.create({ right: ['_Q'] });
    this.writePin('Q', this.value);
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

toolbox['CONST'] = CONST;
toolbox['LED'] = LED;
toolbox['TOGGLE'] = TOGGLE;