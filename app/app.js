/* @flow */

import Future from "fluture";

import { StdLog } from "./monoids.js";
import Writer from "./writer.js";
import State from "./state.js";
import { assocObject } from "./utils.js";

const StateFuture = State.StateT(Future);
const App = Writer.WriterT(StateFuture, StdLog);

// TODO: get rid of the below function, as it shouldn't be used directly
App.fromStateFuture = fn => x => App.lift(fn(x));
App.fromFuture = fn => (...args) => App.lift(StateFuture.lift(fn(...args)));
App.liftFuture = m => App.lift(StateFuture.lift(m));

App.getState = () => App.lift(StateFuture.get());
App.modifyState = fn => App.lift(StateFuture.modify(fn));
App.addToState = additionalState =>
	App.modifyState(assocObject(additionalState));

App.mapRej = fn => App.hoist(StateFuture.hoist(Future.mapRej(fn)));
App.chainRej = fn => App.hoist(StateFuture.hoist(Future.chainRej(fn)));
App.reject = App.hoist(StateFuture.hoist(Future.reject));

export default App;
