import { qortalRequest, getResourceUrl, getThumbnailUrl } from '../utils/qortalRequest';

class QortalService {
    async searchQDNResources(service = 'AUDIO', identifier = 'audio', limit = 15, offset = 0) {
        try {
            const songResults = await qortalRequest({
                action: "SEARCH_QDN_RESOURCES",
                service: service,
                identifier: identifier,
                limit: limit,
                offset: offset,
                reverse: true,
                includeMetadata: true,
                mode: "ALL"
            });
            
            if (!Array.isArray(songResults)) {
                console.error('Unexpected response format:', songResults);
                return [];
            }

            return songResults.map(song => ({
                id: song.identifier,
                name: song.name,
                title: song.metadata?.title || song.name,
                artist: song.metadata?.artist || 'Unknown Artist',
                description: song.metadata?.description || '',
                address: song.address,
                service: song.service,
                identifier: song.identifier,
                timestamp: song.timestamp,
                audioUrl: getResourceUrl(song.service, song.name, song.identifier),
                thumbnailUrl: getThumbnailUrl(song.name, song.identifier),
                metadata: song.metadata
            }));
        } catch (error) {
            console.error('Error fetching QDN resources:', error);
            return [];
        }
    }

    async getQDNResource(address, service, identifier, name) {
        try {
            await qortalRequest({
                action: "FETCH_QDN_RESOURCE",
                service: service,
                name: name,
                identifier: identifier,
                address: address
            });
            
            return `/arbitrary/${service}/${encodeURIComponent(name)}/${encodeURIComponent(identifier)}`;
        } catch (error) {
            console.error('Error fetching QDN resource:', error);
            return null;
        }
    }

    async getMetadata(address, service, identifier, name) {
        try {
            const metadata = await qortalRequest({
                action: "FETCH_QDN_METADATA",
                service: service,
                name: name,
                identifier: identifier,
                address: address
            });
            
            return metadata;
        } catch (error) {
            console.error('Error fetching metadata:', error);
            return null;
        }
    }

    async publishAudio(username, title, artist, audioFile, imageFile) {
        try {
            // Create unique identifier
            const cleanTitle = title.replace(/ /g, '_').toLowerCase().slice(0, 20);
            const identifier = `qmusic_song_${username}_${Date.now()}`;
            const description = `title=${title};artist=${artist}`;

            // Prepare resources array
            const resources = [
                {
                    name: username,
                    service: 'AUDIO',
                    file: audioFile,
                    title: title,
                    description: description,
                    identifier: identifier,
                    filename: `${cleanTitle}.${audioFile.name.split('.').pop()}`
                }
            ];

            // Add thumbnail if provided
            if (imageFile) {
                resources.push({
                    name: username,
                    service: 'THUMBNAIL',
                    file: imageFile,
                    identifier: identifier,
                    filename: `${cleanTitle}.${imageFile.name.split('.').pop()}`
                });
            }

            // Publish both resources
            const result = await qortalRequest({
                action: 'PUBLISH_MULTIPLE_QDN_RESOURCES',
                resources: resources,
                encrypt: false,
            });

            return { success: result === true, identifier };
        } catch (error) {
            console.error('Error publishing audio:', error);
            throw error;
        }
    }

    async publishPlaylist(username, playlistName, description, songs, imageFile) {
        try {
            // Create unique identifier
            const cleanName = playlistName.replace(/ /g, '_').toLowerCase().slice(0, 20);
            const identifier = `qmusic_playlist_${username}_${Date.now()}`;

            // Prepare playlist data
            const playlistData = {
                title: playlistName,
                description: description,
                songs: songs.map(song => ({
                    name: song.name,
                    identifier: song.identifier,
                    service: 'AUDIO'
                })),
                createdAt: new Date().toISOString()
            };

            // Create resources array
            const resources = [
                {
                    name: username,
                    service: 'PLAYLIST',
                    identifier: identifier,
                    title: playlistName,
                    description: description,
                    data64: btoa(JSON.stringify(playlistData)),
                    filename: `${cleanName}.json`
                }
            ];

            // Add thumbnail if provided
            if (imageFile) {
                resources.push({
                    name: username,
                    service: 'THUMBNAIL',
                    file: imageFile,
                    identifier: identifier,
                    filename: `${cleanName}.${imageFile.name.split('.').pop()}`
                });
            }

            // Publish resources
            const result = await qortalRequest({
                action: 'PUBLISH_MULTIPLE_QDN_RESOURCES',
                resources: resources,
                encrypt: false,
            });

            return { success: result === true, identifier };
        } catch (error) {
            console.error('Error publishing playlist:', error);
            throw error;
        }
    }

    async updatePlaylist(username, playlistId, updatedData, imageFile) {
        try {
            // Prepare resources array
            const resources = [
                {
                    name: username,
                    service: 'PLAYLIST',
                    identifier: playlistId,
                    title: updatedData.title,
                    description: updatedData.description,
                    data64: btoa(JSON.stringify(updatedData)),
                    filename: `${playlistId}.json`
                }
            ];

            // Add new thumbnail if provided
            if (imageFile) {
                resources.push({
                    name: username,
                    service: 'THUMBNAIL',
                    file: imageFile,
                    identifier: playlistId,
                    filename: `${playlistId}.${imageFile.name.split('.').pop()}`
                });
            }

            // Publish updates
            const result = await qortalRequest({
                action: 'PUBLISH_MULTIPLE_QDN_RESOURCES',
                resources: resources,
                encrypt: false,
            });

            return { success: result === true };
        } catch (error) {
            console.error('Error updating playlist:', error);
            throw error;
        }
    }
}

export const qortalService = new QortalService();
