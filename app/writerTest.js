/* @flow */
import Identity from "sanctuary-identity";
import Useless from "sanctuary-useless";
import { Monad } from "sanctuary-type-classes";
import { of, chain, map, ap, inspect } from "fantasy-land";

import Writer from "./writer.js";

Identity.of = Identity; // TODO: use fantasy land specs

function arraysEqual(a, b) {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (a.length != b.length) return false;

	// If you don't care about the order of the elements inside
	// the array, you should sort both arrays here.

	for (let i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

console.log(Monad.test(Identity(Useless)));
console.log(Monad.test(Writer(Useless)));

const log = { empty: () => "" };
console.log(Monad.test(Writer.WriterT(Identity(Useless), log)));

// Check lift and hoist
const WriterIdentity = Writer.WriterT(Identity, log);
console.log(
	arraysEqual(
		WriterIdentity.lift(Identity.of("blah")).run().value,
		WriterIdentity.of("blah").run()
	)
);

console.log("hoist tests");
console.log(WriterIdentity.hoist(x => x)(WriterIdentity.of("a")).run());
console.log(
	arraysEqual(
		WriterIdentity.hoist(x => x)(WriterIdentity.of("blah")).run().value,
		WriterIdentity.of("blah").run().value
	)
);
