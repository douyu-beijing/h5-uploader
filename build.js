/**
 * 编译项目
 */
const rollup = require('rollup');

let version = require('./package.json').version;
let banner =
`/**
 * FileUploader
 *
 * @version ${version}
 */`;

async function build() {
    // main
    const bundle = await rollup.rollup({
        input: './src/FileUploader.js'
    });
    
    await bundle.write({
        banner: banner,
        format: 'umd',
        name: 'FileUploader',
        file: 'index.js'
    });
}

// run
build();