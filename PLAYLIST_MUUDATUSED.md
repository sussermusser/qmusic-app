# Q-Music rakenduse playlisti funktsioonid

## Tehtud muudatused

Järgnevad olulised muudatused on tehtud, et parandada playlist funktsionaalsus:

### 1. Playlisti loomine (`createPlaylist`)

- Uus signatuur: `createPlaylist(currentUser, name, songs, description, thumbnailFile)`
- Oluline muudatus: Kasutame `currentUser` objekti ja tegelikku kasutajanime "CURRENT_USER" asemel
- Andmestruktuur: Kasutame `data` otse JSON objektina, mitte base64 kodeeritud `data64`
- Failinime formaat: Kasutame nimest genereeritud failinime, mitte "playlist.json"

### 2. Playlisti uuendamine (`updatePlaylist`)

- Uus signatuur: `updatePlaylist(currentUser, identifier, updates)`
- Oluline muudatus: Vajab `currentUser` objekti
- Ühilduvus: Toetab nii `songs` kui `tracks` nimetusi

### 3. Loo lisamine playlisti (`addTrackToPlaylist`)

- Uus signatuur: `addTrackToPlaylist(currentUser, playlistIdentifier, song)`
- Oluline muudatus: Vajab `currentUser` objekti ja kasutab lihtsamat loo struktuuri

### 4. Loo eemaldamine playlistist (`removeTrackFromPlaylist`)

- Uus signatuur: `removeTrackFromPlaylist(currentUser, playlistIdentifier, songIdentifier)`
- Oluline muudatus: Vajab `currentUser` objekti

### 5. Uued funktsioonid

- `getUserSongs(currentUser)` - Kasutaja lugude toomine
- `getUserPlaylists(currentUser)` - Kasutaja playlistide toomine
- `getSongUrl(song)` - Loo QDN URL-i genereerija
- `getPlaylistContentUrl(playlist)` - Playlisti sisu URL-i genereerija

## Olulised eripärad

1. **currentUser objekt** - Kõik funktsioonid vajavad `currentUser` objekti, kus on `name` väli
2. **data vs data64** - Qortal API kasutab `data` parameetrit, mitte base64 kodeeritud `data64`
3. **songs vs tracks** - Toetame mõlemat nimetust, et tagada ühilduvus
4. **Lihtne loo struktuur** - Kasutame minimaalset struktuuri laulude jaoks: `name`, `identifier`, `filename`

## Kuidas kasutada

```jsx
// Komponendis, nt CreatePlaylistPage
import { 
  createPlaylist, 
  getUserSongs, 
  getUserPlaylists,
  getSongUrl 
} from '../services/playlistService';

// Laulud õige struktuuriga
const selectedSongs = [
  {
    name: currentUser.name,
    identifier: "qmusic_song_example_123",
    filename: "song.mp3",
    title: "Minu laul"
  }
];

// Playlisti loomine
const newPlaylist = await createPlaylist(
  currentUser,
  "Minu playlist",
  selectedSongs,
  "Playlistsi kirjeldus"
);

// Playlistide laadimine
const playlists = await getUserPlaylists(currentUser);

// Kasutaja laulude laadimine
const songs = await getUserSongs(currentUser);

// Loo lisamine playlisti
await addTrackToPlaylist(
  currentUser,
  playlistIdentifier,
  song
);

// Loo eemaldamine playlistist
await removeTrackFromPlaylist(
  currentUser,
  playlistIdentifier,
  songIdentifier
);

// Loo URL-i saamine
const songUrl = getSongUrl(song);
```

## Veaotsing

Kui playlistid ikka ei tööta, kontrolli järgmist:

1. Kas `currentUser` objekt on olemas ja sisaldab `name` välja?
2. Kas laulude struktuur vastab nõutule (`name`, `identifier`, `filename`)?
3. Kas playlist teenuse vastused logitakse konsooli? Vaata veateateid.

Mõned API nõuded võivad olla spetsiifilised ja mitte hästi dokumenteeritud. Vigade korral kontrolli konsooli logisid.
