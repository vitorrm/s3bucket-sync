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

	const currentPolicy = await getCurrentPolicy(lambdaRoleArn)
	await addNewPolicy(lambdaRoleArn, destBucketName, currentPolicy)
}

async function addNewPolicy (lambdaRoleArn, destBucketName, currentPolicy) {
	const putCrossStatement = {
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
		policy = currentPolicy.Statement.push(putCrossStatement)
	} else {
		policy = {
			Version: '2008-10-17',
			Statement: [
				putCrossStatement
			]
		}
	}

	const params = {
		Bucket: destBucketName,
		Policy: JSON.stringify(policy)
	}
	await s3.putBucketPolicy(params).promise()
}

async function getCurrentPolicy (lambdaRoleArn) {
	const policy = await s3.getBucketPolicy({
		Bucket: lambdaRoleArn
	}).promise()

	try {
		return JSON.parse(policy.Policy)
	} catch (error) {
		return null
	}
}

main()
