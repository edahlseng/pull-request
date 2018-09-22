/* @flow */

import { of, chain, map, ap } from "fantasy-land";

const Writer = (Monoid: { empty: <A: { concat: Function }>() => A }) => {
	const Writer = function wrapped(run: Function) {
		function Ctor() {}
		Ctor.prototype = Writer.prototype;
		const self = new Ctor();
		self.run = run;
		return self;
	};

	// Methods
	Writer.of = Writer[of] = x => Writer(() => [x, Monoid.empty()]);

	Writer.prototype.chain = Writer.prototype[chain] = function(f) {
		return Writer(() => {
			const result = this.run();
			const t = f(result[0]).run();
			return [t[0], result[2].concat(t[1])];
		});
	};

	Writer.prototype.tell = function(x) {
		const a = this.run();
		return Writer(() => [a[0], a[1].concat(x)]);
	};

	Writer.prototype.exec = function(s) {
		return this.run(s)[map](t => t[1]);
	};

	// Derived
	Writer.prototype.map = Writer.prototype[map] = function(f) {
		const result = this.run();
		return [f(result[0]), result[1]];
	};

	Writer.prototype.ap = Writer.prototype[ap] = function(a) {
		return this[chain](f => a[map](f));
	};

	return Writer;
};

// Transformer
Writer.WriterT = (Monad, Monoid) => {
	const WriterT = function(run: Function) {
		this.run = run;
	};

	WriterT.of = WriterT[of] = a =>
		new WriterT(() => Monad[of]([a, Monoid.empty()]));

	WriterT.lift = m => new WriterT(() => m[map](x => [x, Monoid.empty()]));

	// https://hackage.haskell.org/package/mmorph-1.0.9/docs/Control-Monad-Morph.html#g:1
	WriterT.hoist = f => m => new WriterT(() => f(m.run()));

	WriterT.log = w => x => new WriterT(() => Monad.of([x, w]));

	WriterT.prototype.chain = WriterT.prototype[chain] = function(f) {
		return new WriterT(() =>
			this.run()[chain](outerTuple => {
				const newMonad = f(outerTuple[0]).run();
				return newMonad.map(newTuple => [
					newTuple[0],
					outerTuple[1].concat(newTuple[1]),
				]);
			})
		);
	};

	WriterT.prototype.tell = function(x) {
		const result = this.run();
		return new WriterT(() =>
			result.map(tuple => {
				const a = tuple[0];
				const w = tuple[1];
				const newW = w.concat(x);

				return [a, newW];
			})
		);
	};

	WriterT.prototype.map = WriterT.prototype[map] = function(f) {
		return this[chain](a => WriterT.of(f(a)));
	};

	WriterT.prototype.ap = WriterT.prototype[ap] = function(a) {
		return this[chain](f => a[map](f));
	};

	return WriterT;
};

export default Writer;
