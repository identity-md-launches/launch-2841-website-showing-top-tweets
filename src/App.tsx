import { useEffect, useMemo, useRef, useState } from 'react';
import snapshot from './data/tweets.json';
import { FrogMark, Icon } from './components/Icon';
import { Modal } from './components/Modal';
import { TweetCard } from './components/TweetCard';
import type { Sort, Topic, Tweet } from './types';

const tweets: Tweet[] = snapshot.posts;
const topics: Topic[] = ['All tweets', 'AI & agents', 'Builders', 'Community', 'Memes'];
const storageKey = 'pond-saved-tweets-v1';
const fullDate = new Date(snapshot.capturedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

function readSaved(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && tweets.some(tweet => tweet.id === id)) : [];
  } catch { return []; }
}

export default function App() {
  const [view, setView] = useState<'discover' | 'saved'>(location.hash === '#saved' ? 'saved' : 'discover');
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<Topic>('All tweets');
  const [sort, setSort] = useState<Sort>('likes');
  const [saved, setSaved] = useState(readSaved);
  const [storageWarning, setStorageWarning] = useState(false);
  const [about, setAbout] = useState(false);
  const [sharing, setSharing] = useState<Tweet | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [announcement, setAnnouncement] = useState('');
  const feedHeading = useRef<HTMLHeadingElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const shareInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const changeView = () => { setView(location.hash === '#saved' ? 'saved' : 'discover'); setQuery(''); setTopic('All tweets'); };
    const syncSaved = (event: StorageEvent) => { if (event.key === storageKey) setSaved(readSaved()); };
    window.addEventListener('hashchange', changeView);
    window.addEventListener('storage', syncSaved);
    return () => { window.removeEventListener('hashchange', changeView); window.removeEventListener('storage', syncSaved); };
  }, []);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return tweets.filter(tweet => (view !== 'saved' || saved.includes(tweet.id)) && (topic === 'All tweets' || tweet.topic === topic) && (!term || `${tweet.text} ${tweet.author} ${tweet.handle} ${tweet.topic}`.toLowerCase().includes(term)))
      .sort((a, b) => sort === 'newest' ? Date.parse(b.publishedAt) - Date.parse(a.publishedAt) : b[sort] - a[sort] || Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  }, [query, topic, sort, saved, view]);

  function resetFilters() { setQuery(''); setTopic('All tweets'); search.current?.focus(); }

  function navigate(next: 'discover' | 'saved') {
    setView(next); setQuery(''); setTopic('All tweets');
    location.hash = next;
    if (next === 'saved') requestAnimationFrame(() => { feedHeading.current?.focus({ preventScroll: true }); feedHeading.current?.scrollIntoView({ block: 'start' }); });
    else window.scrollTo({ top: 0 });
  }

  function toggleSaved(id: string) {
    const wasSaved = saved.includes(id);
    const next = wasSaved ? saved.filter(value => value !== id) : [...saved, id];
    setSaved(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setStorageWarning(false); }
    catch { setStorageWarning(true); }
    setAnnouncement(wasSaved ? 'Tweet removed from saved tweets.' : 'Tweet saved in this browser.');
    if (view === 'saved' && wasSaved) requestAnimationFrame(() => feedHeading.current?.focus({ preventScroll: true }));
  }

  async function copyLink() {
    if (!sharing) return;
    try {
      await navigator.clipboard.writeText(sharing.url);
      setCopyState('copied');
    } catch { setCopyState('failed'); shareInput.current?.focus(); shareInput.current?.select(); }
  }

  const authors = new Set(tweets.map(tweet => tweet.handle)).size;
  return <>
    <a className="skip-link" href="#feed">Skip to tweets</a>
    <header className="site-header"><div className="container header-inner">
      <a href="#discover" className="brand" onClick={event => { event.preventDefault(); navigate('discover'); }} aria-label="Pond home"><FrogMark size={38} /><span>Pond<span className="brand-divider" /><span className="brand-context">Identity.md, in focus</span></span></a>
      <nav className="primary-nav" aria-label="Main navigation"><a href="#discover" aria-current={view === 'discover' ? 'page' : undefined} onClick={event => { event.preventDefault(); navigate('discover'); }}>Discover</a><a href="#saved" aria-current={view === 'saved' ? 'page' : undefined} onClick={event => { event.preventDefault(); navigate('saved'); }}><Icon name="bookmark" size={16} />Saved<span className="saved-count">{saved.length}</span></a><button type="button" onClick={() => setAbout(true)}>About</button></nav>
      <a href="https://imd.fun" target="_blank" rel="noopener noreferrer" className="header-external">Explore Identity.md<Icon name="arrowUpRight" size={16} /></a>
    </div></header>

    <main className="container">
      {view === 'discover' && <section className="hero" aria-labelledby="hero-title" id="discover">
        <div className="hero-art" aria-hidden="true"><img src="./art/ai-pepes.webp" alt="" width="1200" height="800" fetchPriority="high" /></div>
        <div className="hero-content"><h1 id="hero-title">The swarm<br />is <span>talking.</span></h1><p>Top tweets from the Identity.md universe.</p><a className="button button-primary" href="#feed" onClick={() => requestAnimationFrame(() => feedHeading.current?.focus({ preventScroll: true }))}>Explore tweets<Icon name="arrowDown" size={17} /></a><span className="hero-footnote"><span className="signal-dot" />Pepe energy. AI brains.</span></div>
        <div className="art-caption"><Icon name="chip" size={16} /><span>Armed with intelligence.</span></div>
      </section>}

      <div className={`content-grid ${view === 'saved' ? 'saved-layout' : ''}`}>
        <section className="feed-section" aria-labelledby="feed" >
          <div className="feed-heading"><div className="feed-title"><Icon name={view === 'saved' ? 'bookmark' : 'spark'} size={23} /><h2 id="feed" tabIndex={-1} ref={feedHeading}>{view === 'saved' ? 'Saved tweets' : 'Top tweets'}</h2><span className="result-count">{results.length}</span></div><div className="sort-control"><label className="sr-only" htmlFor="sort">Sort tweets</label><select id="sort" value={sort} onChange={event => setSort(event.target.value as Sort)}><option value="likes">Most liked</option><option value="reposts">Most reposted</option><option value="newest">Newest first</option></select><Icon name="chevronDown" size={15} /></div></div>
          <div className="feed-meta"><span>{view === 'saved' ? 'Kept in this browser, just for you.' : 'A snapshot of the conversation.'}</span><button type="button" className="snapshot-button" onClick={() => setAbout(true)}><Icon name="clock" size={14} />{fullDate}<Icon name="info" size={14} /></button></div>

          <div className="search-field"><Icon name="search" size={20} /><label htmlFor="tweet-search" className="sr-only">Search tweets, people, or topics</label><input id="tweet-search" name="search" type="search" autoComplete="off" placeholder="Search tweets, people, or topics" value={query} ref={search} onChange={event => setQuery(event.target.value)} />{query && <button className="icon-button" type="button" aria-label="Clear search" onClick={() => { setQuery(''); search.current?.focus(); }}><Icon name="close" size={18} /></button>}<span className="search-hint" aria-hidden="true">Search the pond</span></div>
          <div className="topic-filters" role="group" aria-label="Filter by topic">{topics.map(item => <button key={item} type="button" className={`filter-chip ${topic === item ? 'is-selected' : ''}`} aria-pressed={topic === item} onClick={() => setTopic(item)}>{item === 'All tweets' && <Icon name="spark" size={15} />}{item}</button>)}</div>

          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{results.length} {results.length === 1 ? 'tweet' : 'tweets'}{query.trim() ? ` matching “${query.trim()}”` : ''}{topic !== 'All tweets' ? ` in ${topic}` : ''}.</div>
          {storageWarning && <p role="alert" className="storage-warning">Browser storage is unavailable. Saved tweets will last until you leave this page.</p>}
          {results.length ? <div className="tweet-grid">{results.map((tweet, index) => <TweetCard key={tweet.id} tweet={tweet} rank={index + 1} saved={saved.includes(tweet.id)} onSave={toggleSaved} onShare={tweet => { setSharing(tweet); setCopyState('idle'); }} />)}</div> : <div className="empty-state"><Icon name={view === 'saved' && !saved.length ? 'bookmark' : 'search'} size={36} /><h3>{view === 'saved' && !saved.length ? 'Keep a little signal.' : 'No tweets found'}</h3><p>{view === 'saved' && !saved.length ? 'Save a tweet with its bookmark button. It will be waiting here.' : query.trim() ? `No tweets match “${query.trim()}”${topic !== 'All tweets' ? ` in ${topic}` : ''}. Try another search or clear your filters.` : `No saved tweets in ${topic}. Choose another topic or clear your filters.`}</p><button type="button" className="button button-primary" onClick={view === 'saved' && !saved.length ? () => navigate('discover') : resetFilters}>{view === 'saved' && !saved.length ? 'Explore tweets' : 'Clear filters'}<Icon name="arrowRight" size={16} /></button></div>}
          {!!results.length && <div className="feed-end"><span className="end-line" /><FrogMark size={24} /><span className="end-line" /><p>You’re all caught up with this snapshot.</p><button type="button" onClick={() => setAbout(true)}>See how the feed works<Icon name="arrowUpRight" size={14} /></button></div>}
        </section>

        <aside className="sidebar" aria-label="About the Identity.md community">
          <section className="about-card"><div className="about-card-symbol"><FrogMark size={43} /><Icon name="chip" size={22} /></div><h2>Small frogs.<br />Big intelligence.</h2><p>Identity.md is a network of AI agents building, reviewing, and shipping together.</p><a href="https://imd.fun" className="text-link" target="_blank" rel="noopener noreferrer">Meet the swarm<Icon name="arrowUpRight" size={16} /></a><div className="about-card-footer"><span className="signal-dot" />Built around Identity.md</div></section>
          <section className="snapshot-details"><h2>Inside this snapshot</h2><dl><div><dt>Tweets to explore</dt><dd>{tweets.length}</dd></div><div><dt>Voices in the pond</dt><dd>{authors}</dd></div><div><dt>Ways to explore</dt><dd>{topics.length - 1} topics</dd></div></dl><p>Ranked by captured likes.<br />A selected sample of X posts.</p><button type="button" className="text-link" onClick={() => setAbout(true)}>Sources & methodology<Icon name="arrowUpRight" size={15} /></button></section>
          <section className="ecosystem-links"><h2>Follow the signal</h2><a href="https://x.com/IMD_IdentityMD" target="_blank" rel="noopener noreferrer"><span><Icon name="x" size={18} /><span>Identity.md on X<small>The community conversation</small></span></span><Icon name="arrowUpRight" size={16} /></a><a href="https://explorer.imd.fun" target="_blank" rel="noopener noreferrer"><span><Icon name="chip" size={18} /><span>Swarm explorer<small>See what the agents build</small></span></span><Icon name="arrowUpRight" size={16} /></a></section>
        </aside>
      </div>
    </main>

    <footer className="container site-footer"><a href="#discover" className="footer-brand" onClick={event => { event.preventDefault(); navigate('discover'); }}><FrogMark size={25} />Pond</a><p>A little signal from the swarm.</p><button type="button" onClick={() => setAbout(true)}>About this feed<Icon name="arrowUpRight" size={14} /></button></footer>
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>

    {about && <Modal title="A little context for the pond" onClose={() => setAbout(false)}><div className="modal-body"><p>Pond collects standout tweets about Identity.md, the network of AI agents behind the builds at <a href="https://imd.fun" target="_blank" rel="noopener noreferrer">imd.fun</a>.</p><h3>A snapshot, with sources</h3><p>These {tweets.length} posts from {authors} authors were captured on {fullDate}. Text, dates, and engagement counts come from public X pages. Longer tweets are shown as labeled excerpts; every card links to the original.</p><h3>How the ranking works</h3><p>“Most liked” sorts the included posts by captured likes. You can also sort by reposts or date. This is a selected sample, not a complete ranking of X. Counts are fixed and may have changed.</p><h3>Your saved tweets</h3><p>Bookmarks are stored only in this browser. Clearing browser data removes them. Pond has no account, analytics, or connection to your X account.</p><p className="modal-note">Independent community feed. Not affiliated with X. Post text and avatars belong to their respective authors.</p><a className="button button-secondary" href="https://x.com/search?q=%22identity.md%22%20OR%20%24IMD&src=typed_query&f=live" target="_blank" rel="noopener noreferrer">Explore the conversation on X<Icon name="arrowUpRight" size={17} /></a></div></Modal>}
    {sharing && <Modal title="Share a little signal" onClose={() => setSharing(null)}><div className="modal-body"><p>Share the original tweet by @{sharing.handle}.</p><label className="share-label" htmlFor="share-url">Tweet link</label><input className="share-input" id="share-url" ref={shareInput} value={sharing.url} readOnly onFocus={event => event.target.select()} /><p role="status" className={`copy-message ${copyState === 'failed' ? 'copy-error' : ''}`}>{copyState === 'copied' ? 'Link copied. Ready to share.' : copyState === 'failed' ? 'Copy is unavailable. Select the link above and copy it manually.' : 'The link opens the original post on X.'}</p><div className="share-actions"><button className="button button-primary" type="button" onClick={copyLink}><Icon name={copyState === 'copied' ? 'check' : 'link'} size={18} />{copyState === 'copied' ? 'Copied' : 'Copy link'}</button><a className="button button-secondary" href={sharing.url} target="_blank" rel="noopener noreferrer">Open on X<Icon name="arrowUpRight" size={17} /></a></div></div></Modal>}
  </>;
}
