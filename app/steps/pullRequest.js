/* @flow */

import path from "path";
import { pipe, pipeK, assoc, isNil, objOf } from "ramda";
import Future, { type Fluture as FutureMonad } from "fluture";
import {
	asFutureValues,
	loadJson as loadJsonF,
	condF,
	trueF,
	singlePrompt,
	fileExists,
	executeCommandInheritStdout,
} from "@eric.dahlseng/cli-tools";

import { determineConfiguration } from "./common.js";
import { assocObject } from "../utils.js";
import {
	rebase as rebaseF,
	branchNeedsPush,
	originMissingRemoteBranch,
	remoteUrl,
} from "../git.js";
import App from "../app.js";

const rebase = App.fromFuture(rebaseF);
const loadJson = App.fromFuture(loadJsonF);

const label = x => App.log(`\n${x}\n`);

// TODO: this is the wrong location for this todo, but we should change the subnames for branches to the plural form

// Helpers
// TODO: check if there is execute permission within the executeCommandInheritStdout function
const runF = executeCommandInheritStdout;
const run = App.fromFuture(executeCommandInheritStdout); // This command is used many times, so use a shorter name in order to improve readability
const chain = fn => x => x.chain(fn);
const map = fn => x => x.map(fn);
const chainRej = fn => x => x.chainRej(fn);
const mapRej = fn => x => x.mapRej(fn);

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const pullRequestUrlF: ({
	currentBranch: string,
	upstreamRemoteName: string,
}) => FutureMonad<mixed, string> = pipe(
	({ currentBranch, upstreamRemoteName }) =>
		Future.parallel(Infinity, [
			remoteUrl("origin").map(
				url =>
					url.replace(/^.*:/, "").replace(/\/.*$/, "") + `:${currentBranch}`
			),
			remoteUrl(upstreamRemoteName).map(url =>
				url
					.replace(/git@github\.com:/, "https://github.com/")
					.replace(".git", "")
			),
		]).map(
			([pullRequestBase, targetGitHubUrl]) =>
				`${targetGitHubUrl}/compare/master...${pullRequestBase}`
		)
);

const pullRequestUrl = App.fromFuture(pullRequestUrlF);

// TODO: Rename to setPullRequestUrl (also setConfiguration)
const determinePullRequestUrl = pipe(
	App.getState,
	chain(config =>
		pullRequestUrl({
			currentBranch: config.currentBranch,
			upstreamRemoteName: config.hasRemoteNamedUpstream ? "upstream" : "origin",
		})
	),
	map(objOf("pullRequestUrl")),
	chain(App.addToState)
);

// -----------------------------------------------------------------------------
// Rebase
// -----------------------------------------------------------------------------

const rebaseProject = pipe(
	App.getState,
	chain(config =>
		rebase(config.hasRemoteNamedUpstream ? "upstream" : "origin", "master")
	),
	App.mapRej(() => "")
);

// -----------------------------------------------------------------------------
// Run Checks
// -----------------------------------------------------------------------------

const runNPMChecks = pipe(
	App.getState,
	map(config => path.resolve(config.workingDirectory, "package.json")),
	chain(loadJson),
	App.mapRej(() => null),
	chain(
		packageJson =>
			packageJson.scripts && packageJson.scripts.check
				? run("npm run check")
				: App.of()
	),
	App.chainRej(err => (isNil(err) ? App.of() : App.reject(err)))
);

const runInfrastructureChecks = pipe(
	App.getState,
	chain(
		App.fromFuture(
			condF([
				[
					config =>
						fileExists(path.resolve(config.workingDirectory, "bin/covalence")),
					() => runF("bin/covalence ci"),
				],
				[
					config =>
						fileExists(
							path.resolve(config.workingDirectory, "infra/bin/covalence")
						),
					() => runF("infra/bin/covalence ci"),
				],
				[trueF, Future.of],
			])
		)
	),
	chain(App.fromFuture(x => x))
);

const runChecks = pipe(
	runNPMChecks,
	chain(runInfrastructureChecks)
);

// -----------------------------------------------------------------------------
// Update Remote
// -----------------------------------------------------------------------------

const requestPushBranch = config =>
	singlePrompt({
		type: "confirm",
		message:
			"The origin remote does not have your current local branch. Would you like to push this branch to origin?",
		default: true,
	}).chain(
		push =>
			push
				? runF(`git push --set-upstream origin ${config.currentBranch}`)
				: Future.reject()
	);

const requestForcePush = () =>
	singlePrompt({
		type: "confirm",
		message: "There are unpushed changes. Would you like to force push?",
		default: true,
	}).chain(push => (push ? runF(`git push --force`) : Future.reject()));

const updateRemote = pipe(
	App.getState,
	chain(
		App.fromFuture(
			condF([
				[originMissingRemoteBranch, requestPushBranch],
				[branchNeedsPush, requestForcePush],
				[trueF, Future.of],
			])
		)
	),
	chain(App.fromFuture(x => x))
);

// -----------------------------------------------------------------------------
// Open Pull Request
// -----------------------------------------------------------------------------

const openPullRequest = pipeK(
	App.getState,
	({ pullRequestUrl }) => run(`open ${pullRequestUrl}`)
);

// -----------------------------------------------------------------------------
// Default export
// -----------------------------------------------------------------------------

export default pipeK(
	determineConfiguration,
	determinePullRequestUrl,
	label("Rebasing..."),
	rebaseProject,
	label("Running checks..."),
	runChecks,
	label("Updating remote..."),
	updateRemote,
	label("Opening pull request..."),
	openPullRequest
);
