# freehashservice
AWS Hosted Free list-hashing service

This configures a free list-hashing service using a serverless Amazon AWS stack. The service presents a static HTML webpage that allows users to upload a text-file to an Amazon S3 bucket. Upon upload, the file is processed by an AWS Lambda triggered job which will generate the SHA256 hash for each line in the text-file. The resulting hash file will be written back to a downloadable URL and the user will be given the link to download the results.

The raw data file will be deleted immediately upon processing and the hashed data-file will be deleted after 24 hours.

To get started, you need to have the following:
1. An Amazon AWS account with permissions to manage Lambda, S3, and IAM roles (ensure that your key is properly configured for cli access)
2. The AWS cli client installed
3. node.js/npm installed

Once you've met these pre-requisites, set the S3_BUCKET environment variable to the name of the bucket you would like to create and run the provision script

```
S3_BUCKET=<BUCKETNAME> ./provision
```

This has only been tested on MacOS
