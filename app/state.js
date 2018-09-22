/* @flow */

// This file was largely based on https://github.com/fantasyland/fantasy-states

import { of, chain, map, ap } from "fantasy-land";
import { constant } from "fantasy-combinators";

const State = function(run: Function) {
	this.run = run;
};

// Methods
State.of = State[of] = a => new State(s => [a, s]);

State.prototype.chain = State.prototype[chain] = function(f) {
	return new State(s => {
		const result = this.run(s);
		return f(result[0]).run(result[1]);
	});
};

State.get = () => new State(s => [s, s]);

State.modify = f => new State(s => [null, f(s)]);

State.put = s => State.modify(constant(s));

State.prototype.evalState = function(s) {
	return this.run(s)[0];
};

State.prototype.exec = function(s) {
	return this.run(s)[1];
};

// Derived
State.prototype.map = State.prototype[map] = function(f) {
	return this.chain(a => State.of(f(a)));
};

State.prototype.ap = State.prototype[ap] = function(a) {
	return this.chain(f => a.map(f));
};

// Transformer
State.StateT = M => {
	const StateT = function(run: Function) {
		this.run = run;
	};

	StateT.lift = m => new StateT(b => m.map(c => [c, b]));

	// https://hackage.haskell.org/package/mmorph-1.0.9/docs/Control-Monad-Morph.html#g:1
	StateT.hoist = f => m => new StateT(s => f(m.evalState(s)).map(x => [x, s]));

	StateT.of = StateT[of] = a => new StateT(b => M.of([a, b]));

	StateT.prototype.chain = StateT.prototype[chain] = function(f) {
		return new StateT(s => {
			const result = this.run(s);
			return result.chain(t => f(t[0]).run(t[1]));
		});
	};

	StateT.get = () => new StateT(s => M.of([s, s]));

	StateT.modify = f => new StateT(s => M.of([null, f(s)]));

	StateT.put = function(s) {
		return StateT.modify(constant(s));
	};

	StateT.prototype.evalState = function(s) {
		return this.run(s).map(t => t[0]);
	};

	StateT.prototype.exec = function(s) {
		return this.run(s).map(t => t[1]);
	};

	StateT.prototype.map = StateT.prototype[map] = function(f) {
		return this.chain(a => StateT.of(f(a)));
	};

	StateT.prototype.ap = StateT.prototype[ap] = function(a) {
		return this.chain(f => a.map(f));
	};

	return StateT;
};

export default State;
