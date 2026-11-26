// jsdom ships without types and the project does not add @types/jsdom; this is the one slice e2e/html-seo.test.ts uses.
declare module "jsdom" {
  export class JSDOM {
    constructor(html?: string);
    window: { document: Document };
  }
}
