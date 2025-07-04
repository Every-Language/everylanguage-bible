import {
  createNavigationContainerRef,
  StackActions,
} from '@react-navigation/native';
import { RootStackParamList } from '../App';

const navigationRef = createNavigationContainerRef<RootStackParamList>();

const navigate = <RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName]
) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params as any); // Type assertion needed due to generic limitations
  }
};

const push = <RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName]
) => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.push(name, params as any));
  }
};

const goBack = () => {
  if (navigationRef.isReady()) {
    navigationRef.goBack();
  }
};

const replace = <RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName]
) => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.replace(name, params as any));
  }
};

const reset = (
  routes: { name: keyof RootStackParamList; params?: any }[],
  index: number = 0
) => {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index,
      routes: routes.map(route => ({ name: route.name, params: route.params })),
    });
  }
};

export { navigate, push, goBack, replace, reset, navigationRef };
