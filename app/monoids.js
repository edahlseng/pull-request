/* @flow */

const StdLogMonoid = function() {};

StdLogMonoid.prototype.concat = function(x: { toString: () => string }) {
	process.stdout.write(x.toString());
	return this;
};

(StdLogMonoid.prototype: any).toString = () => "";

export const StdLog = () => new StdLogMonoid();

StdLog.empty = () => StdLog();
