const logInject = require('../../lib/logInject')
const aws = require('aws-sdk')

const s3 = new aws.S3({ apiVersion: '2006-03-01' })

module.exports.handler = logInject(handler)

async function handler (log, event, context, callback) {
	try {
		const input = event.Records[0]
		log.debug('Sync process started. Input:', input)
		const objectKey = input.s3.object.key
		const sourceBucketName = input.s3.bucket.name
		const { eventName } = input

		if (eventName.startsWith('ObjectRemoved')) {
			log.debug('Removing object')
			await s3.deleteObject({
				Bucket: process.env.DEST_BUCKET,
				Key: objectKey
			}).promise()
		} else {
			log.debug('copying object')
			await s3.copyObject({
				Bucket: process.env.DEST_BUCKET,
				CopySource: `${sourceBucketName}/${objectKey}`,
				Key: objectKey,
				ACL: 'bucket-owner-full-control'
			}).promise()
		}

		return callback(null, {
			message: 'success',
			eventName,
			objectKey,
			destBucket: process.env.DEST_BUCKET
		})
	} catch (err) {
		log.error('Something went wrong:', err)
		return callback(err)
	}
}
