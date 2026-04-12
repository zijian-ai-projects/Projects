export type HomeCopy = {
  brand: string;
  brandRoman: string;
  slogan: string;
  nav: {
    start: string;
  };
  topbar: {
    languageLabel: string;
    themeLabel: string;
    themeOptions: {
      light: string;
      dark: string;
      system: string;
    };
    github: string;
    githubUnavailable: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    primaryCta: string;
    secondaryCta: string;
    previewLabel: string;
    previewQuestion: string;
    previewLeftTitle: string;
    previewLeftBody: string;
    previewRightTitle: string;
    previewRightBody: string;
    previewEvidence: string;
  };
  value: {
    eyebrow: string;
    title: string;
    body: string;
    items: Array<{
      title: string;
      body: string;
    }>;
  };
  flow: {
    eyebrow: string;
    title: string;
    steps: Array<{
      title: string;
      body: string;
    }>;
  };
  features: {
    eyebrow: string;
    title: string;
    items: Array<{
      title: string;
      body: string;
    }>;
  };
  scenarios: {
    eyebrow: string;
    title: string;
    items: string[];
  };
  cta: {
    title: string;
    body: string;
    action: string;
  };
};
