// Import snack-sdk with dynamic path resolution
let Snack;
try {
  // Try different import approaches
  let snackSDK;
  try {
    // Try direct require first
    snackSDK = require('snack-sdk');
  } catch (e1) {
    // Try with global module resolution
    const { execSync } = require('child_process');
    try {
      const globalPath = execSync('npm root -g', { encoding: 'utf8' }).trim();
      snackSDK = require(globalPath + '/snack-sdk');
    } catch (e2) {
      throw new Error('Could not find snack-sdk');
    }
  }

  Snack = snackSDK.Snack;
  if (!Snack) {
    throw new Error('Snack class not found in snack-sdk');
  }
} catch (error) {
  console.error('❌ Could not import snack-sdk. Please install it first:');
  console.error('npm install -g snack-sdk');
  console.error('Error:', error.message);
  process.exit(1);
}

const fs = require('fs').promises;
const path = require('path');

// Read all necessary files
async function readFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Failed to read file ${filePath}:`, error);
    return null;
  }
}

// Create a complete Snack with all files preserved
const createCompleteSnack = async () => {
  console.log('🚀 Creating complete Snack with all components...');

  try {
    // Read all the component files
    const [
      appContent,
      pokemonContent,
      pokemonCardContent,
      pokedexCollectionContent,
      usePokemonContent,
      pokemonNamesContent,
      pokemonThemeContent,
      pokemonTypeColorsContent,
      colorsContent,
      storageContent,
      hooksContent,
    ] = await Promise.all([
      readFile('./App.tsx'),
      readFile('./screens/pokemon/Pokemon.tsx'),
      readFile('./screens/pokemon/PokemonCardSwipeable.tsx'),
      readFile('./screens/pokemon/PokedexTrainerCollection.tsx'),
      readFile('./screens/pokemon/usePokemon.ts'),
      readFile('./screens/pokemon/pokemonNames.ts'),
      readFile('./screens/pokemon/constants/PokemonTheme.ts'),
      readFile('./screens/pokemon/pokemonTypeColors.ts'),
      readFile('./screens/pokemon/constants/Colors.ts'),
      readFile('./utils/storage.ts'),
      readFile('./utils/hooks.ts'),
    ]);

    // Verify all files were read successfully
    const files = {
      appContent,
      pokemonContent,
      pokemonCardContent,
      pokedexCollectionContent,
      usePokemonContent,
      pokemonNamesContent,
      pokemonThemeContent,
      pokemonTypeColorsContent,
      colorsContent,
      storageContent,
      hooksContent,
    };

    const missingFiles = Object.entries(files)
      .filter(([_, content]) => content === null)
      .map(([name]) => name);

    if (missingFiles.length > 0) {
      console.error('❌ Missing files:', missingFiles);
      return;
    }

    // Create the Snack with all files
    const snack = new Snack({
      name: 'Ultimate Pokédex - Complete Pokemon Card App',
      description: 'A beautiful, fully-featured Pokemon card collection app with swipe gestures, animations, and real Pokemon data from the PokeAPI. Features holographic card effects, blur backgrounds, haptic feedback, and a complete trainer collection system.',
      files: {
        'App.tsx': {
          type: 'CODE',
          contents: appContent,
        },
        'screens/pokemon/Pokemon.tsx': {
          type: 'CODE',
          contents: pokemonContent,
        },
        'screens/pokemon/PokemonCardSwipeable.tsx': {
          type: 'CODE',
          contents: pokemonCardContent,
        },
        'screens/pokemon/PokedexTrainerCollection.tsx': {
          type: 'CODE',
          contents: pokedexCollectionContent,
        },
        'screens/pokemon/usePokemon.ts': {
          type: 'CODE',
          contents: usePokemonContent,
        },
        'screens/pokemon/pokemonNames.ts': {
          type: 'CODE',
          contents: pokemonNamesContent,
        },
        'screens/pokemon/constants/PokemonTheme.ts': {
          type: 'CODE',
          contents: pokemonThemeContent,
        },
        'screens/pokemon/pokemonTypeColors.ts': {
          type: 'CODE',
          contents: pokemonTypeColorsContent,
        },
        'screens/pokemon/constants/Colors.ts': {
          type: 'CODE',
          contents: colorsContent || '// Colors file',
        },
        'utils/storage.ts': {
          type: 'CODE',
          contents: storageContent,
        },
        'utils/hooks.ts': {
          type: 'CODE',
          contents: hooksContent,
        },
        'package.json': {
          type: 'CODE',
          contents: await readFile('./package-snack.json'),
        },
      },
      dependencies: {
        '@expo/vector-icons': { version: '^13.0.0' },
        '@react-native-async-storage/async-storage': { version: '^1.21.0' },
        '@tanstack/react-query': { version: '^5.89.0' },
        'expo-blur': { version: '~12.9.2' },
        'expo-haptics': { version: '~12.8.1' },
        'expo-linear-gradient': { version: '~12.7.2' },
        'expo-status-bar': { version: '~1.11.1' },
        'react': { version: '18.2.0' },
        'react-native': { version: '0.73.6' }
      },
      sdkVersion: '53.0.0'
    });

    console.log('📱 Making Snack online...');
    snack.setOnline(true);

    console.log('💾 Saving complete Snack...');
    const result = await snack.saveAsync();

    console.log('\n🎉 SUCCESS! Your complete Pokemon Snack is ready:');
    console.log('┌─────────────────────────────────────────────┐');
    console.log('│                 🔥 SNACK READY! 🔥           │');
    console.log('├─────────────────────────────────────────────┤');
    console.log(`│ 📱 Snack URL: ${result.url.padEnd(20)} │`);
    console.log(`│ 🌐 Preview:   https://snack.expo.dev/${result.id} │`);
    console.log('├─────────────────────────────────────────────┤');
    console.log('│ ✨ Features included:                       │');
    console.log('│ • Complete Pokemon card swipe interface    │');
    console.log('│ • Holographic shimmer effects             │');
    console.log('│ • Blur and gradient backgrounds           │');
    console.log('│ • Haptic feedback (mobile only)           │');
    console.log('│ • Real Pokemon data from PokeAPI          │');
    console.log('│ • Trainer collection system               │');
    console.log('│ • Animated search suggestions             │');
    console.log('│ • TypeScript support                      │');
    console.log('└─────────────────────────────────────────────┘');
    console.log('\n📋 Share this URL to let others test your Pokemon app!');
    console.log('🎮 Scan QR code with Expo Go for mobile testing');

    return result;

  } catch (error) {
    console.error('❌ Failed to create Snack:', error);
    throw error;
  }
};

// Run the script
if (require.main === module) {
  createCompleteSnack().catch(console.error);
}

module.exports = { createCompleteSnack };