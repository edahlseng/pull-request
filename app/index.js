#!/usr/env/node

/* @flow */

import { cond, either, equals, pipe, pipeK, prop, T } from "ramda";

import preparePullRequest from "./steps/pullRequest.js";
import startBranch from "./steps/branch.js";
import App from "./app.js";

// App helpers
const label = x => App.log(`\n${x}\n`);

// -----------------------------------------------------------------------------
// Actions
// -----------------------------------------------------------------------------

const helpMessage = `pull-request

pull-request is a helper script for common repository actions related to creating
and submitting pull-requests. See https://github.com/edahlseng/repo for more information.

Usage: pull-request <action>

Actions:
* <none>    Rebases against upstream, runs checks, and opens a pull request
* branch    Creates a new branch to work in
* setup     Creates a fork and sets up remotes
`;

const displayHelp = () => App.of().chain(label(helpMessage));

// const setupRepository = pipeK();

const actionIsPullRequest = pipe(
	prop("argv"),
	argv => argv.length < 3
);

const actionIsBranch = pipe(
	prop("argv"),
	argv => (argv.length < 3 ? null : argv[2]),
	equals("branch")
);

const actionIsSetup = pipe(
	prop("argv"),
	argv => (argv.length < 3 ? null : argv[2]),
	equals("branch")
);

const run = cond([
	[
		actionIsPullRequest,
		state =>
			preparePullRequest(App.of())
				.run()
				.evalState(state),
	],
	[
		actionIsBranch,
		state =>
			startBranch(App.of())
				.run()
				.evalState(state),
	],
	// [actionIsSetup, setupRepository(App.of()).run().evalState],
	[
		T,
		state =>
			displayHelp()
				.run()
				.evalState(state),
	],
]);

// -----------------------------------------------------------------------------
// Run
// -----------------------------------------------------------------------------

run({
	workingDirectory: process.cwd(),
	argv: process.argv,
}).fork(
	error => error && console.error(error), // eslint-disable-line no-console, no-undef
	() => {}
);
