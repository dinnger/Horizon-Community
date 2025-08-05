import type {
	IClassNode,
	classOnExecuteInterface,
	classOnCredential,
	classOnUpdateCredentialInterface
} from '@shared/interfaces/class.interface.js'
import type {
	IOptionsProperty,
	IStringProperty,
	ICredentialProperty,
	INumberProperty,
	ICodeProperty
} from '@shared/interfaces/workflow.properties.interface.js'
import querystring from 'node:querystring'

export default class SpotifySimple implements IClassNode {
	accessSecrets = true
	dependencies = ['axios']

	info = {
		name: 'Spotify Simple',
		desc: 'Nodo simplificado para conectar con Spotify',
		icon: '󰓇',
		group: 'Servicios',
		color: '#1DB954',
		connectors: {
			inputs: ['input'],
			outputs: ['response', 'error']
		},
		isSingleton: true
	}

	properties = {
		credential: {
			name: 'Credencial',
			type: 'credential' as const,
			options: [],
			value: ''
		} as ICredentialProperty,

		operation: {
			name: 'Operación',
			type: 'options' as const,
			options: [
				{
					label: 'Buscar (tracks, artistas, albums)',
					value: 'search'
				},
				{
					label: 'Mis canciones guardadas',
					value: 'saved_tracks'
				},
				{
					label: 'Obtener playlist',
					value: 'get_playlist'
				},
				{
					label: 'Top tracks del artista',
					value: 'artist_top_tracks'
				},
				{
					label: 'Recomendaciones',
					value: 'recommendations'
				},
				{
					label: 'Nuevos lanzamientos',
					value: 'new_releases'
				},
				{
					label: 'Reproducir siguiente canción',
					value: 'next_track'
				},
				{
					label: 'Reproducir canción anterior',
					value: 'previous_track'
				},
				{
					label: 'Pausar reproducción',
					value: 'pause'
				},
				{
					label: 'Reanudar reproducción',
					value: 'play'
				},
				{
					label: 'Ajustar volumen',
					value: 'volume'
				},
				{
					label: 'Estado de reproducción actual',
					value: 'current_playback'
				}
			],
			value: 'search'
		} as IOptionsProperty,

		query: {
			name: 'Query/ID',
			type: 'string' as const,
			value: '',
			description: 'Término de búsqueda o ID según la operación'
		} as IStringProperty,

		limit: {
			name: 'Límite',
			type: 'string' as const,
			value: '20',
			description: 'Número máximo de resultados (máx. 50)'
		} as IStringProperty,

		offset: {
			name: 'Offset',
			type: 'string' as const,
			value: '0',
			description: 'Índice de inicio para paginación'
		} as IStringProperty,

		volume: {
			name: 'Volumen',
			type: 'number' as const,
			value: 100,
			description: 'Volumen de reproducción (0-100)'
		} as INumberProperty,

		parameters: {
			name: 'Parámetros adicionales',
			type: 'code' as const,
			lang: 'json',
			value: '{\n  "market": "ES"\n}'
		} as ICodeProperty
	}

	credentials = {
		properties: {
			clientId: {
				name: 'Client ID',
				type: 'string' as const,
				value: '',
				required: true
			} as IStringProperty,

			clientSecret: {
				name: 'Client Secret',
				type: 'string' as const,
				value: '',
				required: true
			} as IStringProperty,

			scope: {
				name: 'Scope',
				type: 'string' as const,
				value:
					'playlist-read-private playlist-read-collaborative user-read-playback-state user-modify-playback-state user-read-currently-playing'
			} as IStringProperty,

			redirectUri: {
				name: 'Redirect URI',
				type: 'string' as const,
				value: '',
				pattern: new RegExp(/^(https?:\/\/)([^\s$.?#].[^\s]*)$/).toString(),
				patternHint: 'Debe ser una URL válida (http o https)',
				description: 'URI de redirección para la autenticación',
				disabled: true,
				required: true
			} as IStringProperty
		},
		required: ['client_id', 'client_secret', 'refresh_token']
	}

	async onExecute({ outputData, dependency, credential }: classOnExecuteInterface) {
		const axios = await dependency.getRequire('axios')

		try {
			const { client_id, client_secret, refresh_token } = await credential.getCredential(String(this.properties.credential.value))

			const response = await axios.post(
				'https://accounts.spotify.com/api/token',
				querystring.stringify({
					grant_type: 'refresh_token',
					refresh_token
				}),
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						Authorization: `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`
					}
				}
			)

			const { access_token } = response.data

			// Configurar parámetros adicionales
			const additionalParams = this.properties.parameters.value
				? typeof this.properties.parameters.value === 'string'
					? JSON.parse(this.properties.parameters.value)
					: this.properties.parameters.value
				: {}

			const limit = Number.parseInt(this.properties.limit.value) || 20
			const offset = Number.parseInt(this.properties.offset.value) || 0
			const query = this.properties.query.value
			const volume = Number.parseInt(this.properties.volume.value.toString()) || 100

			// Ejecutar operación específica
			let result: any
			const baseURL = 'https://api.spotify.com/v1'

			switch (this.properties.operation.value) {
				case 'search':
					result = await axios({
						method: 'get',
						url: `${baseURL}/search`,
						headers: {
							Authorization: `Bearer ${access_token}`
						},
						params: {
							q: query,
							type: additionalParams.type || 'track,artist,album',
							limit,
							offset,
							...additionalParams
						}
					})
					break

				case 'saved_tracks':
					result = await axios({
						method: 'get',
						url: `${baseURL}/me/tracks`,
						headers: {
							Authorization: `Bearer ${access_token}`
						},
						params: {
							limit,
							offset,
							...additionalParams
						}
					})
					break

				case 'get_playlist':
					if (!query) {
						return outputData('error', { error: 'Se requiere ID de playlist' })
					}
					result = await axios({
						method: 'get',
						url: `${baseURL}/playlists/${query}`,
						headers: {
							Authorization: `Bearer ${access_token}`
						},
						params: {
							...additionalParams
						}
					})
					break

				case 'artist_top_tracks':
					if (!query) {
						return outputData('error', { error: 'Se requiere ID del artista' })
					}
					result = await axios({
						method: 'get',
						url: `${baseURL}/artists/${query}/top-tracks`,
						headers: {
							Authorization: `Bearer ${access_token}`
						},
						params: {
							market: additionalParams.market || 'ES',
							...additionalParams
						}
					})
					break

				case 'recommendations':
					result = await axios({
						method: 'get',
						url: `${baseURL}/recommendations`,
						headers: {
							Authorization: `Bearer ${access_token}`
						},
						params: {
							seed_artists: additionalParams.seed_artists || '',
							seed_genres: additionalParams.seed_genres || '',
							seed_tracks: additionalParams.seed_tracks || '',
							limit,
							...additionalParams
						}
					})
					break

				case 'new_releases':
					result = await axios({
						method: 'get',
						url: `${baseURL}/browse/new-releases`,
						headers: {
							Authorization: `Bearer ${access_token}`
						},
						params: {
							limit,
							offset,
							...additionalParams
						}
					})
					break

				case 'current_playback':
					result = await axios({
						method: 'get',
						url: `${baseURL}/me/player`,
						headers: {
							Authorization: `Bearer ${access_token}`
						}
					})
					break

				case 'next_track':
					result = await axios({
						method: 'post',
						url: `${baseURL}/me/player/next`,
						headers: {
							Authorization: `Bearer ${access_token}`
						}
					})
					result = { data: { message: 'Siguiente canción' } }
					break

				case 'previous_track':
					result = await axios({
						method: 'post',
						url: `${baseURL}/me/player/previous`,
						headers: {
							Authorization: `Bearer ${access_token}`
						}
					})
					result = { data: { message: 'Canción anterior' } }
					break

				case 'pause':
					result = await axios({
						method: 'put',
						url: `${baseURL}/me/player/pause`,
						headers: {
							Authorization: `Bearer ${access_token}`
						}
					})
					result = { data: { message: 'Reproducción pausada' } }
					break

				case 'play':
					result = await axios({
						method: 'put',
						url: `${baseURL}/me/player/play`,
						headers: {
							Authorization: `Bearer ${access_token}`
						}
					})
					result = { data: { message: 'Reproducción reanudada' } }
					break

				case 'volume':
					if (Number.isNaN(volume) || volume < 0 || volume > 100) {
						return outputData('error', {
							error: 'El volumen debe ser un número entre 0 y 100'
						})
					}
					result = await axios({
						method: 'put',
						url: `${baseURL}/me/player/volume`,
						headers: {
							Authorization: `Bearer ${access_token}`
						},
						params: {
							volume_percent: volume
						}
					})
					result = { data: { message: `Volumen ajustado a ${volume}%` } }
					break

				default:
					return outputData('error', { error: 'Operación no reconocida' })
			}

			outputData('response', { result: result.data })
		} catch (error: any) {
			let message = 'Error: '
			if (error instanceof Error) message += error.message
			outputData('error', { error: message })
		}
	}

	async onUpdateCredential({ properties, context }: classOnUpdateCredentialInterface) {
		properties.redirectUri.value = context.environments.callback
	}

	async onCredential({ credentials, client, dependency }: classOnCredential) {
		const axios = await dependency.getRequire('axios')
		const { clientId, clientSecret, redirectUri, scope } = credentials as any

		// Obtener el token
		const resp = await client.openUrl({
			uri: 'https://accounts.spotify.com/authorize',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			queryParams: {
				client_id: clientId.value,
				response_type: 'code',
				redirect_uri: redirectUri.value,
				scope: scope.value
			},
			meta: {
				clientId: clientId.value,
				clientSecret: clientSecret.value,
				redirectUri: redirectUri.value,
				scope: scope.value
			}
		})

		const { code } = resp.data
		if (!code || !clientId.value || !clientSecret.value || !redirectUri.value) {
			throw new Error('Faltan parámetros')
		}

		const tokenResponse = await axios.post(
			'https://accounts.spotify.com/api/token',
			querystring.stringify({
				grant_type: 'authorization_code',
				code: String(code),
				redirect_uri: redirectUri.value
			}),
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Authorization: `Basic ${Buffer.from(`${clientId.value}:${clientSecret.value}`).toString('base64')}`
				}
			}
		)

		const { refresh_token } = tokenResponse.data
		return {
			status: true,
			data: {
				refresh_token,
				client_id: clientId.value,
				client_secret: clientSecret.value
			}
		}
	}
}
