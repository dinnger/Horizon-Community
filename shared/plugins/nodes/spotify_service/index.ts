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

// Configuración de operaciones disponibles
const OPERATIONS = [
	{ label: 'Buscar (tracks, artistas, albums)', value: 'search' },
	{ label: 'Mis canciones guardadas', value: 'saved_tracks' },
	{ label: 'Obtener playlist', value: 'get_playlist' },
	{ label: 'Top tracks del artista', value: 'artist_top_tracks' },
	{ label: 'Recomendaciones', value: 'recommendations' },
	{ label: 'Nuevos lanzamientos', value: 'new_releases' },
	{ label: 'Reproducir siguiente canción', value: 'next_track' },
	{ label: 'Reproducir canción anterior', value: 'previous_track' },
	{ label: 'Pausar reproducción', value: 'pause' },
	{ label: 'Reanudar reproducción', value: 'play' },
	{ label: 'Ajustar volumen', value: 'volume' },
	{ label: 'Estado de reproducción actual', value: 'current_playback' }
]

const SPOTIFY_SCOPES =
	'playlist-read-private playlist-read-collaborative user-read-playback-state user-modify-playback-state user-read-currently-playing'

export default class Spotify implements IClassNode {
	accessSecrets = true
	dependencies = ['axios']

	info = {
		name: 'Spotify',
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
			options: OPERATIONS,
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
			value: SPOTIFY_SCOPES
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
	}

	private async getAccessToken(credential: any, axios: any) {
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

		return response.data.access_token
	}

	private getRequestParams() {
		const additionalParams = this.properties.parameters.value
			? typeof this.properties.parameters.value === 'string'
				? JSON.parse(this.properties.parameters.value)
				: this.properties.parameters.value
			: {}

		return {
			limit: Number.parseInt(this.properties.limit.value) || 20,
			offset: Number.parseInt(this.properties.offset.value) || 0,
			query: this.properties.query.value,
			volume: Number.parseInt(this.properties.volume.value.toString()) || 100,
			additionalParams
		}
	}

	private async executeSpotifyOperation(axios: any, access_token: string, operation: string, params: any) {
		const baseURL = 'https://api.spotify.com/v1'
		const authHeaders = { Authorization: `Bearer ${access_token}` }

		switch (operation) {
			case 'search':
				return axios.get(`${baseURL}/search`, {
					headers: authHeaders,
					params: {
						q: params.query,
						type: params.additionalParams.type || 'track,artist,album',
						limit: params.limit,
						offset: params.offset,
						...params.additionalParams
					}
				})

			case 'saved_tracks':
				return axios.get(`${baseURL}/me/tracks`, {
					headers: authHeaders,
					params: { limit: params.limit, offset: params.offset, ...params.additionalParams }
				})

			case 'get_playlist':
				if (!params.query) throw new Error('Se requiere ID de playlist')
				return axios.get(`${baseURL}/playlists/${params.query}`, {
					headers: authHeaders,
					params: params.additionalParams
				})

			case 'artist_top_tracks':
				if (!params.query) throw new Error('Se requiere ID del artista')
				return axios.get(`${baseURL}/artists/${params.query}/top-tracks`, {
					headers: authHeaders,
					params: { market: params.additionalParams.market || 'ES', ...params.additionalParams }
				})

			case 'recommendations':
				return axios.get(`${baseURL}/recommendations`, {
					headers: authHeaders,
					params: {
						seed_artists: params.additionalParams.seed_artists || '',
						seed_genres: params.additionalParams.seed_genres || '',
						seed_tracks: params.additionalParams.seed_tracks || '',
						limit: params.limit,
						...params.additionalParams
					}
				})

			case 'new_releases':
				return axios.get(`${baseURL}/browse/new-releases`, {
					headers: authHeaders,
					params: { limit: params.limit, offset: params.offset, ...params.additionalParams }
				})

			case 'current_playback':
				return axios.get(`${baseURL}/me/player`, { headers: authHeaders })

			case 'next_track':
				await axios.post(`${baseURL}/me/player/next`, {}, { headers: authHeaders })
				return { data: { message: 'Siguiente canción' } }

			case 'previous_track':
				await axios.post(`${baseURL}/me/player/previous`, {}, { headers: authHeaders })
				return { data: { message: 'Canción anterior' } }

			case 'pause':
				await axios.put(`${baseURL}/me/player/pause`, {}, { headers: authHeaders })
				return { data: { message: 'Reproducción pausada' } }

			case 'play':
				await axios.put(`${baseURL}/me/player/play`, {}, { headers: authHeaders })
				return { data: { message: 'Reproducción reanudada' } }

			case 'volume':
				if (Number.isNaN(params.volume) || params.volume < 0 || params.volume > 100) {
					throw new Error('El volumen debe ser un número entre 0 y 100')
				}
				await axios.put(
					`${baseURL}/me/player/volume`,
					{},
					{
						headers: authHeaders,
						params: { volume_percent: params.volume }
					}
				)
				return { data: { message: `Volumen ajustado a ${params.volume}%` } }

			default:
				throw new Error('Operación no reconocida')
		}
	}

	async onExecute({ outputData, dependency, credential }: classOnExecuteInterface) {
		const axios = await dependency.getRequire('axios')

		try {
			const access_token = await this.getAccessToken(credential, axios)
			const params = this.getRequestParams()
			const operation = String(this.properties.operation.value)
			const result = await this.executeSpotifyOperation(axios, access_token, operation, params)

			outputData('response', { result: result.data })
		} catch (error: any) {
			const message = error?.response?.data?.error?.message || error?.message || 'Error desconocido'
			outputData('error', { error: `Error: ${message}` })
		}
	}

	async onUpdateCredential({ properties, context }: classOnUpdateCredentialInterface) {
		properties.redirectUri.value = context.environments.callback
	}

	async onCredential({ credentials, client, dependency }: classOnCredential) {
		const axios = await dependency.getRequire('axios')
		const { clientId, clientSecret, redirectUri, scope } = credentials as any

		const resp = await client.openUrl({
			uri: 'https://accounts.spotify.com/authorize',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
