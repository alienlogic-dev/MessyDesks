class WireConnection {
	constructor(from, to, container) {
		this.from = from;
		this.to = to;

		this.container = container;
		this.svg = this.container.path('').fill('none').stroke({ width: 1 });

		this.from.parent().on('dragmove', this.update, this);
		this.to.parent().on('dragmove', this.update, this);

		this.update();
	}

	update() {
		var fromPos = this.from.rbox();
		var toPos = this.to.rbox();

		if (toPos.cx < fromPos.cx) {
			var t = toPos;
			toPos = fromPos;
			fromPos = t;
		}

		var newPath = 'Mfcx,fcy Cxa,ya xb,yb tcx,tcy';
		newPath = newPath
						.replace('fcx', fromPos.cx)
						.replace('fcy', fromPos.cy)

						.replace('xa', ((fromPos.cx + toPos.cx) / 2) - 10)
						.replace('ya', fromPos.cy)

						.replace('xb', ((fromPos.cx + toPos.cx) / 2) + 10)
						.replace('yb', toPos.cy)

						.replace('tcx', toPos.cx)
						.replace('tcy', toPos.cy);
		this.svg.plot(newPath);
	}

	remove() {
		this.svg.remove();
	}
}