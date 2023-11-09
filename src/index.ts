import { VueOptions } from '@/types';
import { attachErrorHandler } from '@/errorhandler';

const init = (options: VueOptions) => {
    if (!options.Vue && !options.app) {
        // eslint-disable-next-line no-console
        console.warn(
            `Misconfigured SDK. Vue specific errors will not be captured.
    Update your \`init\` call with an appropriate config option:
    \`app\` (Application Instance - Vue 3) or \`Vue\` (Vue Constructor - Vue 2).`
        );
        return;
    }

    if (options.app) {
        const apps = Array.isArray(options.app) ? options.app : [options.app];
        apps.forEach((app) => attachErrorHandler(app, options));
    } else if (options.Vue) {
        attachErrorHandler(options.Vue, options);
    }
};

export { init };
