const fs = require('fs');
const path = process.argv[2];
const s = fs.readFileSync(path, 'utf8');
let level = 0; let firstZero = -1; let positions = [];
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (ch === '"') {
    i++;
    while (i < s.length) {
      if (s[i] === '\\') { i += 2; continue; }
      if (s[i] === '"') break;
      i++;
    }
  } else if (ch === '{') {
    level++;
  } else if (ch === '}') {
    level--;
    positions.push({i, level});
    if (level === 0 && firstZero === -1) firstZero = i;
  }
}
console.log('length', s.length);
console.log('firstZeroIndex', firstZero);
if (firstZero !== -1) console.log('afterFirst40', JSON.stringify(s.slice(firstZero+1, firstZero+60)));
console.log('lastChars', JSON.stringify(s.slice(-60)));

// find any place where level < 0
const neg = positions.find(p => p.level < 0);
if (neg) console.log('negativeLevelAt', neg);
else console.log('no negative level');

// report max level
let maxLevel = 0; level = 0; for (let i=0;i<s.length;i++){const ch=s[i]; if (ch==='"'){i++;while(i<s.length){if(s[i]==='\\'){i+=2;continue;} if(s[i]==='"')break;i++;}}else if(ch==='{'){level++; if(level>maxLevel) maxLevel=level;} else if(ch==='}') level--;}
console.log('maxNesting', maxLevel);

// show slice around earlier reported pos 14240
console.log('slice14220', JSON.stringify(s.slice(14220,14280)));
