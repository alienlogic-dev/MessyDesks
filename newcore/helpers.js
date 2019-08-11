function arrayDiff(a, b) {
  return a.filter(x => !b.includes(x));
}

function pointInRect(p, rect) {
	var inX = (p.x >= (rect.x2 - rect.w)) && (p.x <= rect.x2);
	var inY = (p.y >= (rect.y2 - rect.h)) && (p.y <= rect.y2);
	return inX && inY;
}

function spyComponent(exclude, source, dest) {
	for (let [key, value] of Object.entries(source)) {
		if (!(value instanceof SVG.Element)) {
			if (!exclude.includes(key)) {
				if (value instanceof Component) {
					//console.log(`Component - ${key}:`, value, dest, key, dest[key]);
					spyComponent(exclude, value, dest[key]);
				} else if (value instanceof Wire) {
					//console.log(`Wire - ${key}:`, value, dest, key);
					dest[key].value = value.value;
				} else {
					//console.log(`Other - ${key}:`, value, dest, key);
					dest[key] = value;
				}
			}
		}
	}
}