/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as challenges from "../challenges.js";
import type * as debates from "../debates.js";
import type * as follows from "../follows.js";
import type * as messages from "../messages.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as pushNotificationsActions from "../pushNotificationsActions.js";
import type * as scheduledFunctions from "../scheduledFunctions.js";
import type * as search from "../search.js";
import type * as spectatorMessages from "../spectatorMessages.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  challenges: typeof challenges;
  debates: typeof debates;
  follows: typeof follows;
  messages: typeof messages;
  pushNotifications: typeof pushNotifications;
  pushNotificationsActions: typeof pushNotificationsActions;
  scheduledFunctions: typeof scheduledFunctions;
  search: typeof search;
  spectatorMessages: typeof spectatorMessages;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
