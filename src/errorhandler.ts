import type { ViewModel, Vue, VueOptions } from './types';
import { formatComponentName, generateComponentTrace, replaceErrors } from './helper';
type UnknownFunc = (...args: unknown[]) => void;

export const attachErrorHandler = (app: Vue, options: VueOptions): void => {
  if (options.ignoreHandler) {
    return;
  }

  const { errorHandler, warnHandler, silent } = app.config;
  app.config.errorHandler = (error: Error, vm: ViewModel, lifecycleHook: string): void => {
    const componentName = formatComponentName(vm, false);
    const trace = vm ? generateComponentTrace(vm) : '';
    const metadata: Record<string, unknown> = {
      message: `${error && error.toString()}`,
      componentName,
      lifecycleHook,
      trace,
      raw: JSON.parse(JSON.stringify(error, replaceErrors)),
    };

    if (options.attachProps && vm) {
      // Vue2 - $options.propsData
      // Vue3 - $props
      if (vm.$options && vm.$options.propsData) {
        metadata.propsData = vm.$options.propsData;
      } else if (vm.$props) {
        metadata.propsData = vm.$props;
      }
    }

    if (typeof errorHandler === 'function') {
      (errorHandler as UnknownFunc).call(app, error, vm, lifecycleHook);
    }

    if (options.logErrors) {
      const hasConsole = typeof console !== 'undefined';
      const message = `Error in ${lifecycleHook}: "${error && error.toString()}"`;

      if (warnHandler) {
        (warnHandler as UnknownFunc).call(null, message, vm, trace);
      } else if (hasConsole && !silent) {
        // eslint-disable-next-line no-console
        console.error(`[Vue warn]: ${message}${trace}`);
      }
    }

    if (typeof options.provider === 'function') {
        options.provider(metadata);
    }
  };
};