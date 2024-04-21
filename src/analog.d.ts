interface ImportAttributes {
  analog: 'imports' | 'providers' | 'viewProviders' | 'exposes';
}

declare global {
  import type { Component } from '@angular/core';

  interface Window {
    /**
     * Define the metadata for the component.
     * @param metadata
     */
    defineMetadata: (
      metadata: Omit<
        Component,
        'template' | 'standalone' | 'changeDetection' | 'styles' | 'outputs' | 'inputs'
      >,
    ) => void;

    /**
     * Invoke the callback when the component is initialized.
     */
    onInit: (initFn: () => void) => void;
    /**
     * Invoke the callback when the component is destroyed.
     */
    onDestroy: (destroyFn: () => void) => void;
  }
}

declare module '*.analog' {
  import { Type } from '@angular/core';

  const cmp: Type<any>;
  export default cmp;
}
