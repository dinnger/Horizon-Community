import type {
	classOnUpdateInterface,
	classOnExecuteInterface,
	classOnCredential,
	classOnUpdateCredentialInterface,
	IClassNode
} from '@shared/interfaces/class.interface.js'
import type {
	ICodeProperty,
	ICredentialProperty,
	IOptionsProperty,
	ISecretProperty,
	ISwitchProperty
} from '@shared/interfaces/workflow.properties.interface.js'

type IDialect = 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'oracle'

export default class DatabaseNode implements IClassNode {
	accessSecrets = true
	dependencies = ['sequelize']
	info = {
		name: 'Database',
		desc: 'Interactúa con bases de datos usando Sequelize.',
		icon: '󰆼',
		group: 'Base de Datos',
		color: '#52b0e7',
		connectors: {
			inputs: [{ name: 'input' }],
			outputs: [{ name: 'response' }, { name: 'error' }]
		},
		isSingleton: true
	}

	properties = {
		connection: {
			name: 'Tipo de conexión',
			type: 'options',
			options: [
				{
					label: 'Manual',
					value: 'manual'
				},
				{
					label: 'Secreto',
					value: 'secret'
				}
			],
			value: 'secret'
		} as IOptionsProperty,
		configSecret: {
			name: 'Configuración',
			type: 'credential',
			options: [],
			value: '',
			show: true
		} as ICredentialProperty,
		dialect: {
			name: 'Dialecto',
			type: 'options',
			options: [
				{
					label: 'Mysql',
					value: 'mysql'
				},
				{
					label: 'Postgres',
					value: 'postgres'
				},
				{
					label: 'SQLite',
					value: 'sqlite'
				},
				{
					label: 'MariaDB',
					value: 'mariadb'
				},
				{
					label: 'MSSQL',
					value: 'mssql'
				},
				{
					label: 'Oracle',
					value: 'oracle'
				}
			],
			show: false,
			value: 'postgres'
		} as IOptionsProperty,
		config: {
			name: 'Configuración',
			type: 'code',
			lang: 'json',
			value: `{
          "host": "localhost",
          "username": "user",
          "password": "password",
          "database": "mydatabase",
          "port": 5432,
          "logging": false
        }`,
			show: false
		} as ICodeProperty,
		query: {
			name: 'Query',
			type: 'code',
			lang: 'sql',
			value: 'select * from users where id = :id'
		} as ICodeProperty,
		replacements: {
			name: 'Replacements',
			type: 'code',
			lang: 'json',
			value: '{\n  "id": 1\n}'
		} as ICodeProperty,
		keepAlive: {
			name: 'Mantener conexión',
			type: 'switch',
			value: true
		} as ISwitchProperty
	}

	credentials = {
		database: {
			name: 'Database',
			type: 'options',
			options: [
				{
					label: 'Postgres',
					value: 'postgres'
				},
				{
					label: 'MySQL',
					value: 'mysql'
				},
				{
					label: 'SQLite',
					value: 'sqlite'
				},
				{
					label: 'MariaDB',
					value: 'mariadb'
				},
				{
					label: 'Oracle',
					value: 'oracle'
				}
			],
			value: 'postgres'
		} as IOptionsProperty,
		config: {
			name: 'Configuración de conexión',
			type: 'code',
			lang: 'json',
			value: `{ 
    "database": "mydb",
    "user": "myuser",
    "password": "mypass",
    "host": "localhost"
}
`
		} as ICodeProperty
	}

	connections: { [key: string]: any } = {}

	async onDeploy() {
		switch (this.properties.dialect.value) {
			case 'mysql':
				this.dependencies.push('mysql')
				break
			case 'postgres':
				this.dependencies.push('pg')
				break
			case 'sqlite':
				this.dependencies.push('sqlite3')
				break
			case 'mariadb':
				this.dependencies.push('mariadb')
				break
			case 'mssql':
				this.dependencies.push('tedious')
				break
			case 'oracle':
				this.dependencies.push('oracledb')
				break
		}
	}

	async onUpdateProperties({ properties, context }: classOnUpdateInterface<typeof this.properties>): Promise<void> {
		if (properties.connection.value === 'secret') {
			properties.configSecret.show = true
			properties.config.show = false
			const secrets = await context.getSecrets(properties.dialect.value as IDialect)
			if (secrets) {
				properties.configSecret.options = secrets
			}
		}
		if (properties.connection.value === 'manual') {
			properties.config.show = true
			properties.configSecret.show = false
		}
	}

	async onExecute({ outputData, dependency, credential }: classOnExecuteInterface) {
		const { Sequelize, QueryTypes } = await dependency.getRequire('sequelize')
		let sequelize: typeof Sequelize | null = null

		try {
			const dialect: IDialect = this.properties.dialect.value as IDialect

			if (this.properties.connection.value === 'secret') {
				if (!this.properties.configSecret.value) {
					return outputData('error', { error: 'No se especificó el secreto' })
				}
				const { database, config } = await credential.getCredential(String(this.properties.configSecret.value))
				if (!database || !config) {
					return outputData('error', { error: 'No se encontraron secretos' })
				}
				this.properties.config.value = JSON.parse(config)
			}

			const config: {
				[key: string]: any
			} = this.properties.config.value as object
			let replacements: any = {}
			try {
				replacements = JSON.parse(String(this.properties.replacements.value))
			} catch (error) {}

			const query: string = this.properties.query.value as string

			if (dialect === 'sqlite') {
				config.storage = config.storage || './database.sqlite'
			}

			if (dialect === 'oracle' && config?.connectString) {
				config.dialectOptions = config.dialectOptions || {}
				config.dialectOptions.connectString = config.connectString
			}

			// hash de config
			const configHash = btoa(JSON.stringify(config))
			if (this.connections[configHash]) {
				sequelize = this.connections[configHash]
			} else {
				sequelize = new Sequelize({
					...config,
					dialect,
					logging: config.logging
				})
				this.connections[configHash] = sequelize
			}

			const isSelect = query.toUpperCase().trim().startsWith('SELECT')
			const result = await sequelize.query(this.properties.query.value as string, {
				type: isSelect ? QueryTypes.SELECT : undefined,
				replacements: replacements || undefined,
				logging: config.logging === undefined ? false : config.logging
			})
			outputData('response', isSelect ? result : result[0])
		} catch (error) {
			let message = 'Error: '
			if (error instanceof Error) message += error.message
			outputData('error', { error: message })
		} finally {
			if (sequelize && !this.properties.keepAlive.value) {
				await sequelize.close()
			}
		}
	}

	async onUpdateCredential({ field, properties }: classOnUpdateCredentialInterface<typeof this.credentials>) {
		if (field !== 'database') return
		switch (properties.database.value) {
			case 'postgres':
				properties.config.value = JSON.stringify(
					{
						database: '',
						username: '',
						password: '',
						host: '',
						port: 5432,
						logging: false
					},
					null,
					2
				)
				break
			case 'mysql':
				properties.config.value = JSON.stringify(
					{
						database: '',
						username: '',
						password: '',
						host: '',
						port: 3306,
						logging: false
					},
					null,
					2
				)
				break
			case 'sqlite':
				properties.config.value = JSON.stringify(
					{
						storage: './database.sqlite',
						logging: false
					},
					null,
					2
				)
				break
			case 'mariadb':
				properties.config.value = JSON.stringify(
					{
						database: '',
						username: '',
						password: '',
						host: '',
						port: 3306,
						logging: false
					},
					null,
					2
				)
				break
			case 'mssql':
				properties.config.value = JSON.stringify(
					{
						database: '',
						username: '',
						password: '',
						host: '',
						port: 1433,
						logging: false
					},
					null,
					2
				)
				break
			case 'oracle':
				properties.config.value = JSON.stringify(
					{
						username: '',
						password: '',
						connectString: '',
						logging: false
					},
					null,
					2
				)
				break
			default:
				properties.config.value = JSON.stringify({}, null, 2)
		}
	}

	async onCredential({ credentials }: classOnCredential) {
		const { database, config } = credentials
		// Las credenciales se definen directamente en la configuración del nodo de credenciales.
		// Este método podría usarse para validaciones adicionales si fuera necesario.
		return {
			status: true,
			data: {
				database: database.value,
				config: config.value
			}
		}
	}
}
