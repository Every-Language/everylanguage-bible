import { render } from '@testing-library/react-native';
import { OnBoardingScreen } from '../screens';

describe('<OnBoardingScreen />', () => {
  it('has 1 child', () => {
    const tree = render(<OnBoardingScreen />).toJSON();
    expect(tree.children.length).toBe(1);
  });
});
