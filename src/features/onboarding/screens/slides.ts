import { Slide } from '@/types/onboarding';

const Slides: Slide[] = [
  {
    id: 1,
    title: 'Language detection',
    subTitle: 'We think you speak [Language]. Is this correct?',
    image: '',
    component: 'LanguageDetection',
  },
  {
    id: 2,
    title: 'Listen to word of God',
    subTitle: "Tap to hear God's Word in your language",
    image: '',
    component: 'AudioSample',
  },
  {
    id: 3,
    title: 'Another slide',
    subTitle: "Tap to hear God's Word in your language",
    image: '',
    component: 'BasicSetup',
  },
];

export default Slides;
