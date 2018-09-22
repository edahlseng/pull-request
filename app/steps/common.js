/* @flow */

import { pipe } from "ramda";
import { asFutureValues } from "@eric.dahlseng/cli-tools";

import { hasGitRemote, currentGitBranch, hasChanges } from "../git.js";
import App from "../app.js";

const map = fn => x => x.map(fn);
const chain = fn => x => x.chain(fn);

const asFutureValuesInApp = App.fromFuture(asFutureValues);

export const determineConfiguration = pipe(
	() =>
		asFutureValuesInApp({
			hasRemoteNamedUpstream: hasGitRemote("upstream"),
			hasRemoteNamedOrigin: hasGitRemote("origin"),
			currentBranch: currentGitBranch(),
			hasChanges: hasChanges(),
		}),
	chain(
		config =>
			config.hasRemoteNamedUpstream || config.hasRemoteNamedOrigin
				? App.of(config)
				: App.reject(
						"Could not find an upstream remote to submit a pull request against."
				  )
	),
	map(x => ({
		...x,
		upstreamRemoteName: x.hasRemoteNamedUpstream ? "upstream" : "origin",
	})), // TODO: cleanup with assoc, etc., clean up elsewhere that could use this, maybe we can use a lens here?
	chain(App.addToState)
);
