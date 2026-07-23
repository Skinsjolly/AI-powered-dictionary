const fs = require('fs');
const path = require('path');

const dictPath = path.join(__dirname, 'dictionary.json');
let raw = fs.readFileSync(dictPath, 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const data = JSON.parse(raw);

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getIPA(word, pos) {
  const w = word.toLowerCase();
  const vowelSounds = ['\u00E6', '\u025B', '\u026A', '\u0252', '\u028C', '\u0259', 'e', 'o', 'a', 'i', 'u'];
  const consonantSounds = {
    b: 'b', d: 'd', f: 'f', g: 'g', h: 'h', j: 'd\u0292',
    k: 'k', l: 'l', m: 'm', n: 'n', p: 'p', r: 'r',
    s: 's', t: 't', v: 'v', w: 'w', z: 'z'
  };

  let ipa = '';
  let vi = 0;
  for (let i = 0; i < w.length; i++) {
    const c = w[i];
    if (c in consonantSounds) {
      ipa += consonantSounds[c];
    } else if ('aeiou'.includes(c)) {
      ipa += vowelSounds[vi % vowelSounds.length];
      vi++;
    } else if (c === 'x') {
      ipa += 'ks';
    } else if (c === 'q') {
      ipa += 'kw';
    } else if (c === 'y') {
      ipa += 'j';
    } else if (c === 'c') {
      ipa += 'k';
    } else {
      ipa += c;
    }
  }
  return '/' + ipa + '/';
}

function getVerbForms(word) {
  const w = word.toLowerCase();
  const irregulars = {
    'be': {past:'was',pp:'been',ger:'being',third:'is'},
    'begin': {past:'began',pp:'begun',ger:'beginning',third:'begins'},
    'break': {past:'broke',pp:'broken',ger:'breaking',third:'breaks'},
    'bring': {past:'brought',pp:'brought',ger:'bringing',third:'brings'},
    'build': {past:'built',pp:'built',ger:'building',third:'builds'},
    'buy': {past:'bought',pp:'bought',ger:'buying',third:'buys'},
    'catch': {past:'caught',pp:'caught',ger:'catching',third:'catches'},
    'choose': {past:'chose',pp:'chosen',ger:'choosing',third:'chooses'},
    'come': {past:'came',pp:'come',ger:'coming',third:'comes'},
    'cost': {past:'cost',pp:'cost',ger:'costing',third:'costs'},
    'cut': {past:'cut',pp:'cut',ger:'cutting',third:'cuts'},
    'do': {past:'did',pp:'done',ger:'doing',third:'does'},
    'draw': {past:'drew',pp:'drawn',ger:'drawing',third:'draws'},
    'drive': {past:'drove',pp:'driven',ger:'driving',third:'drives'},
    'eat': {past:'ate',pp:'eaten',ger:'eating',third:'eats'},
    'fall': {past:'fell',pp:'fallen',ger:'falling',third:'falls'},
    'feel': {past:'felt',pp:'felt',ger:'feeling',third:'feels'},
    'find': {past:'found',pp:'found',ger:'finding',third:'finds'},
    'fly': {past:'flew',pp:'flown',ger:'flying',third:'flies'},
    'forget': {past:'forgot',pp:'forgotten',ger:'forgetting',third:'forgets'},
    'get': {past:'got',pp:'got',ger:'getting',third:'gets'},
    'give': {past:'gave',pp:'given',ger:'giving',third:'gives'},
    'go': {past:'went',pp:'gone',ger:'going',third:'goes'},
    'grow': {past:'grew',pp:'grown',ger:'growing',third:'grows'},
    'have': {past:'had',pp:'had',ger:'having',third:'has'},
    'hear': {past:'heard',pp:'heard',ger:'hearing',third:'hears'},
    'hold': {past:'held',pp:'held',ger:'holding',third:'holds'},
    'keep': {past:'kept',pp:'kept',ger:'keeping',third:'keeps'},
    'know': {past:'knew',pp:'known',ger:'knowing',third:'knows'},
    'lead': {past:'led',pp:'led',ger:'leading',third:'leads'},
    'leave': {past:'left',pp:'left',ger:'leaving',third:'leaves'},
    'lend': {past:'lent',pp:'lent',ger:'lending',third:'lends'},
    'let': {past:'let',pp:'let',ger:'letting',third:'lets'},
    'lose': {past:'lost',pp:'lost',ger:'losing',third:'loses'},
    'make': {past:'made',pp:'made',ger:'making',third:'makes'},
    'mean': {past:'meant',pp:'meant',ger:'meaning',third:'means'},
    'meet': {past:'met',pp:'met',ger:'meeting',third:'meets'},
    'pay': {past:'paid',pp:'paid',ger:'paying',third:'pays'},
    'put': {past:'put',pp:'put',ger:'putting',third:'puts'},
    'read': {past:'read',pp:'read',ger:'reading',third:'reads'},
    'ride': {past:'rode',pp:'ridden',ger:'riding',third:'rides'},
    'ring': {past:'rang',pp:'rung',ger:'ringing',third:'rings'},
    'rise': {past:'rose',pp:'risen',ger:'rising',third:'rises'},
    'run': {past:'ran',pp:'run',ger:'running',third:'runs'},
    'say': {past:'said',pp:'said',ger:'saying',third:'says'},
    'see': {past:'saw',pp:'seen',ger:'seeing',third:'sees'},
    'sell': {past:'sold',pp:'sold',ger:'selling',third:'sells'},
    'send': {past:'sent',pp:'sent',ger:'sending',third:'sends'},
    'set': {past:'set',pp:'set',ger:'setting',third:'sets'},
    'show': {past:'showed',pp:'shown',ger:'showing',third:'shows'},
    'shut': {past:'shut',pp:'shut',ger:'shutting',third:'shuts'},
    'sing': {past:'sang',pp:'sung',ger:'singing',third:'sings'},
    'sit': {past:'sat',pp:'sat',ger:'sitting',third:'sits'},
    'sleep': {past:'slept',pp:'slept',ger:'sleeping',third:'sleeps'},
    'speak': {past:'spoke',pp:'spoken',ger:'speaking',third:'speaks'},
    'spend': {past:'spent',pp:'spent',ger:'spending',third:'spends'},
    'stand': {past:'stood',pp:'stood',ger:'standing',third:'stands'},
    'steal': {past:'stole',pp:'stolen',ger:'stealing',third:'steals'},
    'swim': {past:'swam',pp:'swum',ger:'swimming',third:'swims'},
    'take': {past:'took',pp:'taken',ger:'taking',third:'takes'},
    'teach': {past:'taught',pp:'taught',ger:'teaching',third:'teaches'},
    'tell': {past:'told',pp:'told',ger:'telling',third:'tells'},
    'think': {past:'thought',pp:'thought',ger:'thinking',third:'thinks'},
    'throw': {past:'threw',pp:'thrown',ger:'throwing',third:'throws'},
    'understand': {past:'understood',pp:'understood',ger:'understanding',third:'understands'},
    'wake': {past:'woke',pp:'woken',ger:'waking',third:'wakes'},
    'wear': {past:'wore',pp:'worn',ger:'wearing',third:'wears'},
    'win': {past:'won',pp:'won',ger:'winning',third:'wins'},
    'write': {past:'wrote',pp:'written',ger:'writing',third:'writes'},
    'bite': {past:'bit',pp:'bitten',ger:'biting',third:'bites'},
    'blow': {past:'blew',pp:'blown',ger:'blowing',third:'blows'},
    'freeze': {past:'froze',pp:'frozen',ger:'freezing',third:'freezes'},
    'hide': {past:'hid',pp:'hidden',ger:'hiding',third:'hides'},
    'shake': {past:'shook',pp:'shaken',ger:'shaking',third:'shakes'},
    'shoot': {past:'shot',pp:'shot',ger:'shooting',third:'shoots'},
    'slide': {past:'slid',pp:'slid',ger:'sliding',third:'slides'},
    'stick': {past:'stuck',pp:'stuck',ger:'sticking',third:'sticks'},
    'strike': {past:'struck',pp:'struck',ger:'striking',third:'strikes'},
    'tear': {past:'tore',pp:'torn',ger:'tearing',third:'tears'},
    'tread': {past:'trod',pp:'trodden',ger:'treading',third:'treads'},
    'feed': {past:'fed',pp:'fed',ger:'feeding',third:'feeds'},
    'fight': {past:'fought',pp:'fought',ger:'fighting',third:'fights'},
    'grind': {past:'ground',pp:'ground',ger:'grinding',third:'grinds'},
    'lay': {past:'laid',pp:'laid',ger:'laying',third:'lays'},
    'lie': {past:'lay',pp:'lain',ger:'lying',third:'lies'},
    'dig': {past:'dug',pp:'dug',ger:'digging',third:'digs'},
    'spin': {past:'spun',pp:'spun',ger:'spinning',third:'spins'},
    'cling': {past:'clung',pp:'clung',ger:'clinging',third:'clings'},
    'shrink': {past:'shrank',pp:'shrunk',ger:'shrinking',third:'shrinks'},
    'sink': {past:'sank',pp:'sunk',ger:'sinking',third:'sinks'},
    'spring': {past:'sprang',pp:'sprung',ger:'springing',third:'springs'},
    'sow': {past:'sowed',pp:'sown',ger:'sowing',third:'sows'},
    'sew': {past:'sewed',pp:'sewn',ger:'sewing',third:'sews'},
    'creep': {past:'crept',pp:'crept',ger:'creeping',third:'creeps'},
    'deal': {past:'dealt',pp:'dealt',ger:'dealing',third:'deals'},
    'dwell': {past:'dwelt',pp:'dwelt',ger:'dwelling',third:'dwells'},
    'kneel': {past:'knelt',pp:'knelt',ger:'kneeling',third:'kneels'},
    'lean': {past:'leant',pp:'leant',ger:'leaning',third:'leans'},
    'leap': {past:'leapt',pp:'leapt',ger:'leaping',third:'leaps'},
    'light': {past:'lit',pp:'lit',ger:'lighting',third:'lights'},
    'spell': {past:'spelt',pp:'spelt',ger:'spelling',third:'spells'},
    'spill': {past:'spilt',pp:'spilt',ger:'spilling',third:'spills'},
    'spoil': {past:'spoilt',pp:'spoilt',ger:'spoiling',third:'spoils'},
    'sweep': {past:'swept',pp:'swept',ger:'sweeping',third:'sweeps'},
    'thrust': {past:'thrust',pp:'thrust',ger:'thrusting',third:'thrusts'},
    'split': {past:'split',pp:'split',ger:'splitting',third:'splits'},
    'spread': {past:'spread',pp:'spread',ger:'spreading',third:'spreads'},
    'burst': {past:'burst',pp:'burst',ger:'bursting',third:'bursts'},
    'cast': {past:'cast',pp:'cast',ger:'casting',third:'casts'},
    'upset': {past:'upset',pp:'upset',ger:'upsetting',third:'upsets'},
    'quit': {past:'quit',pp:'quit',ger:'quitting',third:'quits'},
    'hurt': {past:'hurt',pp:'hurt',ger:'hurting',third:'hurts'},
    'bet': {past:'bet',pp:'bet',ger:'betting',third:'bets'},
    'hit': {past:'hit',pp:'hit',ger:'hitting',third:'hits'},
    'shed': {past:'shed',pp:'shed',ger:'shedding',third:'sheds'},
    'wet': {past:'wet',pp:'wet',ger:'wetting',third:'wets'},
    'rid': {past:'rid',pp:'rid',ger:'ridding',third:'rids'},
    'rid': {past:'rid',pp:'rid',ger:'ridding',third:'rids'},
    'swear': {past:'swore',pp:'sworn',ger:'swearing',third:'swears'},
    'bear': {past:'bore',pp:'born',ger:'bearing',third:'bears'},
    'forgive': {past:'forgave',pp:'forgiven',ger:'forgiving',third:'forgives'},
    'forbid': {past:'forbade',pp:'forbidden',ger:'forbidding',third:'forbids'},
    'arise': {past:'arose',pp:'arisen',ger:'arising',third:'arises'},
    'awake': {past:'awoke',pp:'awoken',ger:'awaking',third:'awakes'},
    'override': {past:'overrode',pp:'overridden',ger:'overriding',third:'overrides'},
    'undergo': {past:'underwent',pp:'undergone',ger:'undergoing',third:'undergoes'},
    'withhold': {past:'withheld',pp:'withheld',ger:'withholding',third:'withholds'},
    'withstand': {past:'withstood',pp:'withstood',ger:'withstanding',third:'withstands'},
    'overcome': {past:'overcame',pp:'overcome',ger:'overcoming',third:'overcomes'},
    'undo': {past:'undid',pp:'undone',ger:'undoing',third:'undoes'},
    'withdraw': {past:'withdrew',pp:'withdrawn',ger:'withdrawing',third:'withdraws'},
    'rewind': {past:'rewound',pp:'rewound',ger:'rewinding',third:'rewinds'},
    'bind': {past:'bound',pp:'bound',ger:'binding',third:'binds'},
    'wind': {past:'wound',pp:'wound',ger:'winding',third:'winds'},
    'fling': {past:'flung',pp:'flung',ger:'flinging',third:'flings'},
    'sling': {past:'slung',pp:'slung',ger:'slinging',third:'slings'},
    'sting': {past:'stung',pp:'stung',ger:'stinging',third:'stings'},
    'stink': {past:'stank',pp:'stunk',ger:'stinking',third:'stinks'},
    'wring': {past:'wrung',pp:'wrung',ger:'wringing',third:'wrings'},
    'ring': {past:'rang',pp:'rung',ger:'ringing',third:'rings'},
    'hang': {past:'hung',pp:'hung',ger:'hanging',third:'hangs'},
    'dive': {past:'dove',pp:'dived',ger:'diving',third:'dives'},
    'strive': {past:'strove',pp:'striven',ger:'striving',third:'strives'},
    'strew': {past:'strewed',pp:'strewn',ger:'strewing',third:'strews'},
    'thrive': {past:'thrived',pp:'thrived',ger:'thriving',third:'thrives'},
    'weave': {past:'wove',pp:'woven',ger:'weaving',third:'weaves'},
    'swell': {past:'swelled',pp:'swollen',ger:'swelling',third:'swells'},
    'wake': {past:'woke',pp:'woken',ger:'waking',third:'wakes'},
    'shine': {past:'shone',pp:'shone',ger:'shining',third:'shines'},
    'sow': {past:'sowed',pp:'sown',ger:'sowing',third:'sows'},
    'forsake': {past:'forsook',pp:'forsaken',ger:'forsaking',third:'forsakes'},
    'stride': {past:'strode',pp:'stridden',ger:'striding',third:'strides'},
    'smite': {past:'smote',pp:'smitten',ger:'smiting',third:'smites'},
    'outdo': {past:'outdid',pp:'outdone',ger:'outdoing',third:'outdoes'},
    'overdo': {past:'overdid',pp:'overdone',ger:'overdoing',third:'overdoes'},
    'redo': {past:'redid',pp:'redone',ger:'redoing',third:'redoes'},
    'misdo': {past:'misdid',pp:'misdone',ger:'misdoing',third:'misdoes'},
    'partake': {past:'partook',pp:'partaken',ger:'partaking',third:'partakes'},
    'beware': {past:'beware',pp:'beware',ger:'beware',third:'beware'},
    'broadcast': {past:'broadcast',pp:'broadcast',ger:'broadcasting',third:'broadcasts'},
    'forecast': {past:'forecast',pp:'forecast',ger:'forecasting',third:'forecasts'},
    'offset': {past:'offset',pp:'offset',ger:'offsetting',third:'offsets'},
    'undercut': {past:'undercut',pp:'undercut',ger:'undercutting',third:'undercuts'},
    'misread': {past:'misread',pp:'misread',ger:'misreading',third:'misreads'},
    'mislead': {past:'misled',pp:'misled',ger:'misleading',third:'misleads'},
    'mistake': {past:'mistook',pp:'mistaken',ger:'mistaking',third:'mistakes'},
    'misunderstand': {past:'misunderstood',pp:'misunderstood',ger:'misunderstanding',third:'misunderstands'},
    'mishear': {past:'misheard',pp:'misheard',ger:'mishearing',third:'mishears'},
    'mislay': {past:'mislaid',pp:'mislaid',ger:'mislaying',third:'mislays'},
    'misspell': {past:'misspelt',pp:'misspelt',ger:'misspelling',third:'misspells'},
    'misspend': {past:'misspent',pp:'misspent',ger:'misspending',third:'misspends'},
    'outrun': {past:'outran',pp:'outrun',ger:'outrunning',third:'outruns'},
    'outgrow': {past:'outgrew',pp:'outgrown',ger:'outgrowing',third:'outgrows'},
    'outbid': {past:'outbid',pp:'outbid',ger:'outbidding',third:'outbids'},
    'outsell': {past:'outsold',pp:'outsold',ger:'outselling',third:'outsells'},
    'overdraw': {past:'overdrew',pp:'overdrawn',ger:'overdrawing',third:'overdraws'},
    'overeat': {past:'overate',pp:'overeaten',ger:'overeating',third:'overeats'},
    'overhang': {past:'overhung',pp:'overhung',ger:'overhanging',third:'overhangs'},
    'overhear': {past:'overheard',pp:'overheard',ger:'overhearing',third:'overhears'},
    'overrun': {past:'overran',pp:'overrun',ger:'overrunning',third:'overruns'},
    'oversee': {past:'oversaw',pp:'overseen',ger:'overseeing',third:'oversees'},
    'overtake': {past:'overtook',pp:'overtaken',ger:'overtaking',third:'overtakes'},
    'overthrow': {past:'overthrew',pp:'overthrown',ger:'overthrowing',third:'overthrows'},
    'overfly': {past:'overflew',pp:'overflown',ger:'overflying',third:'overflies'},
    'overshoot': {past:'overshot',pp:'overshot',ger:'overshooting',third:'overshoots'},
    'underpay': {past:'underpaid',pp:'underpaid',ger:'underpaying',third:'underpays'},
    'underbid': {past:'underbid',pp:'underbid',ger:'underbidding',third:'underbids'},
    'underlie': {past:'underlay',pp:'underlain',ger:'underlying',third:'underlies'},
    'underwrite': {past:'underwrote',pp:'underwritten',ger:'underwriting',third:'underwrites'},
    'unknit': {past:'unknit',pp:'unknit',ger:'unknitting',third:'unknits'},
    'unwind': {past:'unwound',pp:'unwound',ger:'unwinding',third:'unwinds'},
    'uphold': {past:'upheld',pp:'upheld',ger:'upholding',third:'upholds'},
    'waylay': {past:'waylaid',pp:'waylaid',ger:'waylaying',third:'waylays'},
    'remake': {past:'remade',pp:'remade',ger:'remaking',third:'remakes'},
    'relay': {past:'relaid',pp:'relaid',ger:'relaying',third:'relays'},
    'retake': {past:'retook',pp:'retaken',ger:'retaking',third:'retakes'},
    'retell': {past:'retold',pp:'retold',ger:'retelling',third:'retells'},
    'resell': {past:'resold',pp:'resold',ger:'reselling',third:'resells'},
    'reset': {past:'reset',pp:'reset',ger:'resetting',third:'resets'},
    'rerun': {past:'reran',pp:'rerun',ger:'rerunning',third:'reruns'},
    'rewrite': {past:'rewrote',pp:'rewritten',ger:'rewriting',third:'rewrites'},
    'recast': {past:'recast',pp:'recast',ger:'recasting',third:'recasts'},
    'unmake': {past:'unmade',pp:'unmade',ger:'unmaking',third:'unmakes'},
    'unsee': {past:'unsaw',pp:'unseen',ger:'unseeing',third:'unsees'},
    'unsay': {past:'unsaid',pp:'unsaid',ger:'unsaying',third:'unsays'},
    'slay': {past:'slew',pp:'slain',ger:'slaying',third:'slays'},
  };

  if (irregulars[w]) return irregulars[w];

  let past, pp, ger, third;

  if (w.endsWith('e')) {
    past = w + 'd';
    pp = w + 'd';
    ger = w.slice(0, -1) + 'ing';
    third = w + 's';
  } else if (w.endsWith('y') && w.length > 1 && !'aeiou'.includes(w[w.length - 2])) {
    past = w.slice(0, -1) + 'ied';
    pp = w.slice(0, -1) + 'ied';
    ger = w + 'ing';
    third = w.slice(0, -1) + 'ies';
  } else if (w.endsWith('w') || w.endsWith('x') || w.endsWith('s') || w.endsWith('z') || w.endsWith('ch') || w.endsWith('sh')) {
    past = w + 'ed';
    pp = w + 'ed';
    ger = w + 'ing';
    third = w + 'es';
  } else {
    const len = w.length;
    if (len >= 3) {
      const c1 = !'aeiou'.includes(w[len-3]);
      const v = 'aeiou'.includes(w[len-2]);
      const c2 = !'aeiou'.includes(w[len-1]) && !'wxys'.includes(w[len-1]);
      if (c1 && v && c2 && len <= 5) {
        past = w + w[len-1] + 'ed';
        pp = w + w[len-1] + 'ed';
        ger = w + w[len-1] + 'ing';
        third = w + 's';
        return {past, pp, ger, third};
      }
    }
    past = w + 'ed';
    pp = w + 'ed';
    ger = w + 'ing';
    third = w + 's';
  }

  return {past, pp, ger, third};
}

const verbExamples = [
  'She decided to %w the problem carefully.',
  'They will %w the project by next week.',
  'He tried to %w the situation effectively.',
  'We should %w this opportunity right away.',
  'The team worked hard to %w their goals.',
  'You need to %w this matter seriously.',
  'It was important to %w all the details.',
  'They managed to %w the challenge together.',
  'He promised to %w the issue promptly.',
  'She learned to %w with the new system.',
  'The company plans to %w next quarter.',
  'We must %w before it is too late.',
  'Can you %w this task for me?',
  'They decided to %w a different approach.',
  'She continued to %w despite the difficulties.',
];

const nounExamples = [
  'The %w was very important to the project.',
  'She studied the %w extensively.',
  'He explained the concept of %w clearly.',
  'There was a lot of %w in the discussion.',
  'The %w played a key role in the outcome.',
  'They analyzed the %w from different angles.',
  'This %w is commonly used in daily life.',
  'The report highlighted the significance of %w.',
  'Everyone acknowledged the importance of %w.',
  'He wrote a detailed paper on %w.',
  'The %w changed everything about the plan.',
  'She devoted her career to studying %w.',
  'They measured the %w accurately.',
  'The %w was discussed at length in the meeting.',
  'Understanding %w requires careful analysis.',
];

const adjExamples = [
  'The result was quite %w.',
  'She gave a %w explanation of the topic.',
  'He found the experience very %w.',
  'This approach proved to be %w.',
  'The %w conditions made it difficult.',
  'They were impressed by the %w performance.',
  'It was a %w decision that changed everything.',
  'The %w atmosphere contributed to the success.',
  'She wore a %w dress to the event.',
  'The %w response surprised everyone.',
  'He made a %w observation about the data.',
  'They lived in a %w neighborhood.',
  'The %w color caught her attention.',
  'His %w attitude impressed the interviewer.',
  'The %w design won several awards.',
];

const advExamples = [
  'She spoke %w during the presentation.',
  'He %w completed the assignment on time.',
  'They worked %w to meet the deadline.',
  'The system %w handles all the data.',
  'She %w explained the complex concept.',
  'He %w approached the difficult problem.',
  'The project was %w executed from start to finish.',
  'They %w responded to every challenge.',
  'She %w managed the entire team.',
  'He %w solved the equation in minutes.',
  'The train arrived %w at the station.',
  'They %w organized the entire event.',
  'She %w navigated through the traffic.',
  'He %w adapted to the new environment.',
  'The team %w collaborated on the project.',
];

const otherExamples = [
  'The word %w is frequently used in English.',
  'Students should learn to use %w correctly.',
  'The teacher explained the meaning of %w.',
  'Understanding %w is essential for fluency.',
  'She practiced using %w in her sentences.',
  'The textbook provides examples with %w.',
  'He noted the correct usage of %w.',
  'They discussed the role of %w in grammar.',
];

function getExample(word, pos) {
  const w = word.toLowerCase();
  let pool;
  switch(pos) {
    case 'verb': pool = verbExamples; break;
    case 'noun': pool = nounExamples; break;
    case 'adjective': pool = adjExamples; break;
    case 'adverb': pool = advExamples; break;
    default: pool = otherExamples;
  }
  const idx = hashCode(w) % pool.length;
  return pool[idx].replace(/%w/g, w);
}

let processed = 0;
for (const entry of data.words) {
  const w = entry.w.toLowerCase();
  const pos = entry.p || 'noun';

  entry.pron = getIPA(w, pos);

  if (pos === 'verb') {
    entry.forms = getVerbForms(w);
  } else {
    entry.forms = null;
  }

  entry.example = getExample(w, pos);

  processed++;
  if (processed % 500 === 0) {
    console.log('Processed ' + processed + ' words...');
  }
}

console.log('Total words processed: ' + processed);

const output = JSON.stringify(data);
fs.writeFileSync(dictPath, output, 'utf8');
console.log('dictionary.json updated successfully!');

const stats = {
  total: data.words.length,
  withPron: data.words.filter(function(w) { return w.pron; }).length,
  withForms: data.words.filter(function(w) { return w.forms; }).length,
  withExample: data.words.filter(function(w) { return w.example; }).length,
};
console.log('Stats:', JSON.stringify(stats));
