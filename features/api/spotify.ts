/* eslint-disable camelcase */
interface SpotifyExternalUrls {
  spotify: string;
}

interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
  external_urls: SpotifyExternalUrls;
}

interface SpotifyImage {
  height: number;
  width: number;
  url: string;
}

interface SpotifyAlbum {
  name: string;
  external_urls: SpotifyExternalUrls;
  images: SpotifyImage[];
}

interface SpotifyTrack {
  id: string;
  album: SpotifyAlbum;
  artists: SpotifyArtist[];
  name: string;
  external_urls: SpotifyExternalUrls;
  uri: string;
  preview_url: string;
}

interface SpotifyTracksResponse {
  items: SpotifyTrack[];
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  images: SpotifyImage[];
}

interface SpotifyPlaylist {
  id: string;
  external_urls: SpotifyExternalUrls;
  name: string;
  uri: string;
}
/* eslint-enable camelcase */

export interface Track {
  id: string;
  artists: {
    id: string;
    name: string;
    url: string;
    uri: string;
  }[];
  song: {
    url: string;
    uri: string;
    name: string;
    previewUrl: string;
  };
  album: {
    name: string;
    art: SpotifyImage[];
  };
}

export interface SpotifyData {
  user: SpotifyUser;
  tracks: Track[];
}

export interface Playlist {
  id: string;
  name: string;
  uri: string;
  url: string;
}

const getUserInfo = async (accessToken: string): Promise<SpotifyUser> => {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const json = await res.json();
  return json;
};

const getTracks = async (
  accessToken: string,
  limit: number
): Promise<Track[]> => {
  const res = await fetch(
    `https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const json = (await res.json()) as SpotifyTracksResponse;

  // flatten data to something easier for us to use
  return json.items.map((item) => ({
    id: item.id,
    artists: item.artists.map((artist) => ({
      id: artist.id,
      name: artist.name,
      url: artist.external_urls.spotify,
      uri: artist.uri,
    })),
    song: {
      url: item.external_urls.spotify,
      uri: item.uri,
      name: item.name,
      previewUrl: item.preview_url,
    },
    album: {
      name: item.album.name,
      art: item.album.images,
    },
  }));
};

const createPlaylist = async (
  accessToken: string,
  userId: string,
  tracks: Track[]
): Promise<Playlist> => {
  const date = new Date(Date.now()).toLocaleString('en-US', {}).split(',')[0];
  const playlistName = `Timewarp - ${date}`;
  const res = await fetch(
    `https://api.spotify.com/v1/users/${userId}/playlists`,
    {
      method: 'POST',
      body: JSON.stringify({
        name: playlistName,
        description: 'Timewarp autogenerated playlist',
        public: true,
      }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    throw Error('Error creating playlist');
  }
  const playlistJson = (await res.json()) as SpotifyPlaylist;
  const tracksRes = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistJson.id}/tracks`,
    {
      method: 'POST',
      body: JSON.stringify({
        uris: tracks.map((track) => track.song.uri),
      }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!tracksRes.ok) {
    throw Error('Error adding songs to playlist');
    // TODO: cleanup playlist
  }
  return {
    id: playlistJson.id,
    name: playlistJson.name,
    uri: playlistJson.uri,
    url: playlistJson.external_urls.spotify,
  };
};
export { getUserInfo, getTracks, createPlaylist };
