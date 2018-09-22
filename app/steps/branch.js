/* @flow */

import { pipe, pipeK } from "ramda";
import { singlePrompt as singlePromptF } from "@eric.dahlseng/cli-tools";

import {
	resetBranchToRemoteRef as resetBranchToRemoteRefF,
	pushAndSetOrigin as pushAndSetOriginF,
	checkoutNewBranch as checkoutNewBranchF,
	stash as stashF,
	stashPop as stashPopF,
} from "../git.js";
import App from "../app.js";
import { determineConfiguration } from "./common.js";

const singlePrompt = App.fromFuture(singlePromptF);
const checkoutNewBranch = App.fromFuture(checkoutNewBranchF);
const resetBranchToRemoteRef = App.fromFuture(resetBranchToRemoteRefF);
const pushAndSetOrigin = App.fromFuture(pushAndSetOriginF);
const stash = App.fromFuture(stashF);
const stashPop = App.fromFuture(stashPopF);

const label = x => App.log(`\n${x}\n`);

// Helpers
const mapRej = fn => x => x.mapRej(fn);
const chain = fn => x => x.chain(fn);

// -----------------------------------------------------------------------------
// Prompt Branch Name
// -----------------------------------------------------------------------------

const branchTypeMessage = `What type of branch is this?
b) bugfix
d) dependency
f) feature
t) tech-debt
n) <none>
Select one of the above options:`;

const branchType = {
	b: "bugfix",
	d: "dependency",
	f: "feature",
	t: "tech-debt",
	n: "",
};

const promptBranchType = pipeK(
	() =>
		singlePrompt({
			type: "input",
			message: branchTypeMessage,
			filter: x => branchType[x] || "",
		}),
	branchType => App.addToState({ branchType })
);

const promptBranchSubname = pipeK(
	() =>
		singlePrompt({
			type: "input",
			message: "Subname:",
			transformer: x => x.replace(/\s/g, ""),
			filter: x => x.replace(/\s/g, ""),
		}),
	branchSubname => App.addToState({ branchSubname })
);

const setBranchName = pipeK(
	App.getState,
	config =>
		App.addToState({
			branchName:
				config.branchType +
				(config.branchType === "" ? "" : "/") +
				config.branchSubname,
		})
);

export const promptBranchName = pipeK(
	promptBranchType,
	promptBranchSubname,
	setBranchName
);

// -----------------------------------------------------------------------------
// Create Branch
// -----------------------------------------------------------------------------

export const createBranch = pipe(
	App.getState,
	chain(config =>
		pipeK(
			() => checkoutNewBranch(config.branchName),
			() => resetBranchToRemoteRef(config.upstreamRemoteName, "master"),
			() => pushAndSetOrigin("origin", config.branchName)
		)()
	),
	App.mapRej(() => "")
);

// -----------------------------------------------------------------------------
// Stashing
// -----------------------------------------------------------------------------

const stashIfNecessary = pipeK(
	App.getState,
	config => (config.hasChanges ? stash() : App.of())
);

const stashPopIfNecessary = pipeK(
	App.getState,
	config => (config.hasChanges ? stashPop() : App.of())
);

// -----------------------------------------------------------------------------
// Default export
// -----------------------------------------------------------------------------

export default pipeK(
	determineConfiguration,
	stashIfNecessary,
	promptBranchName,
	createBranch,
	stashPopIfNecessary
);
