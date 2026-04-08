'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var paths = require('./paths-ab875b3b.js');

// Generates static `useLocation` hook. The hook always
// responds with initial path provided.
// You can use this for server-side rendering.
var staticLocation = (path = "/", { record = false } = {}) => {
  console.warn(
    "`wouter/static-location` is deprecated and will be removed in upcoming versions. " +
      "If you want to use wouter in SSR mode, please use `ssrPath` option passed to the top-level " +
      "`<Router>` component."
  );

  const hook = ({ base = "" } = {}) => [
    paths.relativePath(base, path),
    (to, { replace } = {}) => {
      if (record) {
        if (replace) {
          hook.history.pop();
        }
        hook.history.push(
          // handle nested routers and absolute paths
          paths.absolutePath(to, base)
        );
      }
    },
  ];
  hook.history = [path];
  return hook;
};

exports.default = staticLocation;
