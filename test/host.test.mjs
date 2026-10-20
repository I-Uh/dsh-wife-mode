// Offline check of the Host half: one section whose text follows the per-Session
// switch, keyed by the Agent id that the assembly passes as `scope`.
import { apply, Config } from '../index.js';

const sections = [];
const ctx = {
  effect(fn) {
    return fn();
  },
  on() {},
  inject() {},
  systemPrompt: {
    section(section) {
      sections.push(section);
      return () => {};
    },
  },
};

const config = Config({ sessions: [] });

// The Loader keeps volatile fields as reactive references and refreshes them
// in place; simulate that so the switch can be flipped during the test.
let stored = [];
config.sessions = { get: () => stored };

apply(ctx, config);

if (sections.length !== 1) throw new Error(`expected exactly one section, got ${sections.length}`);
const [section] = sections;
console.log('section registered:', section.name, 'order', section.order);

const A = 'session-a';
const B = 'session-b';
const textFor = (id) => section.text({ scope: { id } });

if (textFor(A) !== '') throw new Error('a Session that is off must render empty text');
console.log('all off: empty for A and B');

stored = [A];
if (textFor(B) !== '') throw new Error('B must stay empty while only A is on');
if (!textFor(A).includes('人妻模式')) throw new Error('A must receive the persona');
console.log('A on, B off: A', textFor(A).length, 'chars / B', textFor(B).length, 'chars');

stored = [A, B];
if (textFor(B).length === 0) throw new Error('B must receive the persona once switched on');
console.log('A and B on: B', textFor(B).length, 'chars');

stored = [B];
if (textFor(A) !== '') throw new Error('A must clear when switched off');
if (!textFor(B).includes('人妻模式')) throw new Error('B must keep the persona');
console.log('A off, B on: A', textFor(A).length, 'chars / B', textFor(B).length, 'chars');

if (section.text({}) !== '') throw new Error('an assembly without a scope must render empty text');
if (section.text({ scope: {} }) !== '') throw new Error('an assembly without a Session id must render empty text');
console.log('no scope / no id: empty');

console.log('ALL HOST CHECKS PASSED');
