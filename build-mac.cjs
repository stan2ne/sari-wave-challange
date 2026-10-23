// @ts-check
const {runBuilder,deliverArtifacts}=require('./build-common.cjs');
const {tmpdir}=require('node:os');
const path=require('node:path');
const config=require('./package.json');
const output=path.join(tmpdir(),'wave-mac-'+config.name);
runBuilder(['--mac','dmg','--arm64','--x64','--config.directories.output='+output]);
deliverArtifacts(output,[config.build.productName+'-mac-arm64.dmg',config.build.productName+'-mac-x64.dmg']);
