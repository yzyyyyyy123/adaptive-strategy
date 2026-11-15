'use client';
import {useEffect, useState} from 'react';
import {ChevronRight} from 'lucide-react';
import {api, message} from '@/lib/client';
import type {DimensionAxis, Paper, Strategy, TaggedReview} from '@/lib/types';

type Props = {
  axis: DimensionAxis;
  label: string;
  papers: Paper[];
  strategies: Strategy[];
  onOpen: (paper: string, strategy: string) => void;
};

export default function TaggedStrategies({axis, label, papers, strategies, onOpen}: Props) {
  const [reviews, setReviews] = useState<TaggedReview[] | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const result = await api<{matches: TaggedReview[]}>('taxonomy/tagged?' + new URLSearchParams({axis, label}));
        if (!Array.isArray(result.matches)) throw new Error('The server could not return the tagged strategies.');
        if (active) {
          setReviews(result.matches);
          setError('');
        }
      } catch (cause) {
        if (active) setError(message(cause));
      }
    }
    refresh();
    window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); };
  }, [axis, label, attempt]);

  const byStrategy = new Map<string, TaggedReview[]>();
  for (const review of reviews || []) {
    const group = byStrategy.get(review.strategyId);
    if (group) group.push(review);
    else byStrategy.set(review.strategyId, [review]);
  }
  const matches = strategies.filter(s => byStrategy.has(s.id));
  const paperTitles = new Map(papers.map(p => [p.id, p.title]));
  return <section className="tagged-strategies" aria-label="Strategies with saved labels">
    <h3>Tagged strategies {reviews !== null && <span>({matches.length})</span>}</h3>
    {error && <p role="alert">{error} <button className="text-button" onClick={() => setAttempt(a => a + 1)}>Retry</button></p>}
    {reviews === null && !error && <p role="status">Loading saved labels…</p>}
    {reviews !== null && matches.length === 0 && <p>No saved review uses this label yet.</p>}
    {matches.length > 0 && <ul>{matches.map(strategy => <li key={strategy.id}>
      <button type="button" onClick={() => onOpen(strategy.paperId, strategy.id)}>
        <span><strong>{strategy.id} · {strategy.example}</strong>
          <small>{paperTitles.get(strategy.paperId)}</small>
          <small>{byStrategy.get(strategy.id)!.map(r =>
            (r.mode === 'consensus' ? 'Consensus' : r.reviewer || 'Reviewer') + ' · ' + r.status
          ).join(' / ')}{strategy.archived ? ' · Archived' : ''}</small>
        </span><ChevronRight size={14} aria-hidden="true"/>
      </button>
    </li>)}</ul>}
  </section>;
}
