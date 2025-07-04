export type Slide = {
  id: number;
  title: string;
  subTitle: string;
  image: string;
  component: 'LanguageDetection' | 'AudioSample' | 'BasicSetup';
};
