const fs = require('fs');
const path = process.argv[2];
const s = fs.readFileSync(path,'utf8');
function idxToLineCol(idx){
  const lines = s.slice(0,idx).split(/\r?\n/);
  const line = lines.length; const col = lines[lines.length-1].length+1; return {line,col};
}
let stackParens = [];
let stackBraces = [];
for(let i=0;i<s.length;i++){
  const c=s[i];
  if(c==='(') stackParens.push(i);
  else if(c===')'){
    if(stackParens.length===0){ console.log('Unmatched ) at', idxToLineCol(i)); break; }
    else stackParens.pop();
  }
  if(c==='{') stackBraces.push(i);
  else if(c==='}'){
    if(stackBraces.length===0){ console.log('Unmatched } at', idxToLineCol(i)); break; }
    else stackBraces.pop();
  }
}
if(stackParens.length>0) console.log('Unmatched ( first at', idxToLineCol(stackParens[0]));
if(stackBraces.length>0) console.log('Unmatched { first at', idxToLineCol(stackBraces[0]));
