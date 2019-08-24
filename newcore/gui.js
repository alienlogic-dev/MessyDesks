class Symbol {
  constructor() {
		this.id = '';
		this.isSelected = false;

		this.x = 0;
    this.minWidth = 5;
    this.w = 0;
		this.wpx = 0;

		this.y = 0;
		this.minHeight = 2;
		this.h = 0;
		this.hpx = 0;

		this.pinClicked = null;
  }

  initGUI() {}

	calculateTextWidth(sidePins) {
		var inMaxWidth = 0;
		for (var i = sidePins.left.length - 1; i >= 0; i--) {
			var item = sidePins.left[i];

			var textWidth = item.name.length * 5.25;

			if (textWidth > inMaxWidth) inMaxWidth = textWidth;
		}

		var outMaxWidth = 0;
		for (var i = sidePins.right.length - 1; i >= 0; i--) {
			var item = sidePins.right[i];

			var textWidth = item.name.length * 5.25;

			if (textWidth > outMaxWidth) outMaxWidth = textWidth;
		}

		return Math.floor((Math.floor(inMaxWidth) + Math.floor(outMaxWidth) + 24) / 8);	
	}
	calculateTextHeight(sidePins) {
		return (0 + 0 + 24) / 8;	
	}

	createSVG() {
    var sidePins = {
      left: [],
      right: [],
      top: [],
      bottom: []
    };
    for (var p of this.pins) {
      sidePins[p.side].push(p);
    }

		var textW = this.calculateTextWidth(sidePins);
		var textH = this.calculateTextHeight(sidePins);

    console.log(textW);

		this.w = Math.max(this.minWidth, Math.max(textW, Math.max(sidePins.top.length * 2, sidePins.bottom.length * 2)));
		this.wpx = this.w * 8;

		this.h = Math.max(this.minHeight, Math.max(textH, Math.max(sidePins.left.length * 2, sidePins.right.length * 2)));
		this.hpx = this.h * 8;

		if (!this.svg) {
			this.svg = new SVG.G();

			this.svg.on('mousedown', this.mouseDownEvent, this);
			this.svg.on('mouseup', this.mouseUpEvent, this);
			this.svg.on('dblclick', this.dblClickEvent, this);
	
			this.svg.draggable({ snapToGrid: 8 });
			this.svg.on('dragstart', this.dragstart, this);
			this.svg.on('dragmove', this.dragmove, this);
			this.svg.on('dragend', this.dragend, this);
		} else
			this.svg.clear();

		this.drawBody(this.wpx, this.hpx);
		this.drawPins(this.wpx, this.hpx);

		this.symbolSVG = new SVG.G();
		this.drawSymbol(this.symbolSVG);

		this.symbolSVG.move((this.wpx / 2) - (this.symbolSVG.width() / 2), (this.hpx / 2) - (this.symbolSVG.height() / 2));
		this.svg.add(this.symbolSVG);
	}
  
	drawBody(wpx, hpx) {
		this.svgBody = this.svg.rect(wpx, hpx)
			.radius(2)
			.move(0, 0)
			.fill('#cccccc')
			.stroke({ color: '#666666', width: 2 });

		this.svgName = this.svg
			.text(this.constructor.name)
			.font({
							family:	 'Menlo'
						, size:		 12
						, anchor:	 'middle'
						})
			.move(wpx / 2, -15);
	}

	drawPins(wpx, hpx) {
    var sidePins = {
      left: [],
      right: [],
      top: [],
      bottom: []
    };
    for (var p of this.pins) {
      sidePins[p.side].push(p);
    }

    var sides = ['left', 'right', 'top', 'bottom'];
    for (var s of sides) {
      var sideItems = sidePins[s];
      var stepSize = (((s == 'left') || (s == 'right')) ? hpx : wpx) / sideItems.length;

      for (var i = sideItems.length - 1; i >= 0; i--) {
			  var item = sideItems[i];

        if (!item.svg) {
          item.svg = this.svg.rect(8, 8).radius(8);
          item.svg
            .on('click', this.pinClickedEvent, item)
            .on('contextmenu', this.pinRemoveWires, item);
        } else
          this.svg.add(item.svg);

        var dotPosition = { x: 0, y: 0 };
        var labelPosition = { x: 0, y: 0 };
        var labelAnchor = 'start';
        
        switch (s) {
          case 'left':
            dotPosition = { x: -4, y: (stepSize * i) + (stepSize / 2) - 4 };
            labelPosition = { x: 6, y: (stepSize * i) + (stepSize / 2) - 6 };
            labelAnchor = 'start';
            break;
          case 'right':
            dotPosition = { x: wpx - 4, y: (stepSize * i) + (stepSize / 2) - 4 };
            labelPosition = { x: wpx - 6, y: (stepSize * i) + (stepSize / 2) - 6 };
            labelAnchor = 'end';
            break;
          case 'top':
            dotPosition = { x: 0, y: 0 };
            labelPosition = { x: 0, y: 0 };
            labelAnchor = 'start';
            break;
          case 'bottom':
            dotPosition = { x: 0, y: 0 };
            labelPosition = { x: 0, y: 0 };
            labelAnchor = 'start';
            break;
        }

        item.svg.move(dotPosition.x, dotPosition.y)
          .addClass('pin')
          .fill('#ffcc00')
          .stroke({ color: '#000', width: 1 })
          .data('pin_id', item.ID);

        if (!item.isHidden)
          this.svg
            .text(item.name.replace('!', ''))
            .font({
                    family:	 'Menlo'
                  , size:		 9
                  , anchor:	 labelAnchor
                  })
            .attr('text-decoration', item.isInverted ? 'overline' : null)
            .move(labelPosition.x, labelPosition.y);
      }
    }
	}

	drawSymbol(svg) { }

	/* Mouse */
	pinRemoveWires(e) {
		e.preventDefault();
    this.component.pinClicked(this, true);
		return false;
	}
	pinClickedEvent(e) {
    this.component.pinClicked(this, false);
	}

	mouseDownEvent(e) { }
	mouseUpEvent(e) { }
	mouseDblClickEvent(e) { }

	dblClickEvent(e) {
		if (e.altKey)
			startComponentEdit(this);
		else {
			var configModalContent = this.createConfigModal();
			if (configModalContent)
				this.openConfig(configModalContent);
			else
				if (!this.mouseDblClickEvent(e))
					startComponentEdit(this);
		}
	}

	dragstart(e) {
	}

	dragmove(e) {
		for (var p of this.pins)
			if (p.wire)
				p.wire.refresh();
	}

	dragend(e) {
		if (this.svg) {
			this.x = this.svg.x();
			this.y = this.svg.y();
		}
	}

	/* Selection */
	select() {
		this.svgBody.stroke({ color: '#0000ff', width: 2 });
		this.isSelected = true;
	}
	deselect() {
		this.svgBody.stroke({ color: '#666666', width: 2 });
		this.isSelected = false;
	}
	
	/* Refresh */	
	draw() {}

	refresh() {
    var outputs = this.run();

    for (var p of this.pins) {
      var pinValue = null;
      if (p.wire)
        pinValue = p.wire.value;
      else
        pinValue = outputs[p.name];
      
			p.svg.fill((pinValue == null) ? '#fc0' : (+pinValue ? '#0c0' : '#c00'));
    }

		this.draw();
	}

	/* Configuration */
	createConfigModal() {
		if (this.config == null) return null;

		var configItems = Object.keys(this.config);
		if (configItems.length == 0) return null;

		var formDiv = $('<div class="form-group m-0"></div>');

		for (var idx in configItems) {
			var configItemName = configItems[idx];
			var configItemValue = this.config[configItemName];

			var rowDiv = $('<div class="row mb-2"></div>');

			var colNameDiv = $('<div class="col-2 text-right pt-1"><b></b></div>');
			colNameDiv.find('b').text(configItemName);

			var colValueDiv = $('<div class="col-10"></div>');
			var valueInput = $('<input type="text" class="form-control"/>');
			valueInput.attr('id', `ci_${configItemName}`);
			valueInput.val(configItemValue);
			colValueDiv.html(valueInput);

			rowDiv.append(colNameDiv);
			rowDiv.append(colValueDiv);

			formDiv.append(rowDiv);
		}

		return formDiv;
	}

	onVerifyConfig(config) { return true; }
	onConfigChanged() { return false; }

	openConfig(configModalContent) {
		if (configModalContent) {
			$('#modalComponentOptions .modal-body').html(configModalContent);
			$('#modalComponentOptions').data('component', this);
			$('#modalComponentOptions').modal('show');
		}
	}
}

class Cable {
  constructor() {
		this.svg = null;
	}

	createSVG() {
		this.svg = new SVG.G();
		this.wireSVG = this.svg.polyline([]).fill('none').stroke({ width: 1 });
	}

	refresh() {
		this.draw();
	}

	draw() {
		var points = [];

		for (var p of this.references) {
			if (p.svg) {
				var pcx = p.svg.cx() + p.svg.parent().x();
				var pcy = p.svg.cy() + p.svg.parent().y();

				points.push([ pcx, pcy ]);
			}
		}

    points.sort( (a,b) => (a[0] + a[1] * 1000) - (b[0] + b[1] * 1000) );

		this.wireSVG.plot(points);
	}
}

class Pong {
  constructor() {
		this.value = null;
	}
}