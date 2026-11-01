import { Icon } from './Icon';
import type { Tweet } from '../types';

export function formatCount(count: number) {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(count);
}

export function TweetCard({ tweet, rank, saved, onSave, onShare }: { tweet: Tweet; rank: number; saved: boolean; onSave: (id: string) => void; onShare: (tweet: Tweet) => void }) {
  const date = new Date(tweet.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const name = `@${tweet.handle}`;
  return <article className="tweet-card" aria-label={`Tweet by ${tweet.author}`} data-tweet-id={tweet.id}>
    <div className="tweet-topline"><span className="tweet-topic"><span className={`topic-dot ${tweet.topic.replace(/[^a-z]/gi, '').toLowerCase()}`} />{tweet.topic}</span><span className="tweet-rank"><span className="sr-only">Rank </span>#{String(rank).padStart(2, '0')}</span></div>
    <div className="tweet-author-row">
      <a href={`https://x.com/${tweet.handle}`} target="_blank" rel="noopener noreferrer" className="author-link" aria-label={`${tweet.author}, ${name}, on X (opens in a new tab)`}>
        <img className="avatar" src={tweet.avatar} alt="" width="42" height="42" loading="lazy" />
        <span className="author-details"><strong>{tweet.author}</strong><span>{name}</span></span>
      </a>
      <a className="tweet-x" href={tweet.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${name}’s tweet on X (opens in a new tab)`}><Icon name="x" size={18} /></a>
    </div>
    <blockquote cite={tweet.url} className="tweet-text">{tweet.text.split(/(@[a-zA-Z0-9_]+|\$[a-zA-Z0-9_]+)/g).map((part, i) => /^[@$]/.test(part) ? <span className="tweet-mention" key={i}>{part}</span> : part)}{tweet.isExcerpt && <span>…</span>}</blockquote>
    <div className="tweet-source-row"><time dateTime={tweet.publishedAt}>{date}</time><a href={tweet.url} target="_blank" rel="noopener noreferrer" className="source-link">{tweet.isExcerpt ? 'Read full tweet' : 'Read on X'}<Icon name="arrowUpRight" size={14} /></a></div>
    <div className="tweet-footer">
      <div className="tweet-metrics" role="group" aria-label="Engagement at snapshot">
        <span title={`${tweet.likes.toLocaleString('en')} likes`}><Icon name="heart" size={16} /><span>{formatCount(tweet.likes)}<span className="sr-only"> likes</span></span></span>
        <span title={`${tweet.reposts.toLocaleString('en')} reposts`}><Icon name="repeat" size={16} /><span>{formatCount(tweet.reposts)}<span className="sr-only"> reposts</span></span></span>
        <span className="view-count" title={`${tweet.views.toLocaleString('en')} views`}><Icon name="eye" size={16} /><span>{formatCount(tweet.views)}<span className="sr-only"> views</span></span></span>
      </div>
      <div className="tweet-actions"><button className="icon-button" type="button" onClick={() => onShare(tweet)} aria-label={`Share tweet by ${name}`} title="Share tweet"><Icon name="link" size={18} /></button><button className={`icon-button save-button ${saved ? 'is-saved' : ''}`} type="button" onClick={() => onSave(tweet.id)} aria-label={`${saved ? 'Unsave' : 'Save'} tweet by ${name}`} aria-pressed={saved} title={saved ? 'Remove from saved tweets' : 'Save tweet'}><Icon name="bookmark" size={18} /></button></div>
    </div>
  </article>;
}
