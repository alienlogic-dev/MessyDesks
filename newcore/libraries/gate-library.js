
class AND extends Component {
  init() {
    var n = this.config.pinCount || 2;
    if (n < 2) n = 2;

    this.create({
      left: [{ prefix: '_', count: n }],
      right: ['_Q']
    })
  }

  defaultConfig() {
    return { pinCount: 2 };
  }

  execute(actual) {
    var ret = true;
    for (var i in actual.left)
      ret = ret && (actual.left[i] || false);

    return { 'Q': ret }
  }

  drawSymbol(svg) {
    svg.svg('<path d="M 0 0 Q 16 0 16 8 Q 16 16 0 16 L 0 0 Z"></path>')
      .size(16,16)
      .fill('#cccccc')
      .stroke({ color: '#000', width: 1 });
  }
}

class NAND extends Component {
  init() {
    var n = this.config.pinCount || 2;
    if (n < 2) n = 2;

    this.create({
      left: [{ prefix: '_', count: n }],
      right: ['_Q']
    })
  }

  defaultConfig() {
    return { pinCount: 2 };
  }

  execute(actual) {
    var ret = true;
    for (var i in actual.left)
      ret = ret && (actual.left[i] || false);

    return { 'Q': !ret }
  }

  drawSymbol(svg) {
    svg.svg('<path d="M 0 0 Q 14 0 14 8 Q 14 16 0 16 L 0 0 Z"></path><circle cx="15" cy="8" r="2"></circle>')
      .size(17,16)
      .fill('#cccccc')
      .stroke({ color: '#000', width: 1 });
  }
}

class OR extends Component {
  init() {
    var n = this.config.pinCount || 2;
    if (n < 2) n = 2;

    this.create({
      left: [{ prefix: '_', count: n }],
      right: ['_Q']
    })
  }

  defaultConfig() {
    return { pinCount: 2 };
  }

  execute(actual) {
    var ret = false;
    for (var i in actual.left)
      ret = ret || (actual.left[i] || false);

    return { 'Q': ret }
  }

  drawSymbol(svg) {
    svg.svg('<path d="M 0 0 Q 12.8 0 16 8 Q 12.8 16 0 16 Q 3.2 16 3.2 8 Q 3.2 0 0 0 Z"></path>')
      .size(16,16)
      .fill('#cccccc')
      .stroke({ color: '#000', width: 1 });
  }
}

class NOR extends Component {
  init() {
    var n = this.config.pinCount || 2;
    if (n < 2) n = 2;

    this.create({
      left: [{ prefix: '_', count: n }],
      right: ['_Q']
    })
  }

  defaultConfig() {
    return { pinCount: 2 };
  }

  execute(actual) {
    var ret = false;
    for (var i in actual.left)
      ret = ret || (actual.left[i] || false);

    return { 'Q': !ret }
  }

  drawSymbol(svg) {
  	svg.svg('<path d="M 0 0 Q 11.2 0 14 8 Q 11.2 16 0 16 Q 2.8 16 2.8 8 Q 2.8 0 0 0 Z"></path><circle cx="15" cy="8" r="2"></circle>')
			.size(17,16)
			.fill('#cccccc')
			.stroke({ color: '#000', width: 1 });
  }
}

class XOR extends Component {
  init() {
    var n = this.config.pinCount || 2;
    if (n < 2) n = 2;

    this.create({
      left: [{ prefix: '_', count: n }],
      right: ['_Q']
    })
  }

  defaultConfig() {
    return { pinCount: 2 };
  }

  execute(actual) {
    var ret = null;
    for (var i in actual.left) {
      if (ret == null)
        ret = actual.left[i] || false;
      else
        ret = ret ^ (actual.left[i] || false);
    }

    return { 'Q': ret }
  }

  drawSymbol(svg) {
    svg.svg('<path d="M 3 0 Q 13.4 0 16 8 Q 13.4 16 3 16 Q 5.6 16 5.6 8 Q 5.6 0 3 0 Z"></path><path d="M 0 16 Q 2.6 16 2.6 8 Q 2.6 0 0 0"></path>')
      .size(16,16)
      .fill('#cccccc')
      .stroke({ color: '#000', width: 1 });
  }
}

class XNOR extends Component {
  init() {
    var n = this.config.pinCount || 2;
    if (n < 2) n = 2;

    this.create({
      left: [{ prefix: '_', count: n }],
      right: ['_Q']
    })
  }

  defaultConfig() {
    return { pinCount: 2 };
  }

  execute(actual) {
    var ret = null;
    for (var i in actual.left) {
      if (ret == null)
        ret = actual.left[i] || false;
      else
        ret = ret ^ (actual.left[i] || false);
    }

    return { 'Q': !ret }
  }

  drawSymbol(svg) {
    svg.svg('<path d="M 3 0 Q 11.8 0 14 8 Q 11.8 16 3 16 Q 5.2 16 5.2 8 Q 5.2 0 3 0 Z"></path><path d="M 0 16 Q 2.2 16 2.2 8 Q 2.2 0 0 0"></path><circle cx="16" cy="8" r="2"></circle>')
      .size(16,16)
      .fill('#cccccc')
      .stroke({ color: '#000', width: 1 });
  }
}

class TRISTATE extends Component {
  init() {
    this.create({
      left: ['A', '!G'],
      right: ['Y']
    })
  }

  execute(actual) {
    return { 'Y': actual.left.G ? null : actual.left.A }
  }
}

toolbox['AND'] = AND;
toolbox['NAND'] = NAND;
toolbox['OR'] = OR;
toolbox['NOR'] = NOR;
toolbox['XOR'] = XOR;
toolbox['XNOR'] = XNOR;
toolbox['TRISTATE'] = TRISTATE;
