set -e # Stop on error
if [ -z ${S3_BUCKET} ]; then echo "Please set S3_BUCKET environment variable before running"; exit 1; fi
TEMP_DIR=`mktemp -d`
mkdir ${TEMP_DIR}/html
for file in ./config/*.json 
do
	envsubst '\$S3_BUCKET' <${file} >$TEMP_DIR/`basename ${file}`
done
for file in ./html/*
do
	envsubst '\$S3_BUCKET' <${file} >$TEMP_DIR/html/`basename ${file}`
done
echo Temp dir is $TEMP_DIR
aws s3 mb s3://${S3_BUCKET}
aws s3api put-bucket-policy --bucket ${S3_BUCKET} --policy file://${TEMP_DIR}/bucket_policy.json
aws s3 sync ${TEMP_DIR}/html/ s3://${S3_BUCKET}/ --acl public-read
aws s3api put-bucket-website --cli-input-json file://${TEMP_DIR}/website_config.json
cd lambda
npm install -D
./node_modules/.bin/claudia create --region us-east-1 --handler index.handler --policies ${TEMP_DIR}/role_policy.json
claudia add-s3-event-source --bucket ${S3_BUCKET} --prefix upload
