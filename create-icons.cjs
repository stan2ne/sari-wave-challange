// @ts-check
const {writeFileSync,mkdirSync,readFileSync}=require('node:fs');
const {deflateSync}=require('node:zlib');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const config=require('./package.json');
/** @param {Buffer} buffer @returns {number} */
function crc32(buffer){
  let crc=0xffffffff;
  for(const byte of buffer){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  return (crc^0xffffffff)>>>0;
}
/** @param {string} type @param {Buffer} data @returns {Buffer} */
function chunk(type,data){
  const name=Buffer.from(type);const size=Buffer.alloc(4);size.writeUInt32BE(data.length);
  const checksum=Buffer.alloc(4);checksum.writeUInt32BE(crc32(Buffer.concat([name,data])));
  return Buffer.concat([size,name,data,checksum]);
}
/** @param {number} x @param {number} y @param {number[]} a @param {number[]} b @returns {number} */
function lineDistance(x,y,a,b){
  const dx=b[0]-a[0],dy=b[1]-a[1];
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
  return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);
}
/** @param {number} size @param {boolean} red @returns {Buffer} */
function iconPng(size,red){
  const pixels=Buffer.alloc((size*4+1)*size);
  const accent=red?[255,58,85]:[255,218,36];
  const points=[[.13,.69],[.34,.32],[.54,.65],[.80,.25]];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const nx=(x+.5)/size,ny=(y+.5)/size;
    const edge=Math.hypot(Math.max(0,Math.abs(nx-.5)-.32),Math.max(0,Math.abs(ny-.5)-.32))-.16;
    const alpha=Math.max(0,Math.min(1,-edge*size+1));
    const distance=Math.min(...points.slice(1).map((point,index)=>lineDistance(nx,ny,points[index],point)));
    const line=Math.max(0,Math.min(1,(.022-distance)*size+1));
    const glow=Math.exp(-distance*30)*.48;
    const grid=(Math.floor(nx*16)%4===0||Math.floor(ny*16)%4===0)?.025:0;
    const base=red?[26,8,17]:[17,24,18];
    const index=y*(size*4+1)+1+x*4;
    for(let channel=0;channel<3;channel++)pixels[index+channel]=Math.round(Math.min(255,base[channel]+accent[channel]*(glow+line*.85+grid)));
    pixels[index+3]=Math.round(alpha*255);
  }
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
}
/** @returns {void} */
function createIcons(){
  const red=config.name.startsWith('kan-');
  const folder=path.join(__dirname,'build');mkdirSync(folder,{recursive:true});
  const iconset=path.join(folder,'icon.iconset');mkdirSync(iconset,{recursive:true});
  for(const size of [16,32,128,256,512]){
    writeFileSync(path.join(iconset,`icon_${size}x${size}.png`),iconPng(size,red));
    writeFileSync(path.join(iconset,`icon_${size}x${size}@2x.png`),iconPng(size*2,red));
  }
  writeFileSync(path.join(folder,'icon.png'),readFileSync(path.join(iconset,'icon_512x512.png')));
  const sizes=[32,48,256];const images=sizes.map(size=>iconPng(size,red));
  const header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);
  let offset=header.length;
  images.forEach((data,index)=>{const at=6+index*16;header[at]=sizes[index]===256?0:sizes[index];header[at+1]=header[at];header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(data.length,at+8);header.writeUInt32LE(offset,at+12);offset+=data.length;});
  writeFileSync(path.join(folder,'icon.ico'),Buffer.concat([header,...images]));
  execFileSync('/usr/bin/iconutil',['-c','icns',iconset,'-o',path.join(folder,'icon.icns')],{stdio:'inherit'});
}
createIcons();
