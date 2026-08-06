const fs = require('fs');
const path = process.argv[2];
const s = fs.readFileSync(path,'utf8');
const chars = { '(':0, ')':0, '{':0, '}':0, '[':0, ']':0 };
for(let i=0;i<s.length;i++){
  const c=s[i]; if(chars.hasOwnProperty(c)) chars[c]++;
}
console.log('counts:', chars);

function findMismatch(ch1,ch2){
  let stack=[];
  for(let i=0;i<s.length;i++){
    const c=s[i];
    if(c===ch1) stack.push(i);
    if(c===ch2){ if(stack.length===0){ console.log('Unmatched', ch2, 'at', i); break;} else stack.pop(); }
  }
  if(stack.length>0) console.log('Unmatched', ch1, 'count', stack.length, 'first at', stack[0]);
}
findMismatch('(',')');
findMismatch('{','}');
findMismatch('[',']');
