'use strict';

const join = require('path').join;
const relative = require('path').relative;
const Promise = require('bluebird');
const glob = Promise.promisify(require('glob'));
const co = require('co');
const u = require('updeep').default;
const R = require('ramda');
const gcloud = require('gcloud')({
  projectId: 'starboard-1277',
  keyFilename: join(__dirname, '../local/starboard-ui-deploy.json'),
});

const gcs = gcloud.storage();
const bucket = gcs.bucket('static.getstarboard.xyz');

Promise.promisifyAll(Object.getPrototypeOf(bucket));

const DEFAULT = {
  gzip: true,
  metadata: {
    acl: [
      {
        entity: 'allUsers',
        role: gcs.acl.READER_ROLE,
      }
    ],
    cacheControl: 'max-age=31556926',
  },
};

const mergeDefault = R.pipe(
  u(u._, DEFAULT),
  R.clone
);

co(function *() {
  const files = yield glob(join(__dirname, '../public/*'));
  yield Promise.all(files.map(upload));
})
.catch(console.error);

function upload(file) {
  console.log(`Uploading ${file}`);
  const opts = mergeDefault({
    desination: relative(join(__dirname, '../public'), file),
  });
  return bucket.uploadAsync(file, opts);
}
