// @ts-check
const {spawnSync}=require('node:child_process');
const {copyFileSync,statSync}=require('node:fs');
const path=require('node:path');

/** @param {string[]} args @returns {void} */
function runBuilder(args){
  const result=spawnSync(process.execPath,[require.resolve('electron-builder/cli.js'),...args,'--publish','never'],{
    cwd:__dirname,stdio:'inherit',env:{...process.env,ELECTRON_BUILDER_COMPRESSION_LEVEL:'3'}
  });
  if(result.error)throw result.error;
  if(result.status!==0)throw new Error(`Paketleme başarısız. Parametreler: ${JSON.stringify(args)}. Çıkış: ${result.status}. Sinyal: ${result.signal}.`);
}
/** @param {string} sourceDirectory @param {string[]} names @returns {void} */
function deliverArtifacts(sourceDirectory,names){
  for(const name of names){
    const source=path.join(sourceDirectory,name);
    if(statSync(source).size<1000000)throw new Error(`Paket dosyası beklenenden küçük: ${source}`);
    const destination=path.resolve(__dirname,'..',name);copyFileSync(source,destination);
    process.stdout.write(`Paket hazır: ${destination}\n`);
  }
}
module.exports={runBuilder,deliverArtifacts};
