// Generates 30 validated floors and writes them into index.html between the
// __LEVELS_START__/__LEVELS_END__ markers. Every emitted floor carries its own
// `solution` — the placements the solver found — so verify.mjs and e2e.mjs can
// PROVE solvability by checking the solution instead of re-searching.
//
//   node web/levelgen.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const HTML = join(here, "index.html");

/* Must mirror the roster in index.html. verify.mjs cross-checks the two, so drift fails loudly. */
const SHAPES = {
  sleeping_intern:[[0,0],[0,1],[0,2]],
  micromanager_boss:[[0,0],[1,0],[2,0],[1,1]],
  broken_printer:[[0,0],[0,1],[1,0],[1,1]],
  gossip_worker:[[0,0],[1,0],[1,1],[2,1]],
  hr_manager:[[0,0],[0,1],[0,2],[1,0]],
  it_guy:[[0,0],[1,0],[2,0],[3,0]],
  office_plant:[[0,0]],
  coffee_machine:[[0,0],[0,1]],
  overachiever:[[1,0],[2,0],[0,1],[1,1]],
  the_ceo:[[1,0],[0,1],[1,1],[2,1],[1,2]],
  sales_guy:[[0,0],[1,0],[1,1],[1,2]],
  office_dog:[[0,0],[1,0]],
};
const IDS = Object.keys(SHAPES);
const size = id => SHAPES[id].length;

const norm=c=>{let mx=Infinity,my=Infinity;for(const p of c){if(p[0]<mx)mx=p[0];if(p[1]<my)my=p[1];}return c.map(p=>[p[0]-mx,p[1]-my]);};
const rotCW=c=>norm(c.map(([x,y])=>[y,-x]));
const rotN=(c,n)=>{let s=norm(c);for(let i=0;i<((n%4)+4)%4;i++)s=rotCW(s);return s;};
const ext=c=>{let w=0,h=0;for(const[x,y]of c){if(x+1>w)w=x+1;if(y+1>h)h=y+1;}return[w,h];};
const skey=s=>s.map(p=>p.join(",")).sort().join("|");

/* Deterministic PRNG so regeneration reproduces the same 30 floors. */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rnd = mulberry32(20260729);
const pick = arr => arr[Math.floor(rnd()*arr.length)];

/** Solves in cast order; returns per-piece {r,x,y} or null. Big pieces first internally. */
function solve(w,h,cast){
  const order=[...cast.keys()].sort((a,b)=>size(cast[b])-size(cast[a]));
  const cells=cast.map(id=>norm(SHAPES[id]));
  const grid=Array.from({length:h},()=>Array(w).fill(false));
  const out=new Array(cast.length);
  const seen=new Set();
  const fits=(s,ax,ay)=>s.every(([x,y])=>{const gx=ax+x,gy=ay+y;return gx>=0&&gy>=0&&gx<w&&gy<h&&!grid[gy][gx];});
  const mark=(s,ax,ay,v)=>s.forEach(([x,y])=>{grid[ay+y][ax+x]=v;});
  const place=k=>{
    if(k===order.length) return true;
    const key=k+"|"+grid.map(r=>r.map(v=>v?1:0).join("")).join("/");
    if(seen.has(key)) return false; seen.add(key);
    const idx=order[k];
    const rots=[];
    for(let r=0;r<4;r++){const s=rotN(cells[idx],r); if(!rots.some(o=>skey(o.s)===skey(s))) rots.push({r,s});}
    for(const {r,s} of rots){
      const [sw,sh]=ext(s);
      for(let ay=0;ay<=h-sh;ay++) for(let ax=0;ax<=w-sw;ax++){
        if(!fits(s,ax,ay)) continue;
        mark(s,ax,ay,true); out[idx]={r,x:ax,y:ay};
        if(place(k+1)) return true;
        mark(s,ax,ay,false);
      }
    }
    return false;
  };
  return place(0)?out:null;
}

const NAMES=[
  "Orientation Day","The Open Office","Mandatory Fun","Performance Review","Casual Friday",
  "The Standup","Reply-All Storm","Budget Season","Cubicle Shuffle","The Reorg",
  "Offsite Prep","Printer Jam Friday","The Pivot","Team Building","All-Hands Panic",
  "Quarterly Earnings","Hiring Freeze","The Audit","Overtime Olympics","Exit Interviews",
  "Stack Ranking","Middle Management","The Merger","Crunch Time","Corner Office Wars",
  "Golden Handcuffs","The Layoff Round","Hostile Takeover","Severance Package","Last One Out"
];

/* Difficulty schedule: pieces per floor and target density band. */
function scheduleFor(i){
  if(i<3)  return {pieces:[2,3][i<1?0:1]??3, band:[0.45,0.68]};
  if(i<8)  return {pieces:3, band:[0.55,0.75]};
  if(i<14) return {pieces:4, band:[0.62,0.80]};
  if(i<20) return {pieces:5, band:[0.68,0.85]};
  if(i<26) return {pieces:6, band:[0.74,0.89]};
  return {pieces:i<29?6:7, band:[0.80,0.93]};
}
const DIMS=[[3,4],[3,5],[3,6],[3,7],[4,4],[4,5],[4,6],[4,7]];

function makeCast(n){
  const cast=[]; const count={};
  let guard=0;
  while(cast.length<n && guard++<200){
    const id=pick(IDS);
    if((count[id]||0)>=2) continue;               // at most two of the same coworker
    count[id]=(count[id]||0)+1; cast.push(id);
  }
  return cast;
}

/* Pinned floors: floor 1 (tutorial, rule-test anchor) and floor 4 (dead-end anchor for e2e). */
const PINNED={
  0:{w:3,h:4,cast:["sleeping_intern","broken_printer"]},
  3:{w:3,h:4,cast:["sleeping_intern","broken_printer","micromanager_boss"]},
};

const levels=[];
for(let i=0;i<30;i++){
  const premium=i>=20;
  if(PINNED[i]){
    const {w,h,cast}=PINNED[i];
    const solution=solve(w,h,cast);
    if(!solution){ console.error(`FATAL: pinned floor ${i+1} unsolvable`); process.exit(1); }
    levels.push({w,h,name:NAMES[i],cast,premium,solution});
    continue;
  }
  const {pieces,band}=scheduleFor(i);
  let found=null, attempts=0;
  while(!found && attempts++<600){
    const [w,h]=pick(DIMS);
    const cast=makeCast(pieces);
    const used=cast.reduce((s,id)=>s+size(id),0);
    const density=used/(w*h);
    if(used>w*h||density<band[0]||density>band[1]) continue;
    const solution=solve(w,h,cast);
    if(solution) found={w,h,name:NAMES[i],cast,premium,solution};
  }
  if(!found){ console.error(`FATAL: no solvable config for floor ${i+1} after 600 attempts`); process.exit(1); }
  levels.push(found);
}

/* Re-validate every emitted solution independently before writing. */
for(let i=0;i<levels.length;i++){
  const lv=levels[i];
  const grid=Array.from({length:lv.h},()=>Array(lv.w).fill(false));
  for(let k=0;k<lv.cast.length;k++){
    const {r,x,y}=lv.solution[k];
    for(const [cx,cy] of rotN(SHAPES[lv.cast[k]],r)){
      const gx=x+cx, gy=y+cy;
      if(gx<0||gy<0||gx>=lv.w||gy>=lv.h||grid[gy][gx]){ console.error(`FATAL: floor ${i+1} solution invalid`); process.exit(1); }
      grid[gy][gx]=true;
    }
  }
}

const js="const LEVELS = "+JSON.stringify(levels,null,0)
  .replace(/\},\{"w"/g,"},\n  {\"w\"").replace(/^\[/,"[\n  ").replace(/\]$/,"\n];")+"\n";

const html=readFileSync(HTML,"utf8");
const out=html.replace(
  /\/\*__LEVELS_START__\*\/[\s\S]*?\/\*__LEVELS_END__\*\//,
  "/*__LEVELS_START__*/\n"+js.replace(/;\n$/,";")+"\n/*__LEVELS_END__*/");
if(out===html){ console.error("FATAL: markers not found in index.html"); process.exit(1); }
writeFileSync(HTML,out);

console.log("floor | grid | pieces | density | premium | name");
levels.forEach((lv,i)=>{
  const used=lv.cast.reduce((s,id)=>s+size(id),0);
  console.log(
    String(i+1).padStart(4)+"  | "+lv.w+"x"+lv.h+"  |   "+lv.cast.length+"    |  "
    +(100*used/(lv.w*lv.h)).toFixed(0).padStart(3)+"%  |   "+(lv.premium?"YES":" no")+"   | "+lv.name);
});
console.log(`\n30 floors written into index.html, every solution independently re-validated.`);
