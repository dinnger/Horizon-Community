import type { IClassNode, classOnCredential, classOnExecuteInterface, infoInterface } from '@shared/interfaces/class.interface.js'
import type {
	ICodeProperty,
	ICredentialProperty,
	INumberProperty,
	IOptionsProperty,
	IPropertiesType,
	IStringProperty
} from '@shared/interfaces/workflow.properties.interface.js'
import querystring from 'node:querystring'

interface IProperties extends IPropertiesType {
	operation: IOptionsProperty
	authSecret: ICredentialProperty
	query: IStringProperty
	limit: IStringProperty
	offset: IStringProperty
	volume: INumberProperty
	parameters: ICodeProperty
}

interface ICredentials extends IPropertiesType {
	clientId: IStringProperty
	clientSecret: IStringProperty
	redirectUri: IStringProperty
	scope: IStringProperty
}

export default class implements IClassNode<IProperties, ICredentials> {
	constructor(
		public accessSecrets: boolean,
		public dependencies: string[],
		public info: infoInterface,
		public properties: IProperties,
		public credentials: ICredentials
	) {
		this.accessSecrets = true
		this.dependencies = ['axios']
		this.info = {
			name: 'Spotify',
			desc: 'Conecta con Spotify para acceder a información de canciones y playlists',
			icon: '󰓇',
			group: 'Servicios',
			color: '#1DB954',
			connectors: {
				inputs: ['input'],
				outputs: ['response', 'error']
			},
			isSingleton: true
		}

		this.properties = {
			authSecret: {
				name: 'Credencial',
				type: 'credential',
				options: [],
				value: ''
			},
			operation: {
				name: 'Operación',
				type: 'options',
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
			},
			query: {
				name: 'Query/ID',
				type: 'string',
				value: '',
				description: 'Término de búsqueda o ID según la operación'
			},
			limit: {
				name: 'Límite',
				type: 'string',
				value: '20',
				description: 'Número máximo de resultados (máx. 50)'
			},
			offset: {
				name: 'Offset',
				type: 'string',
				value: '0',
				description: 'Índice de inicio para paginación'
			},
			volume: {
				name: 'Volumen',
				type: 'number',
				value: 100,
				description: 'Volumen de reproducción (0-100)'
			},
			parameters: {
				name: 'Parámetros adicionales',
				type: 'code',
				lang: 'json',
				value: '{\n  "market": "ES"\n}'
			}
		}

		this.credentials = {
			clientId: {
				name: 'Client ID',
				type: 'string',
				value: '',
				required: true
			},
			clientSecret: {
				name: 'Client Secret',
				type: 'string',
				value: '',
				required: true
			},
			scope: {
				name: 'Scope',
				type: 'string',
				value:
					'playlist-read-private playlist-read-collaborative user-read-playback-state user-modify-playback-state user-read-currently-playing'
			},
			redirectUri: {
				name: 'Redirect URI',
				type: 'string',
				value: 'http://localhost:3000/api/credential/callback',
				disabled: true,
				required: true
			}
		}
	}

	async onExecute({ outputData, dependency, credential }: classOnExecuteInterface) {
		const axios = await dependency.getRequire('axios')

		try {
			// TODO: Validar getCredential de Spotify
			const { client_id, client_secret, refresh_token } = await credential.getCredential(String(this.properties.authSecret.value))

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

	// async onCredential({ client, dependency }: classOnCredential) {
	// 	const axios = await dependency.getRequire('axios')
	// 	const { clientId, clientSecret, redirectUri, scope } = this.credentials
	// 	// Obtener el token
	// 	const resp = await client.openUrl({
	// 		uri: 'https://accounts.spotify.com/authorize',
	// 		headers: {
	// 			'Content-Type': 'application/x-www-form-urlencoded'
	// 		},
	// 		queryParams: {
	// 			client_id: clientId.value,
	// 			response_type: 'code',
	// 			redirect_uri: redirectUri.value,
	// 			scope: scope.value
	// 		},
	// 		meta: {
	// 			clientId: clientId.value,
	// 			clientSecret: clientSecret.value,
	// 			redirectUri: redirectUri.value,
	// 			scope: scope.value
	// 		}
	// 	})

	// 	const { code } = resp.data
	// 	if (!code || !clientId.value || !clientSecret.value || !redirectUri.value) {
	// 		throw new Error('Faltan parámetros')
	// 	}

	// 	const tokenResponse = await axios.post(
	// 		'https://accounts.spotify.com/api/token',
	// 		querystring.stringify({
	// 			grant_type: 'authorization_code',
	// 			code: String(code),
	// 			redirect_uri: redirectUri.value
	// 		}),
	// 		{
	// 			headers: {
	// 				'Content-Type': 'application/x-www-form-urlencoded',
	// 				Authorization: `Basic ${Buffer.from(`${clientId.value}:${clientSecret.value}`).toString('base64')}`
	// 			}
	// 		}
	// 	)

	// 	const { access_token, refresh_token } = tokenResponse.data
	// 	return {
	// 		refresh_token,
	// 		client_id: clientId.value,
	// 		client_secret: clientSecret.value
	// 	}
	// }
}
