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

	await addNewPolicy(lambdaRoleArn, destBucketName)
}

async function addNewPolicy (lambdaRoleArn, destBucketName) {
	const currentPolicy = await getCurrentPolicy(destBucketName)
	const putCrossAccountStatement = {
		Sid: 'Allow PUT/DELETE from Source-Account',
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
	let policy
	if (currentPolicy && currentPolicy.Statement) {
		currentPolicy.Statement.push(putCrossAccountStatement)
		policy = currentPolicy
	} else {
		policy = {
			Version: '2008-10-17',
			Statement: [
				putCrossAccountStatement
			]
		}
	}

	const params = {
		Bucket: destBucketName,
		Policy: JSON.stringify(policy)
	}
	await s3.putBucketPolicy(params).promise()
}

async function getCurrentPolicy (destBucketName) {
	const policy = await s3.getBucketPolicy({
		Bucket: destBucketName
	}).promise()

	try {
		return JSON.parse(policy.Policy)
	} catch (error) {
		return null
	}
}

main()
