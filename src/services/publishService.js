/* global qortalRequest */

// Helper function to create clean identifiers
const createIdentifier = (prefix, title) => {
  const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  return `${prefix}_${cleanTitle}_${randomCode}`;
};

const publishAudio = async (file, metadata, currentUser, imageFile) => {
  try {
    if (!currentUser?.name) {
      throw new Error('User not logged in');
    }

    if (typeof qortalRequest === 'undefined') {
      throw new Error('This app must be run in the Qortal UI to publish content');
    }

    const identifier = createIdentifier('qmusic_track', metadata.title);

    // Prepare resources array for publishing
    const resources = [
      {
        name: currentUser.name, // User name stays same
        service: "AUDIO",
        identifier, // Unique identifier for each song
        title: metadata.title,
        description: `artist=${metadata.artist}`,
        file: file,
        filename: file.name
      }
    ];

    // Add thumbnail if provided
    if (imageFile) {
      resources.push({
        name: currentUser.name,
        service: "THUMBNAIL",
        identifier, // Same identifier as audio
        file: imageFile,
        filename: `${cleanTitle}.${imageFile.name.split('.').pop()}`
      });
    }

    // Publish using Qortal API
    const result = await qortalRequest({
      action: "PUBLISH_MULTIPLE_QDN_RESOURCES",
      resources
    });

    console.log("Publish result:", result);

    // Check if result is an array of transaction objects (successful case)
    if (Array.isArray(result) && result.length > 0 && result[0].signature) {
      return { success: true, transactions: result };
    }

    // If result is exactly true (also successful)
    if (result === true) {
      return { success: true };
    }

    // Otherwise consider it an error
    throw new Error("Unexpected API response: " + JSON.stringify(result));
  } catch (error) {
    console.error('Error publishing audio:', error);
    throw error;
  }
};

const publishPlaylist = async (playlistData, currentUser) => {
  try {
    if (!currentUser?.name) {
      throw new Error('User not logged in');
    }

    if (typeof qortalRequest === 'undefined') {
      throw new Error('This app must be run in the Qortal UI to publish content');
    }

    const identifier = createIdentifier('qmusic_playlist', playlistData.title);

    const resources = [
      {
        name: currentUser.name,
        service: "PLAYLIST",
        identifier,
        title: playlistData.title,
        description: playlistData.description || '',
        data64: btoa(JSON.stringify({
          title: playlistData.title,
          description: playlistData.description,
          tracks: playlistData.tracks,
          created: Date.now(),
          version: "1.0"
        })),
        metadata: JSON.stringify({
          title: playlistData.title,
          description: playlistData.description,
          tags: playlistData.tags || [],
          version: "1.0"
        })
      }
    ];

    // Publish all resources
    for (const resource of resources) {
      await qortalRequest({
        action: "PUBLISH_QDN_RESOURCE",
        name: resource.name,
        service: resource.service,
        data64: resource.data64,
        identifier: resource.identifier,
        title: resource.title,
        description: resource.description,
        metadata: resource.metadata
      });
    }

    return {
      success: true,
      identifier
    };

  } catch (error) {
    console.error('Error publishing playlist:', error);
    throw error;
  }
};

export { publishAudio, publishPlaylist };
