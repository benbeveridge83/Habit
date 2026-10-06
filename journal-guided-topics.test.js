// Run with: node --test journal-guided-topics.test.js (requires Playwright).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

let browser, server, origin;
before(async () => {
  server = createServer(async (req, res) => {
    try {
      const file = path.join(__dirname, decodeURIComponent(new URL(req.url, 'http://localhost').pathname === '/' ? 'index.html' : new URL(req.url, 'http://localhost').pathname));
      const content = await readFile(file);
      res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
      res.end(content);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
});
after(async () => { await browser?.close(); await new Promise(resolve => server ? server.close(resolve) : resolve()); });

const headings = [
  { id: 'family', title: 'Family', parentId: null, order: 0 },
  { id: 'children', title: 'Children', parentId: 'family', order: 0, prompt: 'What did we enjoy together?' },
  { id: 'work', title: 'Work', parentId: null, order: 1 }
];
async function openJournal(t, topics = headings, mobile = false) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 } });
  t.after(() => context.close());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // No production account or cloud records are used. Only the external auth SDK and
  // speech service are replaced; the app, MediaRecorder and IndexedDB are real.
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'text/javascript', body:
    'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};' }));
  await page.route('**/*.supabase.co/**', route => route.abort());
  await page.addInitScript(({ topics }) => {
    if (!localStorage.getItem('journal-fixture')) {
      localStorage.setItem('journal-fixture', '1');
      localStorage.setItem('my_habit_app_v2', JSON.stringify({ journal: { headings: topics, selectedHeadingId: null, loadedId: null,
        entries: [{ id: 'legacy', title: 'Earlier journal', body: 'Keep this old entry.', entryDate: '2026-09-01', segments: [] }] } }));
    }
    window.SpeechRecognition = class {
      start() { window.testRecognition = this; }
      stop() { if (window.deferSpeechEnd) { (window.pendingTestRecognizers ||= []).push(this); return; } queueMicrotask(() => this.onend?.()); }
      abort() { this.stop(); }
    };
    window.sayForJournalTest = (text, final = true) => {
      const result = [{ transcript: text }]; result.isFinal = final;
      window.testRecognition.onresult({ resultIndex: 0, results: [result] });
    };
  }, { topics });
  await page.goto(origin);
  await page.waitForFunction(() => typeof renderJournal === 'function' && typeof authReady !== 'undefined' && authReady);
  await page.evaluate(() => {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appShell').classList.remove('authPending');
    showTab('journal');
  });
  t.after(() => assert.deepEqual(errors, [], 'No uncaught application errors'));
  return page;
}

test('journal presents topics, while hierarchy and prompt editing stay in settings', async t => {
  const page = await openJournal(t);
  assert.equal(await page.locator('[data-journal-topic]').count(), 3);
  assert.equal(await page.locator('#journalAddRootBtn').isVisible(), false);
  assert.match(await page.locator('#journalTopicGuide').innerText(), /What did we enjoy together/);
  await page.getByRole('button', { name: 'Topic settings', exact: true }).click();
  assert.equal(await page.locator('#journalAddRootBtn').isVisible(), true);
  await page.locator('#journalOutlineTree .journalOutlineRow').filter({ hasText: 'Children' }).click();
  await page.locator('#journalHeadingIdea').fill('One thing to remember from today');
  page.once('dialog', dialog => dialog.accept('School'));
  await page.locator('#journalAddChildBtn').click();
  await page.getByRole('button', { name: 'Done with settings' }).click();
  assert.equal(await page.locator('[data-journal-topic]').count(), 4);
  assert.match(await page.locator('#journalTopicGuide').innerText(), /One thing to remember from today/);
  assert.equal(await page.locator('#journalAddRootBtn').isVisible(), false);
});

test('coverage belongs to the saved entry, resets for new entries, and can be undone', async t => {
  const page = await openJournal(t);
  await page.locator('[data-journal-topic="work"]').click();
  await page.locator('[data-journal-covered="family"]').click();
  await page.locator('[data-journal-covered="children"]').click();
  assert.match(await page.locator('#journalTopicProgress').innerText(), /2 of 3/);
  assert.match(await page.locator('#journalActiveHeading').innerText(), /Work/);
  await page.locator('#journalTitle').fill('My guided journal');
  await page.locator('#journalBody').fill('Typed thoughts are preserved.');
  await page.locator('#saveEntryBtn').click();
  await page.waitForFunction(() => state.journal.entries.some(e => e.title === 'My guided journal'));
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('my_habit_app_v2')).journal.entries.find(e => e.title === 'My guided journal'));
  assert.deepEqual(saved.coveredHeadingIds, ['family', 'children']);
  await page.locator('#newEntryBtn').click();
  assert.match(await page.locator('#journalTopicProgress').innerText(), /0 of 3/);
  await page.locator('[data-journal-entry]').filter({ hasText: 'My guided journal' }).click();
  assert.match(await page.locator('#journalTopicProgress').innerText(), /2 of 3/);
  assert.equal(await page.locator('#journalBody').inputValue(), 'Typed thoughts are preserved.');
  await page.locator('[data-journal-covered="family"]').click();
  await page.locator('#saveEntryBtn').click();
  await page.reload();
  await page.waitForFunction(() => typeof authReady !== 'undefined' && authReady);
  await page.evaluate(() => { document.getElementById('authScreen').style.display = 'none'; document.getElementById('appShell').classList.remove('authPending'); showTab('journal'); });
  await page.locator('[data-journal-entry]').filter({ hasText: 'My guided journal' }).click();
  assert.match(await page.locator('#journalTopicProgress').innerText(), /1 of 3/);
  await page.locator('[data-journal-entry="legacy"]').click();
  assert.match(await page.locator('#journalTopicProgress').innerText(), /0 of 3/);
  assert.equal(await page.locator('#journalBody').inputValue(), 'Keep this old entry.');
});

test('topic selection routes speech, coverage leaves recording running, and saved audio survives', async t => {
  const page = await openJournal(t);
  await page.locator('[data-journal-topic="family"]').click();
  await page.locator('#journalVoiceBtn').click();
  await page.waitForFunction(() => document.getElementById('journalVoiceBtn').classList.contains('listening'));
  await page.evaluate(() => sayForJournalTest('We had dinner together.'));
  assert.equal(await page.locator('[data-jseg-delete]').first().isDisabled(), true);
  await page.locator('[data-journal-covered="family"]').click();
  assert.equal(await page.locator('#journalVoiceBtn').evaluate(el => el.classList.contains('listening')), true);
  assert.equal(await page.locator('#newEntryBtn').isDisabled(), true);
  await page.locator('[data-journal-topic="children"]').click();
  await page.evaluate(() => sayForJournalTest('We read a book.'));
  await page.locator('[data-journal-covered="children"]').click();
  await page.locator('#journalPauseBtn').click();
  await page.locator('#journalPauseBtn').click();
  await page.evaluate(() => sayForJournalTest('Then we talked.'));
  await page.locator('#journalVoiceBtn').click();
  await page.waitForFunction(() => !document.getElementById('saveEntryBtn').disabled);
  assert.equal(await page.locator('[data-jseg-delete]').first().isDisabled(), false);
  await page.locator('#journalTitle').fill('Voice journal');
  await page.locator('#saveEntryBtn').click();
  await page.waitForFunction(() => state.journal.entries.some(e => e.title === 'Voice journal' && e.audioId));
  const saved = await page.evaluate(async () => {
    const entry = state.journal.entries.find(e => e.title === 'Voice journal');
    return { entry, audioSize: (await getJournalAudio(entry.audioId))?.size };
  });
  assert.deepEqual(saved.entry.segments.map(s => [s.headingId, s.text]), [
    ['family', 'We had dinner together.'], ['children', 'We read a book.'], ['children', 'Then we talked.']
  ]);
  assert.deepEqual(saved.entry.coveredHeadingIds, ['family', 'children']);
  assert.ok(saved.audioSize > 0);
  await page.locator('#newEntryBtn').click();
  await page.locator('[data-journal-entry]').filter({ hasText: 'Voice journal' }).click();
  await page.waitForFunction(() => document.getElementById('journalAudioPlayer').style.display === 'block');
});

test('speech revisions and late final results stay accurate under the original topic', async t => {
  const page = await openJournal(t);
  await page.locator('[data-journal-topic="family"]').click();
  await page.locator('#journalVoiceBtn').click();
  await page.waitForFunction(() => !!window.testRecognition);
  await page.evaluate(() => {
    const result = (text, final) => Object.assign([{ transcript: text }], { isFinal: final });
    testRecognition.onresult({ resultIndex: 0, results: [result('Dinner together.', true), result('Withdraw this hypothesis.', false)] });
    testRecognition.onresult({ resultIndex: 1, results: [result('Dinner together.', true)] });
  });
  assert.deepEqual(await page.evaluate(() => journalDraftSegments.map(s => s.text)), ['Dinner together.']);
  await page.evaluate(() => {
    const result = (text, final) => Object.assign([{ transcript: text }], { isFinal: final });
    testRecognition.onresult({ resultIndex: 1, results: [result('Dinner together.', true), result('At home', false)] });
    window.deferSpeechEnd = true; window.familyRecognition = testRecognition;
  });
  await page.locator('[data-journal-topic="children"]').click();
  await page.evaluate(() => {
    const result = text => Object.assign([{ transcript: text }], { isFinal: true });
    familyRecognition.onresult({ resultIndex: 1, results: [result('Dinner together.'), result('At home.')] });
    familyRecognition.onend();
    sayForJournalTest('Delete this interim text.', false);
    testRecognition.onresult({ resultIndex: 0, results: [] });
  });
  assert.deepEqual(await page.evaluate(() => journalDraftSegments.map(s => [s.headingId, s.text])), [['family', 'Dinner together. At home.']]);
  await page.locator('#journalVoiceBtn').click();
  await page.evaluate(() => { pendingTestRecognizers.forEach(recognition => recognition.onend()); });
  await page.waitForFunction(() => !document.getElementById('saveEntryBtn').disabled);
});

test('declined microphone permission releases entry and settings controls', async t => {
  const page = await openJournal(t);
  await page.evaluate(() => { navigator.mediaDevices.getUserMedia = async () => { throw new Error('Permission denied'); }; });
  await page.locator('#journalVoiceBtn').click();
  await page.waitForFunction(() => document.getElementById('journalVoiceStatus').textContent.includes('Permission denied'));
  assert.equal(await page.locator('#saveEntryBtn').isDisabled(), false);
  assert.equal(await page.locator('#newEntryBtn').isDisabled(), false);
  assert.equal(await page.locator('#journalTopicSettingsBtn').isDisabled(), false);
});

test('empty topics offer settings and mobile topic buttons remain within the screen', async t => {
  const empty = await openJournal(t, [], true);
  assert.match(await empty.locator('#journalTopicGuide').innerText(), /Add.*topic/i);
  const page = await openJournal(t, [...headings, { id: 'safe', title: '<img src=x onerror="alert(1)">', parentId: 'children', order: 0 }], true);
  assert.equal(await page.locator('#journalTopicGuide img').count(), 0);
  const overflows = await page.locator('[data-journal-topic], [data-journal-covered]').evaluateAll(nodes => nodes.filter(node => {
    const rect = node.getBoundingClientRect(); return rect.left < 0 || rect.right > innerWidth;
  }).length);
  assert.equal(overflows, 0);
});
