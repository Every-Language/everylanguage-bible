import { renderHook, act } from '@testing-library/react-native';
import { useTranslation } from '../useTranslation';

// Mock i18next
const mockT = jest.fn((key, params) => {
  if (params && typeof params === 'object') {
    let result = key;
    Object.keys(params).forEach(param => {
      result = result.replace(`{{${param}}}`, params[param]);
    });
    return result;
  }
  return `translated:${key}`;
});

const mockI18n = {
  isInitialized: true,
  language: 'fr',
  changeLanguage: jest.fn(() => Promise.resolve()),
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT, i18n: mockI18n }),
}));

describe('useTranslation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockI18n.isInitialized = true;
    mockI18n.language = 'fr';
  });

  it('returns t, language, and changeLanguage when initialized', () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.language).toBe('fr');
    expect(typeof result.current.t).toBe('function');
    expect(typeof result.current.changeLanguage).toBe('function');
  });

  it('calls t with key and params', () => {
    const { result } = renderHook(() => useTranslation());
    result.current.t('hello', { name: 'Luke' });
    expect(mockT).toHaveBeenCalledWith('hello', { name: 'Luke' });
  });

  it('calls changeLanguage', async () => {
    const { result } = renderHook(() => useTranslation());
    await act(async () => {
      await result.current.changeLanguage('en');
    });
    expect(mockI18n.changeLanguage).toHaveBeenCalledWith('en');
  });

  it('returns fallback t and changeLanguage when not initialized', () => {
    mockI18n.isInitialized = false;
    const { result } = renderHook(() => useTranslation());
    expect(result.current.language).toBe('en');
    expect(typeof result.current.t).toBe('function');
    expect(typeof result.current.changeLanguage).toBe('function');
  });

  it('fallback t returns key if not initialized', () => {
    mockI18n.isInitialized = false;
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('greeting')).toBe('greeting');
  });

  it('fallback t interpolates params if not initialized', () => {
    mockI18n.isInitialized = false;
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('hello {{name}}', { name: 'Luke' })).toBe(
      'hello Luke'
    );
  });

  it('fallback changeLanguage resolves', async () => {
    mockI18n.isInitialized = false;
    const { result } = renderHook(() => useTranslation());
    await expect(result.current.changeLanguage('es')).resolves.toBeUndefined();
  });
});
