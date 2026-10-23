const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

test('üretim paketinde build alanı olmadan pencere açılır ve profil korunur',async()=>{
  const config=require('../package.json');
  const calls={title:'',profile:'',name:'',file:''};
  const originalProfile='/private/tmp/profile-'+config.name;
  const app={getPath:()=>originalProfile,setName:name=>{calls.name=name;},setPath:(_key,value)=>{calls.profile=value;},whenReady:()=>Promise.resolve(),on:()=>{},quit:()=>{},exit:code=>{throw new Error('Başlatma başarısız: '+code);}};
  function FakeWindow(options){
    calls.title=options.title;
    return {webContents:{setWindowOpenHandler:()=>{},on:()=>{},getURL:()=>''},setMenu:()=>{},once:()=>{},show:()=>{},loadFile:async file=>{calls.file=file;}};
  }
  const productionPackage={name:config.name,version:config.version,main:config.main};
  const modules={electron:{app,BrowserWindow:FakeWindow,dialog:{showErrorBox:(_title,message)=>{throw new Error(message);}},screen:{getPrimaryDisplay:()=>({workAreaSize:{width:1512,height:982}})}},'node:path':path,'node:fs':{mkdirSync:()=>{}},'./package.json':productionPackage};
  vm.runInNewContext(readFileSync(path.join(__dirname,'../desktop.cjs'),'utf8'),{__dirname:path.dirname(__dirname),require:name=>{if(!(name in modules))throw new Error('Beklenmeyen modül: '+name);return modules[name];}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls.title,config.build.productName);assert.equal(calls.name,config.build.productName);
  assert.equal(calls.profile,originalProfile);assert.ok(calls.file.endsWith('index.html'));
});
