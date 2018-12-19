const aws = require('aws-sdk')

const config = require('config')

const s3 = new aws.S3({ apiVersion: '2006-03-01' })

const argv = require('minimist')(process.argv.slice(2)) // eslint-disable-line import/no-extraneous-dependencies

async function main () {
	if (!argv['lambda-role-arn']) {
		throw new Error('Missing parameters lambda-arn')
	}
	const destBucketName = config.DestBucket
	const lambdaRoleArn = argv['lambda-role-arn']
	const policy = {
		Version: '2008-10-17',
		Statement: [
			{
				Sid: 'Allow PUT/DELETE from Source-Account via Lambda function',
				Effect: 'Allow',
				Principal: {
					AWS: lambdaRoleArn
				},
				Action: [
					's3:PutObject',
					's3:DeleteObject',
					's3:PutObjectAcl'
				],
				Resource: [
					`arn:aws:s3:::${destBucketName}`,
					`arn:aws:s3:::${destBucketName}/*`
				]
			}
		]
	}

	const params = {
		Bucket: destBucketName,
		Policy: JSON.stringify(policy)
	}
	await s3.putBucketPolicy(params).promise()
}

main()
