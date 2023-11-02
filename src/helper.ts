import { ViewModel } from "./types";

const classifyRE = /(?:^|[-_])(\w)/g;
const classify = (str: string): string => str.replace(classifyRE, c => c.toUpperCase()).replace(/[-_]/g, '');

const ROOT_COMPONENT_NAME = '<Root>';
const ANONYMOUS_COMPONENT_NAME = '<Anonymous>';

const repeat = (str: string, n: number): string => {
    // string.repeat() is not supported by IE11, we fall back to just using the string in that case
    // eslint-disable-next-line @sentry-internal/sdk/no-unsupported-es6-methods
    return str.repeat ? str.repeat(n) : str;
};

export const formatComponentName = (vm?: ViewModel, includeFile?: boolean): string => {
    if (!vm) {
        return ANONYMOUS_COMPONENT_NAME;
    }

    if (vm.$root === vm) {
        return ROOT_COMPONENT_NAME;
    }

    // https://github.com/getsentry/sentry-javascript/issues/5204 $options can be undefined
    if (!vm.$options) {
        return ANONYMOUS_COMPONENT_NAME;
    }

    const options = vm.$options;

    let name = options.name || options._componentTag;
    const file = options.__file;
    if (!name && file) {
        const match = file.match(/([^/\\]+)\.vue$/);
        if (match) {
            name = match[1];
        }
    }

    return (
        (name ? `<${classify(name)}>` : ANONYMOUS_COMPONENT_NAME) + (file && includeFile !== false ? ` at ${file}` : '')
    );
};

export const generateComponentTrace = (vm?: ViewModel): string => {
    if (vm && (vm._isVue || vm.__isVue) && vm.$parent) {
        const tree = [] as Array<ViewModel>;
        let currentRecursiveSequence = 0;
        while (vm) {
            if (tree.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const last = tree[tree.length - 1] as any;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (last.constructor === vm.constructor) {
                    currentRecursiveSequence++;
                    vm = vm.$parent; // eslint-disable-line no-param-reassign
                    continue;
                } else if (currentRecursiveSequence > 0) {
                    tree[tree.length - 1] = [last, currentRecursiveSequence] as any;
                    currentRecursiveSequence = 0;
                }
            }
            tree.push(vm);
            vm = vm.$parent; // eslint-disable-line no-param-reassign
        }

        const formattedTree = tree
            .map(
                (vm, i) =>
                    `${
                        (i === 0 ? '---> ' : repeat(' ', 5 + i * 2)) +
                        (Array.isArray(vm)
                            ? `${formatComponentName(vm[0])}... (${vm[1]} recursive calls)`
                            : formatComponentName(vm))
                    }`,
            )
            .join('\n');

        return `\n\nfound in\n\n${formattedTree}`;
    }

    return `\n\n(found in ${formatComponentName(vm)})`;
};