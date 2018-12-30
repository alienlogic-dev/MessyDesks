CONST.cpp =
`class CONST: public Component {
  public:
    CONST(uint32_t value) : Component(0, 1) {
    	outValue = value;
    }

    uint32_t outValue;

    void execute() {
      outputsData[0] = outValue;
      this->outputs[0] = &outputsData[0];
    }
};`;

NOR_Component.cpp = 
`class NOR_Component: public Component {
  public:
    NOR_Component() : Component(2, 1) {}
    NOR_Component(int inputsCount) : Component((inputsCount > 2 ? inputsCount : 2), 1) {}

    void execute() {
    	uint32_t res = 0;
    	if (inputs[0]) {
				res = *inputs[0];
        for (int idx = 1; idx < inCount; idx++)
        	if (inputs[idx])
          	res = res || *inputs[idx];
    	}
      outputsData[0] = !res;
      this->outputs[0] = &outputsData[0];
    }
};`;

BIN2DEC_Component.cpp = 
`class BIN2DEC_Component: public Component {
  public:
    BIN2DEC_Component() : Component(8, 1) {}
    BIN2DEC_Component(int size) : Component((size > 2 ? size : 2), 1) {}

    void execute() {
        uint32_t data = 0;
        for (int idx = 0; idx < inCount; idx++)
        	if (inputs[idx])
            data = data | ((*inputs[idx]) ? (1 << idx) : 0);

        outputsData[0] = data;
        this->outputs[0] = &outputsData[0];
    }
};`;

DEC2BIN_Component.cpp = 
`class DEC2BIN_Component: public Component {
  public:
    DEC2BIN_Component() : Component(1, 8) {}
    DEC2BIN_Component(int size) : Component(1, (size > 2 ? size : 2)) {}

    void execute() {
    	if (inputs[0]) {
        uint32_t data = *inputs[0];
        for (int idx = 0; idx < outCount; idx++) {
          outputsData[idx] = (data >> idx) & 0x01;
        	this->outputs[idx] = &outputsData[idx];
        }
    	}
    }
};`;

TRI_Component.cpp = 
`class TRI_Component: public Component {
  public:
    TRI_Component() : Component(3, 1) {}

    void execute() {
    	uint32_t *res = NULL;
    	if (inputs[2]) {
    		if (*inputs[2])
    			res = inputs[1];
    	}
      this->outputs[0] = res;
    }
};`;

R_TRIG.cpp =
`class R_TRIG: public Component {
  public:
    R_TRIG() : Component(1, 1) {
    	lastValue = 0;
    }

    uint32_t lastValue;

    void execute() {
    	uint32_t val = 0;
    	if (inputs[0])
    		val = *inputs[0];

      outputsData[0] = (val != lastValue) && (val == 1);
      this->outputs[0] = &outputsData[0];

      lastValue = val;
    }
};`;

BUTTON.cpp =
`class BUTTON: public Component {
  public:
    BUTTON() : Component(0, 0) {}
};`;

BCD_7Seg.cpp = 
`class BCD_7Seg: public Component {
  public:
    BCD_7Seg() : Component(0, 0) {}
};`;

class cpp_compiler {
	static framework () {
		return `
unsigned int cycIdx = 0;
class Component {
  public:
    Component(int inputsCount, int outputsCount) {
      inCount = inputsCount;  
      outCount = outputsCount;

      inputs = new uint32_t*[inputsCount];
      for (int idx = 0; idx < inCount; idx++)
      	inputs[idx] = NULL;

      outputs = new uint32_t*[outputsCount];
      for (int idx = 0; idx < outputsCount; idx++)
      	outputs[idx] = NULL;

      outputsData = new uint32_t[outputsCount];

      exeIdx = 0;
    }

    int inCount, outCount;
    uint32_t** inputs;
    uint32_t* outputsData;
    uint32_t** outputs;

    unsigned int exeIdx;

    void setIn(int index, uint32_t* value) {
    	if (value)
        inputs[index] = value;
    }

    uint32_t* getOut(int index) {
      if (cycIdx > exeIdx) {
        execute();
        for (int idx = 0; idx < inCount; idx++)
        	inputs[idx] = NULL;
        exeIdx = cycIdx;   
      }
      return outputs[index];
    }

    virtual void execute() {}
};
`;
	}

	static compileSource(componentName, source) {
		var compiledCode = [];

		compiledCode.push(`class ${componentName} : public Component {`);

		// Create constructor
		compiledCode.push('\tpublic:');

		// Create instances
		var compiledDefsCode = [];
		var compiledInstancesCode = [];
		var aliases = {};

		var inputPinIndex = 0;
		var outputPinIndex = 0;
		for (var idx = 0; idx < source.components.length; idx++) {
			var componentItem = source.components[idx];
			var instanceName = componentItem.id;

			if (componentItem.name == 'INPUT') {
				instanceName = inputPinIndex++;
			} else if (componentItem.name == 'OUTPUT') {
				instanceName = outputPinIndex++;
			} else {
				compiledDefsCode.push(`\t\t${componentItem.name} ${instanceName};`);
				if (componentItem.config)
					compiledInstancesCode.push(`${instanceName}(${Object.values(componentItem.config).join(',')})`);
			}

			aliases[componentItem.id] = instanceName;
		}

		// Count inputs and outputs
		var inputPinCount = 0;
		var inputAliases = [];
		var outputPinCount = 0;
		var outputAliases = [];
		for (var idx = 0; idx < source.components.length; idx++) {
			var componentItem = source.components[idx];

			if (componentItem.name == 'INPUT') {
				if (componentItem.config) inputAliases.push(componentItem.config.alias); else inputAliases.push('');
				inputPinCount++
			} else if (componentItem.name == 'OUTPUT') {
				if (componentItem.config) outputAliases.push(componentItem.config.alias); else outputAliases.push('');
				outputPinCount++;
			}
		}
		compiledCode.push(`\t\t${componentName}() : Component(${inputAliases.length}, ${outputAliases.length}) ${compiledInstancesCode.length ? ', ' : ''} ${compiledInstancesCode.join(', ')} {}`);

		// Connect wires
		compiledCode.push('\t\tvoid execute() {');
		var wires = source.wires.slice(0);

		// Inputs
		for (var idx = 0; idx < wires.length; idx++) {
			var wireItem = wires[idx];
			if (wireItem) {
				var pinI = wireItem.I;
				var componentI = source.components.filter(t => t.id == pinI.component)[0];

				var pinO = wireItem.O;
				var componentO = source.components.filter(t => t.id == pinO.component)[0];

				if (componentO.name == 'INPUT') {
					var	outCode = `inputs[${aliases[componentO.id]}]`;

					var inCode = `${aliases[pinI.component]}.setIn(${pinI.pin}, ${outCode})`;

					if (componentI.name == 'OUTPUT')
						inCode = `outputs[${aliases[componentI.id]}] = ${outCode}`;

					compiledCode.push( '\t\t\t' + inCode + ';' );

					wires[idx] = null;
				}
			}
		}

		// Normal
		for (var idx = 0; idx < wires.length; idx++) {
			var wireItem = wires[idx];
			if (wireItem) {
				var pinI = wireItem.I;
				var componentI = source.components.filter(t => t.id == pinI.component)[0];

				var pinO = wireItem.O;
				var componentO = source.components.filter(t => t.id == pinO.component)[0];

				if ((componentI.name != 'OUTPUT') && (componentI.name != 'OUTPUT')) {
					var outCode = `${aliases[pinO.component]}.getOut(${pinO.pin})`;

					var inCode = `${aliases[pinI.component]}.setIn(${pinI.pin}, ${outCode})`;

					compiledCode.push( '\t\t\t' + inCode + ';' );

					wires[idx] = null;
				}			
			}
		}

		// Outputs
		for (var idx = 0; idx < wires.length; idx++) {
			var wireItem = wires[idx];
			if (wireItem) {
				var pinI = wireItem.I;
				var componentI = source.components.filter(t => t.id == pinI.component)[0];

				var pinO = wireItem.O;
				var componentO = source.components.filter(t => t.id == pinO.component)[0];


				if (componentI.name == 'OUTPUT') {
					var outCode = `${aliases[pinO.component]}.getOut(${pinO.pin})`;

					if (componentO.name == 'INPUT')
						outCode = `inputs[${aliases[componentO.id]}]`;

					var inCode = `outputs[${aliases[componentI.id]}] = ${outCode}`;

					compiledCode.push( '\t\t\t' + inCode + ';' );

					wires[idx] = null;
				}			
			}
		}

		if (wires.filter(t => t != null).length > 0)
			console.error('Something went wrong compiling the wires!');

		compiledCode.push('\t\t}');

		// Add private instances
		compiledCode.push('\tprivate:');
		compiledCode = compiledCode.concat(compiledDefsCode);

		compiledCode.push('};');

		return compiledCode.join('\n');
	}
}