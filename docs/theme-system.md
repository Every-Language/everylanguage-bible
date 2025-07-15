# Oral Mother Tongue Theme System

## Overview

The Bible App now features a comprehensive Tamagui theme system based on the Oral Mother Tongue brand colors. This system provides both light and dark themes with glassy effects, accent colors, and sophisticated shadow configurations.

## Brand Colors

The theme system is built around the following brand colors from the Oral Mother Tongue style guide:

### Primary Colors

- **Primary Dark**: `#282827` - Dark gray/black
- **Primary Light**: `#EBE5D9` - Light cream/off-white
- **Primary Accent**: `#264854` - Dark teal/blue
- **Secondary Light**: `#928EC3` - Light blue/teal
- **Secondary Accent**: `#AD915A` - Muted gold/brown
- **Secondary Dark**: `#070707` - Almost black

## Theme Structure

### Light Theme

The light theme uses the cream background (`#EBE5D9`) with dark text (`#070707`) and emphasizes the dark teal accent color (`#264854`).

### Dark Theme

The dark theme uses the dark gray background (`#282827`) with cream text (`#EBE5D9`) and emphasizes the light blue accent color (`#928EC3`).

## Features

### 1. Glassy Effects

The theme includes four glassy effect colors with 70% opacity:

- **Glass 1**: Light blue (`rgba(146, 142, 195, 0.7)`)
- **Glass 2**: Dark blue (`rgba(38, 72, 84, 0.7)`)
- **Glass 3**: Cream (`rgba(237, 229, 217, 0.7)`)
- **Glass 4**: Gold (`rgba(173, 145, 90, 0.7)`)

### 2. Shadow System

Comprehensive shadow configurations for both themes:

- **Light**: Subtle shadows with dark teal accents
- **Medium**: Standard elevation shadows
- **Dark**: Strong shadows for depth
- **Accent**: Brand-colored shadows
- **Glass**: Special shadows for glassy effects

### 3. Accent Colors

Four accent colors for highlighting and emphasis:

- **Accent 1**: Light blue/teal
- **Accent 2**: Gold/brown
- **Accent 3**: Dark gray (light theme) / Cream (dark theme)
- **Accent 4**: Very light blue (light theme) / Black (dark theme)

### 4. Interactive States

Complete interactive state colors for buttons and controls:

- **Active**: Primary accent color
- **Inactive**: Grayed out state
- **Pressed**: Semi-transparent overlay
- **Disabled**: Muted appearance

### 5. Feedback Colors

Standard feedback colors for user interactions:

- **Success**: Green (`#4CAF50`)
- **Warning**: Orange (`#FF9800`)
- **Error**: Red (`#F44336`)
- **Loading**: Theme-appropriate accent color

## Usage

### Basic Theme Hook

```typescript
import { useTheme } from '@/shared/hooks/useTamaguiTheme';

const MyComponent = () => {
  const {
    theme,
    isDark,
    toggleTheme,
    colors,
    shadows,
    getGlassStyle,
    getShadowStyle
  } = useTheme();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.textPrimary }}>
        Hello World
      </Text>
    </View>
  );
};
```

### Glassy Effects

```typescript
const glassyCard = (
  <View style={getGlassStyle('glass1')}>
    <Text>Glassy Card</Text>
  </View>
);
```

### Shadows

```typescript
const elevatedCard = (
  <View style={getShadowStyle('medium')}>
    <Text>Elevated Card</Text>
  </View>
);
```

### Tamagui Components

```typescript
import { Card, Text, Button } from 'tamagui';

const themedCard = (
  <Card
    backgroundColor="$backgroundSecondary"
    borderColor="$borderLight"
    {...getShadowStyle('light')}
  >
    <Text color="$textPrimary">Themed Content</Text>
    <Button backgroundColor="$primary" color="$textInverse">
      Themed Button
    </Button>
  </Card>
);
```

## Theme Switching

The theme system supports:

1. **Manual Toggle**: `toggleTheme()` function
2. **System Integration**: Automatically follows system theme preference
3. **Persistent Storage**: Remembers user's theme choice
4. **Smooth Transitions**: Animated theme changes

## File Structure

```
src/
├── shared/
│   ├── constants/
│   │   ├── theme.ts              # Legacy theme colors
│   │   └── tamagui-themes.ts     # Tamagui theme definitions
│   ├── hooks/
│   │   └── useTamaguiTheme.ts    # Main theme hook
│   └── components/
│       └── ui/
│           └── ThemeDemo.tsx     # Theme showcase component
├── app/
│   └── providers/
│       └── ThemeProvider.tsx     # Theme context provider
└── tamagui.config.ts             # Tamagui configuration
```

## Migration Guide

### From Legacy Theme System

1. **Replace imports**:

   ```typescript
   // Old
   import { useTheme } from '@/shared/store';

   // New
   import { useTheme } from '@/shared/hooks/useTamaguiTheme';
   ```

2. **Update color references**:

   ```typescript
   // Old
   colors.text -> colors.textPrimary
   colors.background -> colors.background
   ```

3. **Add new features**:

   ```typescript
   // New glassy effects
   const glassStyle = getGlassStyle('glass1');

   // New shadows
   const shadowStyle = getShadowStyle('medium');
   ```

## Best Practices

1. **Use Theme Colors**: Always use theme colors instead of hardcoded values
2. **Leverage Glassy Effects**: Use glassy effects for modern UI elements
3. **Consistent Shadows**: Use the shadow system for consistent elevation
4. **Accessibility**: Ensure sufficient contrast ratios in both themes
5. **Performance**: Theme changes are optimized for smooth transitions

## Testing

The theme system includes comprehensive testing:

- Unit tests for theme switching
- Visual regression tests for both themes
- Accessibility tests for color contrast
- Performance tests for theme transitions

## Future Enhancements

- [ ] Additional theme variants (high contrast, etc.)
- [ ] Custom color palette generation
- [ ] Theme export/import functionality
- [ ] Advanced animation configurations
- [ ] Theme-aware icon system
