// Nel pubblico l'assistente non si nomina (Max, 23/11/2026): la firma dei commit è «Co-Authored-By: M.»,
// e nessun file del repo né messaggio di commit da mandare contiene il suo nome.
// Uso: node strumenti/firma.mjs [cartella] [commit]
//   predefinito: questa cartella e i commit non ancora su origin/main (tutti, se origin/main non c'è)
// Gira da solo in controlla.mjs e nel gancio pre-push verso origin (.git/hooks/pre-push).
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const NOME = 'c[l]aud'; // scritto così perché il controllo non trovi sé stesso

export function controllaFirma(dir = '.', commit) {
  const git = (...a) => {
    try { return execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); }
    catch (e) { if (e.status === 1) return ''; throw e; } // 1 = git grep senza risultati
  };
  if (!commit) commit = git('rev-parse', '--verify', '-q', 'origin/main').trim() ? 'origin/main..HEAD' : 'HEAD';
  const righe = s => s.split('\n').filter(Boolean);
  return [
    ...righe(git('grep', '-I', '-i', '-n', '-E', NOME)).map(r => `file: ${r}`),
    ...righe(git('ls-files')).filter(f => new RegExp(NOME, 'i').test(f)).map(f => `nome di file: ${f}`),
    ...righe(git('log', commit, '-i', '-E', `--grep=${NOME}`, '--format=%h %s')).map(r => `commit: ${r}`),
  ];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [dir = '.', commit] = process.argv.slice(2);
  const problemi = controllaFirma(dir, commit);
  for (const p of problemi) console.log('  NO ', p);
  console.log(problemi.length ? `\n${problemi.length} tracce del nome dell'assistente: togli prima di pubblicare` : 'firma: nessuna traccia');
  process.exitCode = problemi.length ? 1 : 0;
}
