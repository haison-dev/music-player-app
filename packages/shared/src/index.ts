export type TrackSummary = {
  id: string;
  title: string;
  artistName: string;
  coverUrl: string | null;
  audioUrl: string | null;
  durationSeconds: number;
};

export type UserSummary = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
};

export type PlaylistSummary = {
  id: string;
  title: string;
  owner: UserSummary;
  trackCount: number;
  coverUrl: string | null;
};
