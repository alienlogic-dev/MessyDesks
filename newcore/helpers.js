function arrayDiff(a, b) {
  return a.filter(x => !b.includes(x));
}

function spyComponent(exclude, source, dest) {
	for (let [key, value] of Object.entries(source)) {
		if (!(value instanceof SVG.Element)) {
			if (!exclude.includes(key)) {
				if (value instanceof Component) {
					//console.log(`Component - ${key}:`, value, dest, key, dest[key]);
					spyComponent(exclude, value, dest[key]);
				} else {
					//onsole.log(`Other - ${key}:`, value, dest, key);
					dest[key] = value;
				}
			}
		}
	}
}
