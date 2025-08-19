/* global qortalRequest */

/**
 * Lihtne Playlist Service
 * See on minimaalne teenus, mis tegeleb ainult playlistide loomisega
 */

/**
 * Loob uue playlisti
 * @param {Object} user - Kasutaja objekt (peab sisaldama name välja)
 * @param {string} name - Playlisti nimi
 * @param {string} description - Playlisti kirjeldus
 * @returns {Promise<Object>} - Vastus { success: boolean, identifier: string }
 */
export const createPlaylist = async (user, name, description) => {
  try {
    if (!user?.name) {
      throw new Error("Kasutajanimi on nõutud");
    }

    if (!name) {
      throw new Error("Playlisti nimi on nõutud");
    }

    // Loome lihtsa unikaalse identifikaatori
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 8);
    const identifier = `qmusic_playlist_${timestamp}_${randomPart}`;

    console.log(`Loon playlisti kasutajale ${user.name} nimega "${name}"`);

    // Playlisti andmed
    const playlistData = {
      name: name,
      description: description || "",
      createdAt: timestamp,
      updatedAt: timestamp,
      songs: [] // Alguses tühi
    };

    console.log("Playlisti andmed:", playlistData);

    // Kontrolli, kas qortalRequest on saadaval
    if (typeof qortalRequest === 'undefined') {
      console.log("Qortal API pole saadaval, simuleerin API vastust");
      
      // Simuleeri edukust, kui töötame arenduskeskkonnas
      await new Promise(resolve => setTimeout(resolve, 500)); // Väike viivitus, et simuleerida API päringut
      return { success: true, identifier };
    }

    // Saada andmed QDN-i
    const response = await qortalRequest({
      action: "PUBLISH_QDN_RESOURCE",
      name: user.name, // Kasutame reaalset kasutajanime, mitte "CURRENT_USER"
      service: "PLAYLIST",
      identifier: identifier,
      data: playlistData, // Otsene andmeobjekt, mitte base64 kodeeritud
      filename: "playlist.json",
      title: name,
      description: description || "Qortal Music playlist",
      category: "MUSIC",
      tags: ["music", "playlist"]
    });

    console.log("QDN vastus:", response);
    return { success: true, identifier };
  } catch (error) {
    console.error("Viga playlisti loomisel:", error);
    throw error;
  }
};

/**
 * Saab kasutaja kõik playlistid
 * @param {Object} user - Kasutaja objekt (peab sisaldama name välja)
 * @returns {Promise<Array>} - Playlistide massiiv
 */
export const getUserPlaylists = async (user) => {
  try {
    if (!user?.name) {
      throw new Error("Kasutajanimi on nõutud");
    }

    console.log(`Otsin playliste kasutajale ${user.name}`);

    // Kontrolli, kas qortalRequest on saadaval
    if (typeof qortalRequest === 'undefined') {
      console.log("Qortal API pole saadaval, tagastan tühja massiivi");
      return [];
    }

    // Päri kasutaja playlistid QDN-ist
    const response = await qortalRequest({
      action: "SEARCH_QDN_RESOURCES",
      service: "PLAYLIST",
      query: "qmusic_playlist_",
      name: user.name,
      limit: 100,
      offset: 0,
      reverse: true,
      includeData: true,
      excludeBlocked: true,
    });

    console.log(`Leitud ${response.length} playlisti`);
    
    // Töötleme vastuse
    const playlists = response.map(item => ({
      id: `${item.name}_${item.service}_${item.identifier}`,
      name: item.data?.name || 'Nimetu playlist',
      description: item.data?.description || '',
      identifier: item.identifier,
      creator: item.name,
      createdAt: item.data?.createdAt || Date.now(),
      songs: item.data?.songs || []
    }));

    return playlists;
  } catch (error) {
    console.error("Viga playlistide laadimisel:", error);
    return [];
  }
};
