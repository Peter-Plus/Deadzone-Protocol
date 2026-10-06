import { Command } from 'commander';
import { AssetCompiler } from '../compiler/AssetCompiler.js';
import { report, watchAssets } from './watch.js';
import { startPreview } from '../previewer/server.js';
const cli = new Command().name('forgekit').description('Deterministic procedural 3D asset pipeline').version('1.0.0');
cli.option('--definitions <directory>', 'Source definition root').option('--out <directory>', 'Compiled asset root').option('--max-size <meters>', 'Warning threshold for dimensions', '1000');
function compiler() {
  const options = cli.opts(); const maxSize = Number(options.maxSize);
  if (!Number.isFinite(maxSize) || maxSize <= 0) throw new Error('--max-size must be a positive finite number');
  return new AssetCompiler({ definitions: options.definitions, output: options.out, maxSize });
}
cli.command('validate [path]').description('Validate schema, semantics and references').action(async target => { const result = await compiler().validate(target); report(result); if (!result.ok) process.exitCode = 1; });
cli.command('build [path]').description('Validate then compile GLB files').action(async target => { const result = await compiler().build(target); report(result); console.log(`Written ${result.changed.length} asset(s)`); if (!result.ok) process.exitCode = 1; });
cli.command('watch').description('Watch definitions, rules and schemas; preserve last valid outputs').action(async () => { const close = await watchAssets(compiler()); console.log('Watching source assets…'); process.once('SIGINT', async () => { await close(); process.exit(0); }); });
cli.command('preview').description('Start local previewer with compilation and hot reload').option('--port <port>', 'Local port', '5173').option('--no-watch', 'Browse existing output without compiling sources').action(async options => { const port = Number(options.port); if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port'); await startPreview(compiler(), port, options.watch); });
cli.parseAsync().catch(error => { console.error(`ERROR [PIPELINE_FAILURE]\n${error instanceof Error ? error.message : error}`); process.exitCode = 1; });
