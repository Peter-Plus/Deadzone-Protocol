import test from 'node:test';
import assert from 'node:assert/strict';
import { RangeInput } from '../.test-build/input/range-input.js';

test('short clicks and taps survive between ticks; pause clears held and pending inputs', () => {
  const originalWindow = globalThis.window, originalDocument = globalThis.document;
  globalThis.window = new EventTarget(); globalThis.document = new EventTarget();
  const canvas = new EventTarget(); canvas.focus = () => {};
  const send = (target, name, fields) => target.dispatchEvent(Object.assign(new Event(name, { cancelable: true }), fields));
  let input;
  try {
    input = new RangeInput(canvas, () => input.stop(), () => {}); input.start('window');
    send(canvas, 'mousedown', { button: 0 }); send(window, 'mouseup', { button: 0 });
    assert.equal(input.sample().fire, true); assert.equal(input.sample().fire, false);
    send(window, 'keydown', { code: 'KeyF', repeat: false }); send(window, 'keyup', { code: 'KeyF' });
    assert.equal(input.sample().fire, true); assert.equal(input.sample().fire, false);
    send(window, 'keydown', { code: 'KeyW', repeat: false });
    send(window, 'keydown', { code: 'Space', repeat: false });
    send(canvas, 'mousedown', { button: 0 });
    send(window, 'blur', {}); input.start('window');
    assert.deepEqual(input.sample(), { forward: 0, right: 0, fire: false, jump: false, reload: false });
  } finally { input?.dispose(); globalThis.window = originalWindow; globalThis.document = originalDocument; }
});
