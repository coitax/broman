const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Workaround: @supabase/supabase-js ships an ESM build (dist/index.mjs) that
// contains `import(/* */ OTEL_PKG)` — a dynamic import of a variable identifier
// that Hermes cannot parse, so the native bundle fails to compile. The CJS build
// (dist/index.cjs) implements the same feature with `require(s)` inside a
// caught Promise, which Hermes accepts. OpenTelemetry is opt-in and not used,
// so the runtime behavior is identical either way.
//
// Web keeps using the modern MJS entry. We only swap on native targets.
const supabaseCjs = path.resolve(
  __dirname,
  'node_modules/@supabase/supabase-js/dist/index.cjs',
);

const upstreamResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === '@supabase/supabase-js' &&
    (platform === 'android' || platform === 'ios')
  ) {
    return { type: 'sourceFile', filePath: supabaseCjs };
  }
  return (upstreamResolveRequest ?? context.resolveRequest)(
    context,
    moduleName,
    platform,
  );
};

module.exports = config;
