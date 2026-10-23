// @ts-check
const {runBuilder,deliverArtifacts}=require('./build-common.cjs');
const config=require('./package.json');
const path=require('node:path');
runBuilder(['--linux','tar.gz','--x64']);
deliverArtifacts(path.join(__dirname,'paket'),[config.build.productName+'-linux-x64.tar.gz']);
