import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { getCachedSearch, listCachedTerms, saveCachedSearch, setSetting } from '../db/repo.ts';
import { isAllowedTopicUrl, MAX_TERM_LENGTH, normalizeTerm, SUGGESTED_TOPICS, type MedlineTopic } from '../logic/medlineplus.ts';
import { isMedlineEnabled, MEDLINE_SETTING, searchMedlinePlus } from '../net/medlineplus.ts';
import { Banner, Body, Button, Card, Chip, Subtitle } from '../ui/components.tsx';
import { Input } from '../ui/keyboard.tsx';
import { colors, space } from '../ui/theme.ts';

const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export function MedlinePlusSection({ suggested }: { suggested: string[] }) {
  const topics = suggested.length ? suggested : SUGGESTED_TOPICS;
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<MedlineTopic[] | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    isMedlineEnabled().then(setEnabled);
    listCachedTerms().then(setRecent);
  }, []);

  const enable = async () => {
    await setSetting(MEDLINE_SETTING, '1');
    setEnabled(true);
  };

  const search = async (raw: string) => {
    const t = normalizeTerm(raw);
    if (!t) return;
    setTerm(t);
    setError(null);
    setOpen(null);
    setLoading(true);
    try {
      const found = await searchMedlinePlus(t);
      await saveCachedSearch(t, found);
      setResults(found);
      setSavedAt(null);
      setRecent(await listCachedTerms());
    } catch (e) {
      // Sin conexión: se muestra la última copia guardada, si existe.
      const cached = await getCachedSearch(t);
      if (cached) {
        setResults(cached.results);
        setSavedAt(cached.fetchedAt);
      } else {
        setResults(null);
      }
      setError(e instanceof Error ? e.message : 'No se pudo consultar MedlinePlus.');
    } finally {
      setLoading(false);
    }
  };

  const showCached = async (t: string) => {
    const cached = await getCachedSearch(t);
    if (!cached) return;
    setTerm(t);
    setError(null);
    setOpen(null);
    setResults(cached.results);
    setSavedAt(cached.fetchedAt);
  };

  if (enabled === null) return null;

  if (!enabled) {
    return (
      <Card>
        <Subtitle>📚 MedlinePlus</Subtitle>
        <Body>
          Información médica confiable y gratuita en español, de la Biblioteca Nacional de Medicina de EE. UU.
        </Body>
        <View style={{ height: space.sm }} />
        <Body muted>
          Para buscar, la app se conecta a internet solo con MedlinePlus y envía únicamente el tema que escribes
          (por ejemplo, "prostatitis"). No envía tus registros ni datos personales. Como cualquier sitio web,
          MedlinePlus puede ver tu dirección IP y lo que buscas.
        </Body>
        <Button label="Activar consultas a MedlinePlus" onPress={enable} />
        {recent.length > 0 && (
          <>
            <View style={{ height: space.md }} />
            <Body muted>Búsquedas guardadas (se leen sin internet):</Body>
            <View style={styles.chips}>
              {recent.map((r) => <Chip key={r} label={capitalize(r)} selected={false} onPress={() => showCached(r)} />)}
            </View>
          </>
        )}
        {results && <Results results={results} open={open} setOpen={setOpen} savedAt={savedAt} term={term} />}
      </Card>
    );
  }

  return (
    <View>
      <Card>
        <Subtitle>📚 MedlinePlus</Subtitle>
        <Body muted>Información de la Biblioteca Nacional de Medicina de EE. UU. Solo se envía el tema que buscas.</Body>
        <View style={styles.searchRow}>
          <Input
            style={styles.input}
            value={term}
            onChangeText={setTerm}
            placeholder="Busca un tema (ej. prostatitis)"
            placeholderTextColor={colors.muted}
            maxLength={MAX_TERM_LENGTH}
            returnKeyType="search"
            onSubmitEditing={() => search(term)}
            autoCorrect={false}
          />
        </View>
        <Button label="Buscar" disabled={loading || !normalizeTerm(term)} onPress={() => search(term)} />
        <View style={styles.chips}>
          {topics.map((t) => <Chip key={t} label={t} selected={false} onPress={() => search(t)} />)}
        </View>
        {recent.length > 0 && (
          <>
            <View style={{ height: space.sm }} />
            <Body muted>Guardadas en tu teléfono:</Body>
            <View style={styles.chips}>
              {recent.map((r) => <Chip key={r} label={capitalize(r)} selected={false} onPress={() => showCached(r)} />)}
            </View>
          </>
        )}
      </Card>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: space.lg }} />}
      {error && (
        <Banner kind="warn">
          <Body>{error}{savedAt ? ' Te mostramos la copia guardada.' : ''}</Body>
        </Banner>
      )}
      {results && !loading && <Results results={results} open={open} setOpen={setOpen} savedAt={savedAt} term={term} />}
    </View>
  );
}

function Results({
  results, open, setOpen, savedAt, term,
}: {
  results: MedlineTopic[]; open: string | null; setOpen: (u: string | null) => void; savedAt: string | null; term: string;
}) {
  if (results.length === 0) {
    return (
      <Card>
        <Body muted>No se encontraron temas para "{capitalize(term)}". Prueba con otras palabras.</Body>
      </Card>
    );
  }
  return (
    <View>
      {savedAt && <Body muted>Copia guardada el {formatDate(savedAt)}.</Body>}
      {results.map((r) => {
        const isOpen = open === r.url;
        return (
          <Pressable key={r.url} onPress={() => setOpen(isOpen ? null : r.url)}>
            <Card>
              <Subtitle>{r.title}</Subtitle>
              {r.otherNames.length > 0 && <Body muted>También: {r.otherNames.join(', ')}</Body>}
              {!!r.summary && (
                <Text style={styles.summary} numberOfLines={isOpen ? undefined : 4}>{r.summary}</Text>
              )}
              <Text style={styles.more}>{isOpen ? 'Ver menos' : 'Ver más'}</Text>
              {isOpen && isAllowedTopicUrl(r.url) && (
                <Button kind="secondary" label="Leer completo en medlineplus.gov" onPress={() => Linking.openURL(r.url)} />
              )}
            </Card>
          </Pressable>
        );
      })}
      <Body muted>Fuente: MedlinePlus, Biblioteca Nacional de Medicina de EE. UU. Esta información no reemplaza a tu médico.</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: { marginTop: space.md },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: space.md,
    fontSize: 15, color: colors.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  summary: { fontSize: 15, lineHeight: 22, color: colors.text, marginTop: space.sm },
  more: { color: colors.primary, fontWeight: '600', marginTop: space.sm },
});
