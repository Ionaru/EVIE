import { removeSync } from 'fs-extra';
import { task } from 'gulp';

// Clean /dist folder
task('clean', () => {
    return removeSync('dist');
});
