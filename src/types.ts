export type Topic = 'All tweets' | 'AI & agents' | 'Builders' | 'Community' | 'Memes';
export type Sort = 'likes' | 'reposts' | 'newest';
export type Tweet = {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  publishedAt: string;
  text: string;
  isExcerpt: boolean;
  topic: string;
  likes: number;
  reposts: number;
  replies: number;
  views: number;
  url: string;
  links: { short: string; url: string; display: string }[];
};
