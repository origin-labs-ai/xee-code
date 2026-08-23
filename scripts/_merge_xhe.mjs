import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from 'fs';
import { join } from 'path';

// 1. Archive XHE folder to archive/XHE for backup (already have archive/DSH-Enhanced but do XHE too)
if(existsSync('XHE') && !existsSync('archive/XHE')){
  cpSync('XHE','archive/XHE',{recursive:true});
  console.log('backed up XHE -> archive/XHE');
}

// 2. Fix XHE/README leftover DSH/XEE refs globally in that backup is fine - fix live XHE before removal
// Patch live XHE/README + package.json before we decide to keep or merge

// 3. Global XEE -> Xee was already done, but ensure archive TRANSCRIPT final fixes
let t = readFileSync('archive/TRANSCRIPT.md','utf8');
let n = t.replaceAll('XEE HARNESS ENHANCED','Xee Harness Enhanced').replaceAll('XEE Harness','Xee Harness');
if(n!==t){ writeFileSync('archive/TRANSCRIPT.md', n,'utf8'); console.log('patched archive TRANSCRIPT XEE'); }

// 4. Ensure no .zh.md remains
import {globSync} from 'fs';
let zh = globSync('**/*.zh.md');
console.log('zh remaining', zh.length);

// 5. Check manifest webmanifest already fixed
console.log('ready to remove XHE folder - wiring is in README and archive');
