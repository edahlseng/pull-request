/* @flow */

import { curry, isEmpty } from "ramda";

export const assocObject = curry((object: {}, sourceObject: {}) => {
	const newObject = { ...sourceObject };
	for (const key in object) {
		object[key] !== null &&
		typeof object[key] === "object" &&
		object[key].constructor === Object &&
		!isEmpty(object[key])
			? (newObject[key] = assocObject(object[key], newObject[key]))
			: (newObject[key] = object[key]);
	}
	return newObject;
});
