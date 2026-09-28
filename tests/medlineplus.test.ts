/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildSearchUrl, decodeEntities, htmlToText, isAllowedServiceUrl, isAllowedTopicUrl, parseSearchResults,
} from '../src/logic/medlineplus.ts';

// Respuesta de ejemplo con la forma del servicio de MedlinePlus: el contenido
// de cada <content> es HTML escapado dentro del XML.
const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<nlmSearchResult>
<term>prostatitis</term>
<count>2</count>
<list num="3" start="0" per="10">
<document rank="0" url="https://medlineplus.gov/spanish/prostatediseases.html">
<content name="title">Enfermedades de la &lt;span class=&quot;qt0&quot;&gt;próstata&lt;/span&gt;</content>
<content name="organizationName">Biblioteca Nacional de Medicina</content>
<content name="altTitle">Problemas de la próstata</content>
<content name="FullSummary">&lt;p&gt;La próstata es una glándula.&lt;/p&gt;&lt;ul&gt;&lt;li&gt;&lt;span class=&quot;qt0&quot;&gt;Prostatitis&lt;/span&gt;: inflamación&lt;/li&gt;&lt;li&gt;Cáncer &amp;amp; otros&lt;/li&gt;&lt;/ul&gt;</content>
</document>
<document rank="1" url="https://example.com/malicioso.html">
<content name="title">No debe aparecer</content>
</document>
<document rank="2" url="https://medlineplus.gov/spanish/ency/article/000524.htm">
<content name="title">Prostatitis bacteriana</content>
<content name="snippet">Infección de la &lt;b&gt;próstata&lt;/b&gt;&lt;script&gt;alert(1)&lt;/script&gt;</content>
</document>
</list>
</nlmSearchResult>`;

test('MedlinePlus: arma la URL solo con el término', () => {
  const url = buildSearchUrl('  dolor   pélvico ');
  assert.equal(url, 'https://wsearch.nlm.nih.gov/ws/query?db=healthTopicsSpanish&term=dolor%20p%C3%A9lvico&retmax=10');
  assert.throws(() => buildSearchUrl('   '));
  assert.ok(buildSearchUrl('a'.repeat(500)).length < 200);
  assert.ok(!buildSearchUrl('x&db=otra').includes('&db=otra'));
});

test('MedlinePlus: solo acepta dominios oficiales', () => {
  assert.ok(isAllowedTopicUrl('https://medlineplus.gov/spanish/prostatediseases.html'));
  assert.ok(isAllowedTopicUrl('https://www.medlineplus.gov/x'));
  assert.ok(!isAllowedTopicUrl('http://medlineplus.gov/x'));
  assert.ok(!isAllowedTopicUrl('https://medlineplus.gov.evil.com/x'));
  assert.ok(!isAllowedTopicUrl('https://evilmedlineplus.gov/x'));
  assert.ok(!isAllowedTopicUrl('javascript:alert(1)'));
  assert.ok(isAllowedServiceUrl('https://wsearch.nlm.nih.gov/ws/query?db=x'));
  assert.ok(!isAllowedServiceUrl('https://wsearch.nlm.nih.gov.evil.com/'));
});

test('MedlinePlus: convierte la respuesta a texto plano', () => {
  const topics = parseSearchResults(SAMPLE);
  assert.equal(topics.length, 2);
  assert.equal(topics[0].title, 'Enfermedades de la próstata');
  assert.equal(topics[0].url, 'https://medlineplus.gov/spanish/prostatediseases.html');
  assert.deepEqual(topics[0].otherNames, ['Problemas de la próstata']);
  assert.match(topics[0].summary, /^La próstata es una glándula\.\n\n• Prostatitis: inflamación\n• Cáncer & otros$/);
  assert.equal(topics[1].title, 'Prostatitis bacteriana');
  assert.equal(topics[1].summary, 'Infección de la próstata');
  assert.ok(topics.every((t) => !/[<>]/.test(t.summary + t.title)));
});

test('MedlinePlus: entidades y respuestas vacías', () => {
  assert.equal(decodeEntities('&aacute;&#233;&#x00ED;&amp;&unknown;'), 'áéí&&unknown;');
  assert.equal(htmlToText('<p>Uno</p><p>Dos<br>Tres</p>'), 'Uno\n\nDos\nTres');
  assert.deepEqual(parseSearchResults(''), []);
  assert.deepEqual(parseSearchResults('<html>error</html>'), []);
});
