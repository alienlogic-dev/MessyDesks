CONST['C++'] =
`class CONST: public Component {
  public:
    CONST(uint32_t value) : Component(0, 1) {
    	outValue = value;
    }

    uint32_t outValue;

    void execute() {
      outputsData[0] = outValue;
    }
};`;

NOR_Component['C++'] = 
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
    }
};`;

BIN2DEC_Component['C++'] = 
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
    }
};`;

DEC2BIN_Component['C++'] = 
`class DEC2BIN_Component: public Component {
  public:
    DEC2BIN_Component() : Component(1, 8) {}
    DEC2BIN_Component(int size) : Component(1, (size > 2 ? size : 2)) {}

    void execute() {
    	if (inputs[0]) {
        uint32_t data = *inputs[0];
        for (int idx = 0; idx < outCount; idx++) {
          outputsData[idx] = (data >> idx) & 0x01;
        }
    	}
    }
};`;

TRI_Component['C++'] = 
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

R_TRIG['C++'] =
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

      lastValue = val;
    }
};`;

BUTTON['C++'] =
`class BUTTON: public Component {
  public:
    BUTTON() : Component(0, 0) {}
    void execute() { outputs[0] = NULL; }
};`;

BCD_7Seg['C++'] = 
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

      outputsData = new uint32_t[outputsCount];
      outputs = new uint32_t*[outputsCount];
      for (int idx = 0; idx < outputsCount; idx++)
      	outputs[idx] = &outputsData[idx];

      exeIdx = 0;
    }

    int inCount, outCount;
    uint32_t** inputs;
    uint32_t* outputsData;
    uint32_t** outputs;

    bool nullAfterExecute = false;
    unsigned int exeIdx;

    void setIn(int index, uint32_t* value) {
    	nullAfterExecute = true;
    	if (value)
        inputs[index] = value;
    }

    uint32_t* getOut(int index) {
      return outputs[index];
    }

    virtual void execute() {}
    void run() {
      execute();
      if (nullAfterExecute)
	      for (int idx = 0; idx < inCount; idx++)
	      	inputs[idx] = NULL;
    }
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
		for (var idx in source.components) {
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

		// Find multiple input pins
		var uniquePins = [];
		var duplicatedPins = [];
		for (var idx in source.wires) {
			var wireItem = source.wires[idx];
			if (wireItem) {
				var pinItem = wireItem.I;
				var uniqueFilter = uniquePins.filter(t => (t.component == pinItem.component) && (t.pin == pinItem.pin));
				if (uniqueFilter.length == 0)
					uniquePins.push(pinItem);
				else {
					var duplicateFilter = duplicatedPins.filter(t => (t.component == pinItem.component) && (t.pin == pinItem.pin));
					if (duplicateFilter.length == 0)
						duplicatedPins.push(pinItem);
				}
			}
		}
		var componentsWithMultipleInputs = duplicatedPins.map(t => t.component);

		// Get components order
		var order = generateExecutionOrderFromSource(source);

		// Count inputs and outputs
		var inputPinCount = 0;
		var inputAliases = [];
		var outputPinCount = 0;
		var outputAliases = [];
		for (var idx in source.components) {
			var componentItem = source.components[idx];

			if (componentItem.name == 'INPUT') {
				if (componentItem.config) inputAliases.push(componentItem.config.alias); else inputAliases.push('');
				inputPinCount++
			} else if (componentItem.name == 'OUTPUT') {
				if (componentItem.config) outputAliases.push(componentItem.config.alias); else outputAliases.push('');
				outputPinCount++;
			}
		}
		compiledCode.push(`\t\t${componentName}() : Component(${inputAliases.length}, ${outputAliases.length}) ${compiledInstancesCode.length ? ', ' : ''} ${compiledInstancesCode.join(', ')} {`);
		


		for (var idx in order) {
			var orderItem = order[idx];

			var componentOutputWires = source.wires.filter(t => t.O.component == orderItem.id);

			if ((orderItem.name != 'INPUT') && (orderItem.name != 'OUTPUT'))
				compiledCode.push( `\t\t\t${aliases[orderItem.id]}.run();` );		

			for (var wIdx in componentOutputWires) {
				var wireItem = componentOutputWires[wIdx];
				if (wireItem) {
					var pinI = wireItem.I;
					var componentI = source.components.filter(t => t.id == pinI.component)[0];

					var pinO = wireItem.O;
					var componentO = source.components.filter(t => t.id == pinO.component)[0];

					if (!componentsWithMultipleInputs.includes(pinI.component)) {
						var outCode = `${aliases[pinO.component]}.outputs[${pinO.pin}]`;
						if (componentO.name == 'INPUT')
							outCode = `inputs[${aliases[componentO.id]}]`;

						var inCode = `${aliases[pinI.component]}.inputs[${pinI.pin}] = ${outCode}`;
						if (componentsWithMultipleInputs.includes(pinI.component))
							inCode = `${aliases[pinI.component]}.setIn(${pinI.pin}, ${outCode})`;

						if (componentI.name == 'OUTPUT')
							inCode = `outputs[${aliases[componentI.id]}] = ${outCode}`;

						compiledCode.push( '\t\t\t' + inCode + ';' );
					}
				}
			}
		}

		compiledCode.push('\t\t}');

		// Connect wires
		compiledCode.push('\t\tvoid execute() {');

		for (var idx in order) {
			var orderItem = order[idx];

			var componentOutputWires = source.wires.filter(t => t.O.component == orderItem.id);

			if ((orderItem.name != 'INPUT') && (orderItem.name != 'OUTPUT'))
				compiledCode.push( `\t\t\t${aliases[orderItem.id]}.run();` );

			for (var wIdx in componentOutputWires) {
				var wireItem = componentOutputWires[wIdx];
				if (wireItem) {
					var pinI = wireItem.I;
					var componentI = source.components.filter(t => t.id == pinI.component)[0];

					var pinO = wireItem.O;
					var componentO = source.components.filter(t => t.id == pinO.component)[0];

					if (componentsWithMultipleInputs.includes(pinI.component) || (componentO.name == 'INPUT') || (componentI.name == 'OUTPUT')) {
						var outCode = `${aliases[pinO.component]}.outputs[${pinO.pin}]`;
						if (componentO.name == 'INPUT')
							outCode = `inputs[${aliases[componentO.id]}]`;

						var inCode = `${aliases[pinI.component]}.inputs[${pinI.pin}] = ${outCode}`;
						if (componentsWithMultipleInputs.includes(pinI.component))
							inCode = `${aliases[pinI.component]}.setIn(${pinI.pin}, ${outCode})`;

						if (componentI.name == 'OUTPUT')
							inCode = `outputs[${aliases[componentI.id]}] = ${outCode}`;

						compiledCode.push( '\t\t\t' + inCode + ';' );
					}
				}
			}
		}

		compiledCode.push('\t\t}');

		// Add private instances
		compiledCode.push('\tprivate:');
		compiledCode = compiledCode.concat(compiledDefsCode);

		compiledCode.push('};');

		return compiledCode.join('\n');
	}
}

signNewCompiler('C++', cpp_compiler);
