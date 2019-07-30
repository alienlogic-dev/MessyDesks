
class AND extends Component {
  init() {
    var n = this.config.pinCount;
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
    this.debug(actual);

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
    var n = this.config.pinCount;
    if (n < 2) n = 2;

    this.create({
      left: [{ prefix: '', count: n }],
      right: ['Q']
    })
  }

  defaultConfig() {
    return { pinCount: 2 };
  }

  execute(actual) {
    this.debug(actual);

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

toolbox['AND'] = AND;
toolbox['NAND'] = NAND;
