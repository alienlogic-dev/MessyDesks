// 3-to-8 Decoder
class SN74138_Component extends Component {
  create() {
    super.create(['A0', 'A1', 'A2', '!E1', '!E2', 'E3'], ['!Y0', '!Y1', '!Y2', '!Y3', '!Y4', '!Y5', '!Y6', '!Y7']);
  }

  execute(inputs, outputs) {
    var e1 = inputs['!E1'];
    var e2 = inputs['!E2'];
    var e3 = inputs['E3'];

    var a0 = inputs['A0'];
    var a1 = inputs['A1'];
    var a2 = inputs['A2'];
    var a = (a0 ? 1 : 0) | (a1 ? 2 : 0) | (a2 ? 4 : 0);

    var o = 255;

    if (!e1 && !e2 && e3)
      o = ~(1 << a) & 0xFF;
    else
      o = 255;

    for (var i = 0; i < 8; i++)
      outputs['!Y' + i] = o & (1 << i);
  }
}

// 8-to-1 Mux
class SN74151_Component extends Component {
  create() {
    super.create(['S0', 'S1', 'S2', '!E', 'I0', 'I1', 'I2', 'I3', 'I4', 'I5', 'I6', 'I7'], ['!Z', 'Z']);
  }

  execute(inputs, outputs) {
    var e = inputs['!E'];

    var s0 = inputs['S0'];
    var s1 = inputs['S1'];
    var s2 = inputs['S2'];
    var s = (s0 ? 1 : 0) | (s1 ? 2 : 0) | (s2 ? 4 : 0);

    var i = 0;
    for (var j = 0; j < 8; j++)
      i |= inputs['I' + j] ? (1 << j) : 0;

    var r = i & (1 << s);

    if (!e)
      r = 0;

    outputs['!Z'] = !r;
    outputs['Z'] = r;
  }
}

// 4-to-16 Decoder
class SN74154_Component extends Component {
  create() {
    var o = [];
    for (var i = 0;i < 16; i++)
      o.push('!O' + i);
    super.create(['A', 'B', 'C', 'D', '!G1', '!G2'], o);
  }

  execute(inputs, outputs) {
    var g1 = inputs['!G1'];
    var g2 = inputs['!G2'];

    var b0 = inputs['A'];
    var b1 = inputs['B'];
    var b2 = inputs['C'];
    var b3 = inputs['D'];
    var b = (b0 ? 1 : 0) | (b1 ? 2 : 0) | (b2 ? 4 : 0) | (b3 ? 8 : 0);

    var r = 0xFFFF;

    if (!g1 && !g2)
      r = ~(1 << b) & 0xFFFF;

    for (var i = 0; i < 16; i++)
      outputs['!O' + i] = r & (1 << i);
  }
}

// 4-bit Counter
class SN74163_Component extends Component {
  create() {
    super.create(['Clk', '!Clr', '!Load', 'EnP', 'EnT', 'Pa', 'Pb', 'Pc', 'Pd'], ['Qa', 'Qb', 'Qc', 'Qd', 'Carry']);
    this.clkOld = false;
    this.cnt = 0;
  }

  execute(inputs, outputs) {
    var clk = inputs['Clk'];
    var clr = inputs['!Clr'];
    var load = inputs['!Load'];
    var enp = inputs['EnP'];
    var ent = inputs['EnT'];

    var p0 = inputs['Pa'];
    var p1 = inputs['Pb'];
    var p2 = inputs['Pc'];
    var p3 = inputs['Pd'];
    var p = (p0 ? 1 : 0) | (p1 ? 2 : 0) | (p2 ? 4 : 0) | (p3 ? 8 : 0);

    if (clk && !this.clkOld) {
      if (enp && ent)
        this.cnt++;

      if (!clr)
        this.cnt = 0;
      if (!load)
        this.cnt = p;
    }

    this.cnt &= 0x0F;

    outputs['Qa'] = (this.cnt & 0x01) > 0;
    outputs['Qb'] = (this.cnt & 0x02) > 0;
    outputs['Qc'] = (this.cnt & 0x04) > 0;
    outputs['Qd'] = (this.cnt & 0x08) > 0;
    outputs['Carry'] = (this.cnt == 15);

    this.clkOld = clk;
  }
}

// 4-bit ALU
class SN74181_Component extends Component {
  create() {
    super.create([
      '!A0', '!A1', '!A2', '!A3',
      '!B0', '!B1', '!B2', '!B3', 
      'S0', 'S1', 'S2', 'S3', 
      'Cn', 'M'
    ], [
      '!F0', '!F1', '!F2', '!F3',
      'A=B',
      '!P',
      '!G',
      'Cn+4'
    ]);
  }

  execute(inputs, outputs) {
    var a0 = inputs['!A0'] ? 1 : 0;
    var a1 = inputs['!A1'] ? 1 : 0;
    var a2 = inputs['!A2'] ? 1 : 0;
    var a3 = inputs['!A3'] ? 1 : 0;

    var b0 = inputs['!B0'] ? 1 : 0;
    var b1 = inputs['!B1'] ? 1 : 0;
    var b2 = inputs['!B2'] ? 1 : 0;
    var b3 = inputs['!B3'] ? 1 : 0;

    var s0 = inputs['S0'] ? 1 : 0;
    var s1 = inputs['S1'] ? 1 : 0;
    var s2 = inputs['S2'] ? 1 : 0;
    var s3 = inputs['S3'] ? 1 : 0;

    var cp = inputs['Cn'] ? 1 : 0;
    var mp = inputs['M'] ? 0 : 1;

    var ap0 = !(a0 | (b0 & s0) | (s1 & !b0));
    var bp0 = !(((!b0) & s2 & a0) | (a0 & b0 & s3));
    var ap1 = !(a1 | (b1 & s0) | (s1 & !b1));
    var bp1 = !(((!b1) & s2 & a1) | (a1 & b1 & s3));
    var ap2 = !(a2 | (b2 & s0) | (s1 & !b2));
    var bp2 = !(((!b2) & s2 & a2) | (a2 & b2 & s3));
    var ap3 = !(a3 | (b3 & s0) | (s1 & !b3));
    var bp3 = !(((!b3) & s2 & a3) | (a3 & b3 & s3));
  
    var fp0 = !(cp & mp) ^ ((!ap0) & bp0);
    var fp1 = (!((mp & ap0) | (mp & bp0 & cp))) ^ ((!ap1) & bp1);
    var fp2 = (!((mp & ap1) | (mp & ap0 & bp1) | (mp & cp & bp0 & bp1))) ^ ((!ap2) & bp2);
    var fp3 = (!((mp & ap2) | (mp & ap1 & bp2) | (mp & ap0 & bp1 & bp2) | (mp & cp & bp0 & bp1 & bp2))) ^ ((!ap3) & bp3);
  
    var aeqb = fp0 & fp1 & fp2 & fp3;
    var pp = !(bp0 & bp1 & bp2 & bp3);
    var gp = !((ap0 & bp1 & bp2 & bp3) | (ap1 & bp2 & bp3) | (ap2 & bp3) | ap3);
    var cn4 = (!(cp & bp0 & bp1 & bp2 & bp3)) | gp;

    outputs['!F0'] = fp0;
    outputs['!F1'] = fp1;
    outputs['!F2'] = fp2;
    outputs['!F3'] = fp3;
    outputs['A=B'] = aeqb;
    outputs['!P'] = pp;
    outputs['!G'] = gp;
    outputs['Cn+4'] = cn4;
  }
}

// 8× 3-state Buffer
class SN74244_Component extends Component {
  create() {
    var inputs = [];
    var outputs = [];

    for (var j = 1; j <= 2; j++) {
      for (var i = 1; i <= 4; i++) {
        inputs.push(j + 'A' + i);
        outputs.push(j + 'Y' + i);
      }
      inputs.push('!' + j + 'G');
    }

    super.create(inputs, outputs);
  }

  execute(inputs, outputs) {
    for (var j = 1; j <= 2; j++) {
      var g = inputs['!' + j + 'G'];
      for (var i = 1; i <= 4; i++) {
        var idx = Object.keys(outputs).indexOf(j + 'Y' + i);
        this.outputs[idx].value = !g ? inputs[j + 'A' + i] : null;
        outputs[j + 'Y' + i] = null;
      }
    }
  }
}

// 8-bit register
class SN74374_Component extends Component {
  create() {
    if (this.config.inputsCount < 2) this.config.inputsCount = 2;
    super.create(+this.config.inputsCount, 1);
  }

  defaultConfig() {
    return {
      inputsCount: 2
    };
  }

  execute(inputs, outputs) {
    var res = (Boolean(+this.inputs[0].value) ? true : false);
    for (var idx = 1; idx < this.inputs.length; idx++)
      res = res && (Boolean(+this.inputs[idx].value) ? true : false);
    this.outputs[0].value = res ? 1 : 0;
  }
}

// 8-bit register
class SN74377_Component extends Component {
  create() {
    if (this.config.inputsCount < 2) this.config.inputsCount = 2;
    super.create(+this.config.inputsCount, 1);
  }

  defaultConfig() {
    return {
      inputsCount: 2
    };
  }

  execute(inputs, outputs) {
    var res = (Boolean(+this.inputs[0].value) ? true : false);
    for (var idx = 1; idx < this.inputs.length; idx++)
      res = res && (Boolean(+this.inputs[idx].value) ? true : false);
    this.outputs[0].value = res ? 1 : 0;
  }
}
