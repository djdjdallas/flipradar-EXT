const esbuild = require('esbuild');
const path = require('path');

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: {
    'content': './src/content/main.js',
    'background': './src/background/service-worker.js',
    'popup': './src/popup/popup.js',
    'ebay-reader': './src/content/ebay-reader.js'
  },
  bundle: true,
  outdir: './dist',
  format: 'iife', // IIFE format for content scripts (no ES module support in content scripts)
  target: ['chrome110'],
  sourcemap: isWatch ? 'inline' : false,
  minify: !isWatch,
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"'
  },
  logLevel: 'info'
};

async function build() {
  if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await esbuild.build(buildOptions);
    console.log('Build complete!');
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
