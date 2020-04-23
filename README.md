# street-manager-jobs

## TODO - Decouple README from CSV Jobs and make more generic.
## Suggestion - List out different jobs with a short description.

Node scripts to generate CSV exports and store in [AWS S3](https://aws.amazon.com/s3/).

Jobs are executed through the [CSV Worker](https://github.com/departmentfortransport/street-manager-csv-worker) when deployed on Kubernetes.

Jobs can also be ran ad-hoc using the steps outlined below:

### Prerequisites

Initialise CSV through the Data Export API. This will create a CSV Export entry in the database return a CSV ID.

### To run locally
Authenticate yourself to AWS through the CLI
```
$ export CSV_ID={CSV ID from Data Export API}
$ npm run start
```

### To run on Kubernetes
Copy job template and save locally
Update change_me values (see keybase for an example template)
```
kubectl -n <namespace> apply -f <template.yaml path>
kubectl -n <namespace> delete job <job metadata.name>
```

### To run integration tests locally
Uncomment the csv-jobs service in the master-docker-compose.yaml file (or the "docker-compose.yaml" symlink at the route of the streetmanager directory)
```
docker-compose up csv-jobs
docker-compose run --rm csv-jobs sh -c 'npm run test-integration'
```

### To run on a feature branch environment

1. Push code changes to a remote branch in street-manager-csv-jobs
2. Use commit hash of your commit in street-manager-csv-jobs to update street-manager-csv-worker [here](https://github.com/departmentfortransport/street-manager-csv-worker/blob/master/src/config.ts#L1). For example,
```
export const CSV_JOBS_TAG = 'bf07bcb8ed2a16aa7765b2fb2de4f7628dd07ccd'
```
3. Push this change to a remote branch in street-manager-csv-worker, with the same branch name as used in street-manager-csv-jobs
4. Build feature branch environment as normal
5. Do not merge these changes into street-manager-csv-worker. Instead, follow the release process below

### Release process

1. Raise PR in street-manager-jobs
2. Code review approved by 2 teams
3. Code is merged to master
4. Checkout master and pull latest code
5. Once build is green, code owner creates a tag for the new csv-job `git tag -a v1.1.PATCH_VERSION -m "Description of Job change"` and pushes it `git push --tags`
6. CircleCI will push the new tag to dev, pre-prod and production ECRs
7. Update tag in CSV Worker [here](https://github.com/departmentfortransport/street-manager-worker/blob/master/src/config.ts#L2)

Note: A minor version should be bumped if a new job is added, for bug fixing or extensions just update the patch version.