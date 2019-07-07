
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

SN74138_Component.group = 'TTL ICs';
SN74151_Component.group = 'TTL ICs';
SN74154_Component.group = 'TTL ICs';
SN74163_Component.group = 'TTL ICs';
SN74181_Component.group = 'TTL ICs';
SN74244_Component.group = 'TTL ICs';

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
  'Pulse': Pulse,
  
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

  'GET': GET_Component,

  'SN74138_Component': SN74138_Component,
  'SN74151_Component': SN74151_Component,
  'SN74154_Component': SN74154_Component,
  'SN74163_Component': SN74163_Component,
  'SN74181_Component': SN74181_Component,
  'SN74244_Component': SN74244_Component,
};
var toolbox_original = Object.assign({}, toolbox);

drawGroupedToolbox();
