# street-manager-jobs

Node scripts for asynchronous tasks utilised by street manager. These tasks, known as jobs, are outlined below:

## Jobs
1. generate-sample-inspections - Generates sample inspection records for a given HA organisation. The number of sample inspections generated is based on the sample inspection targets set by the HA.

## Repo Structure and Rules
* Jobs are split by directory i.e. `src/job-1/**`, `src/job-2/**`
* A src/common folder is present that will house all common elements i.e. Logger
* One Job should never import anything from another Job's sub-folder.
* DB Config is setup per job, because there is no guarantee that all jobs will require a DB connection and therefore does not make sense to force a DB connection to be setup.
* COMMON_TYPES should never be referenced in individual services. It is just a base object for other TYPES consts to extend
* Each job will have it's own script in the package.json

Jobs are executed through the [Worker](https://github.com/departmentfortransport/street-manager-worker) when deployed on Kubernetes.

Jobs can also be ran ad-hoc using the steps outlined below. Some jobs may require additional setup depending on their function.

### To run job locally
```
$ export GENERATE_SAMPLE_INSPECTIONS_JOB_ID={JOB ID from async_job table}
$ npm run build
$ npm run generate-sample-inspections
```

### To run on Kubernetes
Copy job template and save locally
Update change_me values (see keybase for an example template)
```
kubectl -n <namespace> apply -f <template.yaml path>
kubectl -n <namespace> delete job <job metadata.name>
```

### To run integration tests locally
Uncomment the jobs service in the master-docker-compose.yaml file (or the "docker-compose.yaml" symlink at the route of the streetmanager directory)
```
docker-compose up jobs
docker-compose run --rm jobs sh -c 'npm run test-integration'
```

### To run on a feature branch environment

1. Push code changes to a remote branch in street-manager-jobs
2. Use commit hash of your commit in street-manager-jobs to update street-manager-worker [here](https://github.com/departmentfortransport/street-manager-worker/blob/master/src/config.ts#L2). For example,
```
export const JOBS_TAG = 'bf07bcb8ed2a16aa7765b2fb2de4f7628dd07ccd'
```
3. Push this change to a remote branch in street-manager-worker, with the same branch name as used in street-manager-jobs
4. Build feature branch environment as normal
5. Do not merge these changes into street-manager-worker. Instead, follow the release process below

### Release process

1. Raise PR in street-manager-jobs
2. Code review approved by 2 team members
3. Code is merged to master
4. Checkout master and pull latest code
5. Once build is green, code owner creates a tag for the new job `git tag -a v1.1.PATCH_VERSION -m "Description of Job change"` and pushes it `git push --tags`
6. CircleCI will push the new tag to dev, pre-prod and production ECRs
7. Update tag in Worker [here](https://github.com/departmentfortransport/street-manager-worker/blob/master/src/config.ts#L2)

Note: A minor version should be bumped if a new job is added, for bug fixing or extensions just update the patch version.
