import { type QueryInterface, DataTypes } from 'sequelize'

export const up = async (queryInterface: QueryInterface): Promise<void> => {
	// Agregar campo de instancia a la cola de despliegues
	await queryInterface.addColumn('deployment_queue', 'instance_id', {
		type: DataTypes.UUID,
		allowNull: true,
		references: {
			model: 'deployment_instances',
			key: 'id'
		},
		onUpdate: 'CASCADE',
		onDelete: 'SET NULL',
		comment: 'Instancia específica donde se desplegará'
	})

	// Eliminar campo de prioridad
	await queryInterface.removeColumn('deployment_queue', 'priority')

	// Eliminar índice de prioridad si existe
	try {
		await queryInterface.removeIndex('deployment_queue', ['priority'])
	} catch (error) {
		// Ignorar si el índice no existe
		console.log('Index on priority column not found, skipping removal')
	}

	// Agregar índice para la nueva columna instanceId
	await queryInterface.addIndex('deployment_queue', ['instance_id'])
}

export const down = async (queryInterface: QueryInterface): Promise<void> => {
	// Revertir: agregar de vuelta el campo priority
	await queryInterface.addColumn('deployment_queue', 'priority', {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 5,
		validate: {
			min: 1,
			max: 10
		},
		comment: 'Prioridad de 1 (más alta) a 10 (más baja)'
	})

	// Eliminar campo instanceId
	await queryInterface.removeColumn('deployment_queue', 'instance_id')

	// Restaurar índice de prioridad
	await queryInterface.addIndex('deployment_queue', ['priority'])

	// Eliminar índice de instanceId
	try {
		await queryInterface.removeIndex('deployment_queue', ['instance_id'])
	} catch (error) {
		// Ignorar si el índice no existe
		console.log('Index on instance_id column not found, skipping removal')
	}
}
