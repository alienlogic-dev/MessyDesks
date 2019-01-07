class WireConnection {
	constructor(from, to, container) {
		this.from = from;
		this.to = to;

		this.container = container;
		this.svg = this.container.path('').fill('none').stroke({ width: 1 }).addClass('wire');

		this.from.parent().on('dragmove', this.update, this);
		this.to.parent().on('dragmove', this.update, this);

		this.update();
	}

	update() {
		var fromPos = this.from;
		var toPos = this.to;

		var fcx = fromPos.cx() + this.from.parent().x();
		var fcy = fromPos.cy() + this.from.parent().y();

		var tcx = toPos.cx() + this.to.parent().x();
		var tcy = toPos.cy() + this.to.parent().y();

		if (tcx < fcx) {
			var tx = tcx;
			tcx = fcx;
			fcx = tx;

			var ty = tcy;
			tcy = fcy;
			fcy = ty;
		}

		var newPath = 'Mfcx,fcy Cxa,ya xb,yb tcx,tcy';
		newPath = newPath
						.replace('fcx', fcx)
						.replace('fcy', fcy)

						.replace('xa', ((fcx + tcx) / 2) - 10)
						.replace('ya', fcy)

						.replace('xb', ((fcx + tcx) / 2) + 10)
						.replace('yb', tcy)

						.replace('tcx', tcx)
						.replace('tcy', tcy);
		this.svg.plot(newPath);
	}

	remove() {
		this.svg.remove();
	}
}