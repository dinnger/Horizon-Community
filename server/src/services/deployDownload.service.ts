import archiver from 'archiver'
import * as fs from 'node:fs'
import * as path from 'node:path'

export async function compressPathToBase64(targetPath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = []

		// Create archiver instance
		const archive = archiver('zip', {
			zlib: { level: 9 } // Maximum compression
		})

		// Handle errors
		archive.on('error', (err) => {
			reject(err)
		})

		// Collect data chunks
		archive.on('data', (chunk) => {
			chunks.push(chunk)
		})

		// When archive is finalized, convert to base64
		archive.on('end', () => {
			const buffer = Buffer.concat(chunks)
			const base64 = buffer.toString('base64')

			// Delete the original path after successful compression
			try {
				if (stat.isDirectory()) {
					fs.rmSync(targetPath, { recursive: true, force: true })
				} else if (stat.isFile()) {
					fs.unlinkSync(targetPath)
				}
			} catch (deleteError) {
				console.error(`Warning: Could not delete original path ${targetPath}:`, deleteError)
			}

			resolve(base64)
		})

		// Check if path exists
		if (!fs.existsSync(targetPath)) {
			reject(new Error(`Path does not exist: ${targetPath}`))
			return
		}

		const stat = fs.statSync(targetPath)

		if (stat.isDirectory()) {
			// Add directory contents
			archive.directory(targetPath, false)
		} else if (stat.isFile()) {
			// Add single file
			archive.file(targetPath, { name: path.basename(targetPath) })
		} else {
			reject(new Error(`Path is neither a file nor a directory: ${targetPath}`))
			return
		}

		// Finalize the archive
		archive.finalize()
	})
}
