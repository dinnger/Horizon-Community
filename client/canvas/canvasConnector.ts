/**
 * Optimized Orthogonal Connector Router
 *   - Uses A* pathfinding algorithm for optimal route calculation
 *   - Implements channel-based routing for efficient point generation
 *   - Minimizes direction changes and path complexity
 *   - Ensures orthogonal connections avoiding obstacles
 *
 * https://jose.page
 * 2020 - Enhanced 2025
 */

import type { INodeCanvas } from './interfaz/node.interface'

type BasicCardinalPoint = 'n' | 'e' | 's' | 'w'
type Direction = 'v' | 'h'
type Side = 'top' | 'right' | 'bottom' | 'left'
type BendDirection = BasicCardinalPoint | 'unknown' | 'none'

/**
 * A point in space
 */
export interface Point {
	x: number
	y: number
}

/**
 * A size tuple
 */
interface Size {
	width: number
	height: number
}

/**
 * A line between two points
 */
interface Line {
	a: Point
	b: Point
}

/**
 * Represents a Rectangle by location and size
 */
interface Rect extends Size {
	left: number
	top: number
}

/**
 * Represents a connection point on a routing request
 */
interface ConnectorPoint {
	shape: Rect
	side: Side
	distance: number
}

/**
 * Byproduct data emitted by the routing algorithm
 */
interface OrthogonalConnectorByproduct {
	hRulers: number[]
	vRulers: number[]
	spots: Point[]
	grid: Rectangle[]
	connections: Line[]
}

/**
 * Routing request data
 */
interface OrthogonalConnectorOpts {
	ctx: CanvasRenderingContext2D
	nodes: { [key: string]: INodeCanvas }
	pointA: ConnectorPoint
	pointB: ConnectorPoint
	shapeMargin: number
	globalBoundsMargin: number
	globalBounds: Rect
}

/**
 * Utility Point creator
 * @param x
 * @param y
 */
function makePt(x: number, y: number): Point {
	return { x, y }
}

/**
 * Computes distance between two points
 * @param a
 * @param b
 */
function distance(a: Point, b: Point): number {
	return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
}

/**
 * Abstracts a Rectangle and adds geometric utilities
 */
class Rectangle {
	static get empty(): Rectangle {
		return new Rectangle(0, 0, 0, 0)
	}

	static fromRect(r: Rect): Rectangle {
		return new Rectangle(r.left, r.top, r.width, r.height)
	}

	static fromLTRB(left: number, top: number, right: number, bottom: number): Rectangle {
		return new Rectangle(left, top, right - left, bottom - top)
	}

	constructor(
		readonly left: number,
		readonly top: number,
		readonly width: number,
		readonly height: number
	) {}

	contains(p: Point): boolean {
		return p.x >= this.left && p.x <= this.right && p.y >= this.top && p.y <= this.bottom
	}

	inflate(horizontal: number, vertical: number): Rectangle {
		return Rectangle.fromLTRB(this.left - horizontal, this.top - vertical, this.right + horizontal, this.bottom + vertical)
	}

	intersects(rectangle: Rectangle): boolean {
		const thisX = this.left
		const thisY = this.top
		const thisW = this.width
		const thisH = this.height
		const rectX = rectangle.left
		const rectY = rectangle.top
		const rectW = rectangle.width
		const rectH = rectangle.height
		return rectX < thisX + thisW && thisX < rectX + rectW && rectY < thisY + thisH && thisY < rectY + rectH
	}

	union(r: Rectangle): Rectangle {
		const x = [this.left, this.right, r.left, r.right]
		const y = [this.top, this.bottom, r.top, r.bottom]
		return Rectangle.fromLTRB(Math.min(...x), Math.min(...y), Math.max(...x), Math.max(...y))
	}

	get center(): Point {
		return {
			x: this.left + this.width / 2,
			y: this.top + this.height / 2
		}
	}

	get right(): number {
		return this.left + this.width
	}

	get bottom(): number {
		return this.top + this.height
	}

	get location(): Point {
		return makePt(this.left, this.top)
	}

	get northEast(): Point {
		return { x: this.right, y: this.top }
	}

	get southEast(): Point {
		return { x: this.right, y: this.bottom }
	}

	get southWest(): Point {
		return { x: this.left, y: this.bottom }
	}

	get northWest(): Point {
		return { x: this.left, y: this.top }
	}

	get east(): Point {
		return makePt(this.right, this.center.y)
	}

	get north(): Point {
		return makePt(this.center.x, this.top)
	}

	get south(): Point {
		return makePt(this.center.x, this.bottom)
	}

	get west(): Point {
		return makePt(this.left, this.center.y)
	}

	get size(): Size {
		return { width: this.width, height: this.height }
	}
}

/**
 * Represents a node in a graph for A* pathfinding
 */
class PointNode {
	public gCost = Number.MAX_SAFE_INTEGER // Distance from start
	public hCost = 0 // Heuristic distance to end
	public fCost = Number.MAX_SAFE_INTEGER // Total cost
	public parent: PointNode | null = null
	public adjacentNodes: Map<PointNode, number> = new Map()

	constructor(public data: Point) {}

	updateFCost() {
		this.fCost = this.gCost + this.hCost
	}
}

/***
 * Represents a Graph of Point nodes with A* pathfinding optimization
 */
class PointGraph {
	private index: { [x: string]: { [y: string]: PointNode } } = {}

	add(p: Point) {
		const { x, y } = p
		const xs = x.toString()
		const ys = y.toString()

		if (!(xs in this.index)) {
			this.index[xs] = {}
		}
		if (!(ys in this.index[xs])) {
			this.index[xs][ys] = new PointNode(p)
		}
	}

	/**
	 * Manhattan distance heuristic for A*
	 */
	private manhattanDistance(a: Point, b: Point): number {
		return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
	}

	/**
	 * Get node with lowest f-cost from open set
	 */
	private getLowestFCostNode(openSet: Set<PointNode>): PointNode {
		let lowestNode: PointNode | null = null
		let lowestFCost = Number.MAX_SAFE_INTEGER

		for (const node of openSet) {
			if (node.fCost < lowestFCost) {
				lowestFCost = node.fCost
				lowestNode = node
			}
		}

		if (!lowestNode) {
			throw new Error('No node found in open set')
		}

		return lowestNode
	}

	/**
	 * Reconstruct path from A* result
	 */
	private reconstructPath(endNode: PointNode): Point[] {
		const path: Point[] = []
		let current: PointNode | null = endNode

		while (current !== null) {
			path.unshift(current.data)
			current = current.parent
		}

		return path
	}

	/**
	 * A* pathfinding algorithm with orthogonal movement preference
	 */
	findShortestPath(start: Point, end: Point, obstacles: Rectangle[] = []): Point[] {
		const startNode = this.get(start)
		const endNode = this.get(end)

		if (!startNode || !endNode) {
			return []
		}

		// Reset all nodes
		for (const xs in this.index) {
			for (const ys in this.index[xs]) {
				const node = this.index[xs][ys]
				node.gCost = Number.MAX_SAFE_INTEGER
				node.hCost = 0
				node.fCost = Number.MAX_SAFE_INTEGER
				node.parent = null
			}
		}

		const openSet = new Set<PointNode>()
		const closedSet = new Set<PointNode>()

		startNode.gCost = 0
		startNode.hCost = this.manhattanDistance(start, end)
		startNode.updateFCost()

		openSet.add(startNode)

		while (openSet.size > 0) {
			const currentNode = this.getLowestFCostNode(openSet)

			if (currentNode === endNode) {
				return this.reconstructPath(endNode)
			}

			openSet.delete(currentNode)
			closedSet.add(currentNode)

			// Check all neighbors
			for (const [neighbor, baseCost] of currentNode.adjacentNodes) {
				if (closedSet.has(neighbor)) {
					continue
				}

				// Calculate direction change penalty and obstacle proximity
				const directionPenalty = this.calculateDirectionPenalty(currentNode, neighbor, obstacles)
				const tentativeGCost = currentNode.gCost + baseCost + directionPenalty

				if (!openSet.has(neighbor)) {
					openSet.add(neighbor)
				} else if (tentativeGCost >= neighbor.gCost) {
					continue
				}

				neighbor.parent = currentNode
				neighbor.gCost = tentativeGCost
				neighbor.hCost = this.manhattanDistance(neighbor.data, end)
				neighbor.updateFCost()
			}
		}

		return [] // No path found
	}

	/**
	 * Calculate penalty for direction changes and obstacle proximity
	 */
	private calculateDirectionPenalty(currentNode: PointNode, targetNode: PointNode, obstacles: Rectangle[] = []): number {
		let penalty = 0

		// Direction change penalty
		if (currentNode.parent) {
			const prevDirection = this.getDirection(currentNode.parent.data, currentNode.data)
			const currentDirection = this.getDirection(currentNode.data, targetNode.data)

			// Heavy penalty for diagonal movement (shouldn't happen in orthogonal routing)
			if (prevDirection === 'diagonal' || currentDirection === 'diagonal') {
				penalty += 1000
			}

			// Moderate penalty for direction changes
			if (prevDirection !== currentDirection) {
				penalty += 10
			}
		}

		// Light obstacle proximity penalty (reduced to not block all paths)
		for (const obstacle of obstacles) {
			const distanceToObstacle = this.getDistanceToRectangle(targetNode.data, obstacle)
			if (distanceToObstacle < 10) {
				// Only penalize if very close
				penalty += Math.max(0, 20 - distanceToObstacle) // Lighter penalty
			}
		}

		return penalty
	}

	/**
	 * Calculate minimum distance from point to rectangle
	 */
	private getDistanceToRectangle(point: Point, rect: Rectangle): number {
		const dx = Math.max(0, Math.max(rect.left - point.x, point.x - rect.right))
		const dy = Math.max(0, Math.max(rect.top - point.y, point.y - rect.bottom))
		return Math.sqrt(dx * dx + dy * dy)
	}

	/**
	 * Get direction between two points
	 */
	private getDirection(from: Point, to: Point): 'horizontal' | 'vertical' | 'diagonal' {
		const dx = Math.abs(to.x - from.x)
		const dy = Math.abs(to.y - from.y)

		if (dx === 0) return 'vertical'
		if (dy === 0) return 'horizontal'
		return 'diagonal'
	}

	connect(a: Point, b: Point) {
		const nodeA = this.get(a)
		const nodeB = this.get(b)

		if (!nodeA || !nodeB) {
			throw new Error('A point was not found')
		}

		const cost = distance(a, b)
		nodeA.adjacentNodes.set(nodeB, cost)
	}

	has(p: Point): boolean {
		const { x, y } = p
		const xs = x.toString()
		const ys = y.toString()
		return xs in this.index && ys in this.index[xs]
	}

	get(p: Point): PointNode | null {
		const { x, y } = p
		const xs = x.toString()
		const ys = y.toString()

		if (xs in this.index && ys in this.index[xs]) {
			return this.index[xs][ys]
		}

		return null
	}
}

/**
 * Gets the actual point of the connector based on the distance parameter
 * @param p
 */
function computePt(p: ConnectorPoint): Point {
	const b = Rectangle.fromRect(p.shape)
	switch (p.side) {
		case 'bottom':
			return makePt(b.left + b.width * p.distance, b.bottom)
		case 'top':
			return makePt(b.left + b.width * p.distance, b.top)
		case 'left':
			return makePt(b.left, b.top + p.distance)
		case 'right':
			return makePt(b.right, b.top + p.distance)
	}
}

/**
 * Extrudes the connector point by margin depending on it's side
 * @param cp
 * @param margin
 */
function extrudeCp(cp: ConnectorPoint, margin: number): Point {
	const { x, y } = computePt(cp)
	switch (cp.side) {
		case 'top':
			return makePt(x, y - margin)
		case 'right':
			return makePt(x + margin, y)
		case 'bottom':
			return makePt(x, y + margin)
		case 'left':
			return makePt(x - margin, y)
	}
}

/**
 * Returns flag indicating if the side belongs on a vertical axis
 * @param side
 */
function isVerticalSide(side: Side): boolean {
	return side === 'top' || side === 'bottom'
}

/**
 * Creates a grid of rectangles from the specified set of rulers, contained on the specified bounds
 * @param verticals
 * @param horizontals
 * @param bounds
 */
function rulersToGrid(verticals: number[], horizontals: number[], bounds: Rectangle): Grid {
	const result: Grid = new Grid()

	verticals.sort((a, b) => a - b)
	horizontals.sort((a, b) => a - b)

	let lastX = bounds.left
	let lastY = bounds.top
	let column = 0
	let row = 0

	for (const y of horizontals) {
		for (const x of verticals) {
			result.set(row, column++, Rectangle.fromLTRB(lastX, lastY, x, y))
			lastX = x
		}

		// Last cell of the row
		result.set(row, column, Rectangle.fromLTRB(lastX, lastY, bounds.right, y))
		lastX = bounds.left
		lastY = y
		column = 0
		row++
	}

	lastX = bounds.left

	// Last fow of cells
	for (const x of verticals) {
		result.set(row, column++, Rectangle.fromLTRB(lastX, lastY, x, bounds.bottom))
		lastX = x
	}

	// Last cell of last row
	result.set(row, column, Rectangle.fromLTRB(lastX, lastY, bounds.right, bounds.bottom))

	return result
}

/**
 * Returns an array without repeated points
 * @param points
 */
function reducePoints(points: Point[]): Point[] {
	const result: Point[] = []
	const map = new Map<number, number[]>()

	for (const p of points) {
		const { x, y } = p
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		const arr: number[] = map.get(y) || map.set(y, []).get(y)!

		if (arr.indexOf(x) < 0) {
			arr.push(x)
		}
	}

	for (const [y, xs] of map) {
		for (const x of xs) {
			result.push(makePt(x, y))
		}
	}

	return result
}

/**
 * Returns a set of spots generated from the grid, avoiding colliding spots with specified obstacles
 * @param grid
 * @param obstacles
 */
function gridToSpots(grid: Grid, obstacles: Rectangle[]): Point[] {
	const obstacleCollision = (p: Point) => obstacles.filter((o) => o.contains(p)).length > 0

	const gridPoints: Point[] = []

	for (const [row, data] of grid.data) {
		const firstRow = row === 0
		const lastRow = row === grid.rows - 1

		for (const [col, r] of data) {
			const firstCol = col === 0
			const lastCol = col === grid.columns - 1
			const nw = firstCol && firstRow
			const ne = firstRow && lastCol
			const se = lastRow && lastCol
			const sw = lastRow && firstCol

			if (nw || ne || se || sw) {
				gridPoints.push(r.northWest, r.northEast, r.southWest, r.southEast)
			} else if (firstRow) {
				gridPoints.push(r.northWest, r.north, r.northEast)
			} else if (lastRow) {
				gridPoints.push(r.southEast, r.south, r.southWest)
			} else if (firstCol) {
				gridPoints.push(r.northWest, r.west, r.southWest)
			} else if (lastCol) {
				gridPoints.push(r.northEast, r.east, r.southEast)
			} else {
				// for (let i = -30; i <= 30; i += 20) {
				// 	gridPoints.push({ x: r.center.x, y: r.center.y + i })
				// }
				gridPoints.push(r.northWest, r.north, r.northEast, r.east, r.southEast, r.south, r.southWest, r.west, r.center)
			}
		}
	}

	// for (const r of grid) {
	// 	gridPoints.push(
	// 		r.northWest,
	// 		r.north,
	// 		r.northEast,
	// 		r.east,
	// 		r.southEast,
	// 		r.south,
	// 		r.southWest,
	// 		r.west,
	// 		r.center
	// 	)
	// }

	// Reduce repeated points and filter out those who touch shapes
	return reducePoints(gridPoints).filter((p) => !obstacleCollision(p))
}

/**
 * Generate optimal routing points using channel-based approach
 * @param shapeA
 * @param shapeB
 * @param shapeMargin
 * @param obstacles
 */
function generateOptimalRoutingPoints(
	shapeA: ConnectorPoint,
	shapeB: ConnectorPoint,
	shapeMargin: number,
	obstacles: Rectangle[]
): Point[] {
	const routingPoints: Point[] = []
	const pointA = computePt(shapeA)
	const pointB = computePt(shapeB)

	// Calculate expanded bounding area for routing
	const allPoints = [
		pointA,
		pointB,
		...obstacles.flatMap((o) => [
			{ x: o.left, y: o.top },
			{ x: o.right, y: o.bottom }
		])
	]

	const minX = Math.min(...allPoints.map((p) => p.x)) - shapeMargin * 3
	const maxX = Math.max(...allPoints.map((p) => p.x)) + shapeMargin * 3
	const minY = Math.min(...allPoints.map((p) => p.y)) - shapeMargin * 3
	const maxY = Math.max(...allPoints.map((p) => p.y)) + shapeMargin * 3

	// Create routing channels with better spacing
	const verticalChannels = new Set<number>()
	const horizontalChannels = new Set<number>()

	// Add channels around obstacles with sufficient clearance
	for (const obstacle of obstacles) {
		// Add channels around each obstacle for routing
		verticalChannels.add(obstacle.left - shapeMargin)
		verticalChannels.add(obstacle.right + shapeMargin)

		horizontalChannels.add(obstacle.top - shapeMargin)
		horizontalChannels.add(obstacle.bottom + shapeMargin)
	}

	// Add channels for connection points with extensions
	verticalChannels.add(pointA.x)
	verticalChannels.add(pointB.x)
	horizontalChannels.add(pointA.y)
	horizontalChannels.add(pointB.y)

	// Add extended channels from connection points
	const extrudeA = extrudeCp(shapeA, shapeMargin)
	const extrudeB = extrudeCp(shapeB, shapeMargin)
	verticalChannels.add(extrudeA.x)
	verticalChannels.add(extrudeB.x)
	horizontalChannels.add(extrudeA.y)
	horizontalChannels.add(extrudeB.y)

	// Add boundary channels
	verticalChannels.add(minX)
	verticalChannels.add(maxX)
	horizontalChannels.add(minY)
	horizontalChannels.add(maxY)

	// Convert to sorted arrays
	const vChannels = Array.from(verticalChannels).sort((a, b) => a - b)
	const hChannels = Array.from(horizontalChannels).sort((a, b) => a - b)

	// Generate routing points at channel intersections
	for (const x of vChannels) {
		for (const y of hChannels) {
			const point = { x, y }

			// Check if point is not inside any obstacle
			const isInsideObstacle = obstacles.some((obstacle) => obstacle.contains(point))

			if (!isInsideObstacle) {
				routingPoints.push(point)
			}
		}
	}

	return reducePoints(routingPoints)
}

/**
 * Creates an optimized graph connecting the specified points orthogonally
 * @param spots
 * @param obstacles
 */
function createOptimizedGraph(
	spots: Point[],
	obstacles: Rectangle[] = []
): {
	graph: PointGraph
	connections: Line[]
} {
	const graph = new PointGraph()
	const connections: Line[] = []

	// Add all points to graph
	for (const p of spots) {
		graph.add(p)
	}

	// Create orthogonal connections only
	for (let i = 0; i < spots.length; i++) {
		const currentPoint = spots[i]

		for (let j = i + 1; j < spots.length; j++) {
			const targetPoint = spots[j]

			// Only connect if points are orthogonally aligned
			const isHorizontallyAligned = currentPoint.y === targetPoint.y
			const isVerticallyAligned = currentPoint.x === targetPoint.x

			if (isHorizontallyAligned || isVerticallyAligned) {
				// Check if there are no obstacles between points
				if (isPathClear(currentPoint, targetPoint, obstacles)) {
					graph.connect(currentPoint, targetPoint)
					graph.connect(targetPoint, currentPoint)
					connections.push({ a: currentPoint, b: targetPoint })
				}
			}
		}
	}

	return { graph, connections }
}

/**
 * Check if path between two orthogonally aligned points is clear of obstacles
 */
function isPathClear(pointA: Point, pointB: Point, obstacles: Rectangle[]): boolean {
	const isHorizontal = pointA.y === pointB.y
	const isVertical = pointA.x === pointB.x

	if (!isHorizontal && !isVertical) {
		return false
	}

	if (isHorizontal) {
		const minX = Math.min(pointA.x, pointB.x)
		const maxX = Math.max(pointA.x, pointB.x)
		const y = pointA.y

		// Check if the horizontal line intersects any obstacle
		for (const obstacle of obstacles) {
			// Allow lines to pass close to but not through obstacles
			if (y > obstacle.top + 2 && y < obstacle.bottom - 2) {
				// Line passes through the middle of the obstacle
				if (!(maxX <= obstacle.left || minX >= obstacle.right)) {
					// Line intersects with obstacle horizontally
					return false
				}
			}
		}
		return true
	}
	const minY = Math.min(pointA.y, pointB.y)
	const maxY = Math.max(pointA.y, pointB.y)
	const x = pointA.x

	// Check if the vertical line intersects any obstacle
	for (const obstacle of obstacles) {
		// Allow lines to pass close to but not through obstacles
		if (x > obstacle.left + 2 && x < obstacle.right - 2) {
			// Line passes through the middle of the obstacle
			if (!(maxY <= obstacle.top || minY >= obstacle.bottom)) {
				// Line intersects with obstacle vertically
				return false
			}
		}
	}
	return true
}

/**
 * Solves the shortest path for the origin-destination path using A* algorithm
 * @param graph
 * @param origin
 * @param destination
 * @param obstacles
 */
function shortestPath(graph: PointGraph, origin: Point, destination: Point, obstacles: Rectangle[] = []): Point[] {
	return graph.findShortestPath(origin, destination, obstacles)
}

/**
 * Given two segments represented by 3 points,
 * determines if the second segment bends on an orthogonal direction or not, and which.
 *
 * @param a
 * @param b
 * @param c
 * @return Bend direction, unknown if not orthogonal or 'none' if straight line
 */
function getBend(a: Point, b: Point, c: Point): BendDirection {
	const equalX = a.x === b.x && b.x === c.x
	const equalY = a.y === b.y && b.y === c.y
	const segment1Horizontal = a.y === b.y
	const segment1Vertical = a.x === b.x
	const segment2Horizontal = b.y === c.y
	const segment2Vertical = b.x === c.x

	if (equalX || equalY) {
		return 'none'
	}

	if (!(segment1Vertical || segment1Horizontal) || !(segment2Vertical || segment2Horizontal)) {
		return 'unknown'
	}

	if (segment1Horizontal && segment2Vertical) {
		return c.y > b.y ? 's' : 'n'
	}
	if (segment1Vertical && segment2Horizontal) {
		return c.x > b.x ? 'e' : 'w'
	}

	throw new Error('Nope')
}

/**
 * Enhanced path simplification with orthogonal optimization
 * @param points
 */
function simplifyPath(points: Point[]): Point[] {
	if (points.length <= 2) {
		return points
	}

	const simplified: Point[] = [points[0]]

	for (let i = 1; i < points.length - 1; i++) {
		const prev = points[i - 1]
		const current = points[i]
		const next = points[i + 1]

		// Check if current point is necessary for the path
		const isNecessary = !isCollinear(prev, current, next)

		if (isNecessary) {
			simplified.push(current)
		}
	}

	// Always include the last point
	simplified.push(points[points.length - 1])

	return simplified
}

/**
 * Check if three points are collinear (on the same line)
 */
function isCollinear(a: Point, b: Point, c: Point): boolean {
	// For orthogonal routing, points are collinear if they share the same x or y coordinate
	const sameX = a.x === b.x && b.x === c.x
	const sameY = a.y === b.y && b.y === c.y

	return sameX || sameY
}

/**
 * Helps create the grid portion of the algorithm
 */
class Grid {
	private _rows = 0
	private _cols = 0

	readonly data: Map<number, Map<number, Rectangle>> = new Map()

	set(row: number, column: number, rectangle: Rectangle) {
		this._rows = Math.max(this.rows, row + 1)
		this._cols = Math.max(this.columns, column + 1)

		const rowMap: Map<number, Rectangle> =
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			this.data.get(row) || this.data.set(row, new Map()).get(row)!

		rowMap.set(column, rectangle)
	}

	get(row: number, column: number): Rectangle | null {
		const rowMap = this.data.get(row)

		if (rowMap) {
			return rowMap.get(column) || null
		}

		return null
	}

	rectangles(): Rectangle[] {
		const r: Rectangle[] = []

		for (const [_, data] of this.data) {
			for (const [_, rect] of data) {
				r.push(rect)
			}
		}

		return r
	}

	get columns(): number {
		return this._cols
	}

	get rows(): number {
		return this._rows
	}
}

/**
 * Main logic wrapped in a class to hold a space for potential future functionallity
 */

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class OrthogonalConnector {
	static readonly byproduct: OrthogonalConnectorByproduct = {
		hRulers: [],
		vRulers: [],
		spots: [],
		grid: [],
		connections: []
	}

	static route(opts: OrthogonalConnectorOpts): Point[] {
		const { ctx, nodes, pointA, pointB, globalBoundsMargin } = opts
		const spots: Point[] = []
		const verticals: number[] = []
		const horizontals: number[] = []
		const sideA = pointA.side
		const sideAVertical = isVerticalSide(sideA)
		const sideB = pointB.side
		const sideBVertical = isVerticalSide(sideB)
		const originA = computePt(pointA)
		const originB = computePt(pointB)
		const shapeA = Rectangle.fromRect(pointA.shape)
		const shapeB = Rectangle.fromRect(pointB.shape)
		const bigBounds = Rectangle.fromRect(opts.globalBounds)
		let shapeMargin = opts.shapeMargin
		let inflatedA = shapeA.inflate(shapeMargin, shapeMargin)
		let inflatedB = shapeB.inflate(shapeMargin, shapeMargin)

		// Check bounding boxes collision
		if (inflatedA.intersects(inflatedB)) {
			shapeMargin = 0
			inflatedA = shapeA
			inflatedB = shapeB
		}

		const inflatedBounds = inflatedA.union(inflatedB).inflate(globalBoundsMargin, globalBoundsMargin)

		// Curated bounds to stick to
		const bounds = Rectangle.fromLTRB(
			Math.max(inflatedBounds.left),
			Math.max(inflatedBounds.top),
			Math.min(inflatedBounds.right),
			Math.min(inflatedBounds.bottom)
		)

		// Add edges to rulers
		for (const b of [inflatedA, inflatedB]) {
			verticals.push(b.left)
			verticals.push(b.right)
			horizontals.push(b.top)
			horizontals.push(b.bottom)
		}
		// Rulers at origins of shapes
		;(sideAVertical ? verticals : horizontals).push(sideAVertical ? originA.x : originA.y)
		;(sideBVertical ? verticals : horizontals).push(sideBVertical ? originB.x : originB.y)

		// Points of shape antennas
		for (const connectorPt of [pointA, pointB]) {
			const p = computePt(connectorPt)
			const add = (dx: number, dy: number) => spots.push(makePt(p.x + dx, p.y + dy))

			switch (connectorPt.side) {
				case 'top':
					add(0, -shapeMargin)
					break
				case 'right':
					add(shapeMargin, 0)
					break
				case 'bottom':
					add(0, shapeMargin)
					break
				case 'left':
					add(-shapeMargin, 0)
					break
			}
		}

		// Sort rulers
		verticals.sort((a, b) => a - b)
		horizontals.sort((a, b) => a - b)

		// Create grid
		const grid = rulersToGrid(verticals, horizontals, bounds)

		const shapes = Rectangle.fromRect(pointA.shape)
		const inflates: Rectangle[] = []
		for (const node of Object.values(nodes)) {
			const shape = Rectangle.fromRect({
				left: node.design.x,
				top: node.design.y,
				width: node.design.width || 0,
				height: node.design.height || 0
			})
			const inflate = shape.inflate(shapeMargin, shapeMargin)
			inflates.push(inflate)
		}

		// All obstacles including the connected shapes
		const allObstacles = [inflatedA, inflatedB, ...inflates]

		// Generate optimal routing points using channel-based approach
		const gridPoints = generateOptimalRoutingPoints(pointA, pointB, shapeMargin, allObstacles)

		// for (const grid of gridPoints) {
		// 	ctx.beginPath()
		// 	ctx.arc(grid.x, grid.y, 1, 0, 2 * Math.PI)
		// 	ctx.fillStyle = '#3498DB'
		// 	ctx.fill()
		// 	ctx.closePath()
		// }

		// Add to spots
		spots.push(...gridPoints)

		// Create optimized graph with obstacle awareness
		const { graph, connections } = createOptimizedGraph(spots, allObstacles)

		// Origin and destination by extruding antennas
		const origin = extrudeCp(pointA, shapeMargin)
		const destination = extrudeCp(pointB, shapeMargin)

		const start = computePt(pointA)
		const end = computePt(pointB)

		OrthogonalConnector.byproduct.spots = spots
		OrthogonalConnector.byproduct.vRulers = verticals
		OrthogonalConnector.byproduct.hRulers = horizontals
		OrthogonalConnector.byproduct.grid = grid.rectangles()
		OrthogonalConnector.byproduct.connections = connections

		const pathConnector = shortestPath(graph, origin, destination, allObstacles)

		if (pathConnector.length > 0) {
			return simplifyPath([start, ...shortestPath(graph, origin, destination, allObstacles), end])
			// biome-ignore lint/style/noUselessElse: <explanation>
		} else {
			return []
		}
	}
}
