/**
 * Script to seed 30 random German dishes into the database
 * Usage: npx tsx scripts/seed-dishes.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

// Supabase configuration
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

/**
 * Prompt user for input
 */
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Prompt for password (hidden input)
 */
function promptPassword(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    // Mute output for password
    const stdin = process.stdin as any;
    stdin.setRawMode?.(true);

    let password = '';
    process.stdout.write(question);

    stdin.on('data', (char: Buffer) => {
      const c = char.toString('utf8');

      switch (c) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl-D
          stdin.setRawMode?.(false);
          rl.close();
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl-C
          process.exit();
          break;
        case '\u007f': // Backspace
        case '\b':
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += c;
          process.stdout.write('*');
          break;
      }
    });
  });
}

type DishCategory = 'Fisch' | 'Fleisch' | 'Vegetarisch';

interface DishSeed {
  name: string;
  category: DishCategory;
}

// 30 German dishes with balanced categories
const DISHES: DishSeed[] = [
  // Fisch (10)
  { name: 'Lachsfilet mit Dillsauce', category: 'Fisch' },
  { name: 'Fischstäbchen mit Kartoffelpüree', category: 'Fisch' },
  { name: 'Forelle Müllerin Art', category: 'Fisch' },
  { name: 'Kabeljau mit Senfsauce', category: 'Fisch' },
  { name: 'Thunfisch-Pasta', category: 'Fisch' },
  { name: 'Backfisch mit Remoulade', category: 'Fisch' },
  { name: 'Seelachsfilet gebraten', category: 'Fisch' },
  { name: 'Garnelen-Risotto', category: 'Fisch' },
  { name: 'Matjes mit Bratkartoffeln', category: 'Fisch' },
  { name: 'Fischsuppe', category: 'Fisch' },

  // Fleisch (10)
  { name: 'Schnitzel mit Pommes', category: 'Fleisch' },
  { name: 'Spaghetti Bolognese', category: 'Fleisch' },
  { name: 'Hähnchenbrust mit Reis', category: 'Fleisch' },
  { name: 'Gulasch mit Spätzle', category: 'Fleisch' },
  { name: 'Bratwurst mit Sauerkraut', category: 'Fleisch' },
  { name: 'Rinderbraten mit Knödeln', category: 'Fleisch' },
  { name: 'Currywurst mit Pommes', category: 'Fleisch' },
  { name: 'Hackbraten mit Kartoffeln', category: 'Fleisch' },
  { name: 'Schweinemedaillons', category: 'Fleisch' },
  { name: 'Lasagne', category: 'Fleisch' },

  // Vegetarisch (10)
  { name: 'Käsespätzle', category: 'Vegetarisch' },
  { name: 'Gemüsepfanne mit Reis', category: 'Vegetarisch' },
  { name: 'Kartoffelsuppe', category: 'Vegetarisch' },
  { name: 'Spinat-Ricotta-Ravioli', category: 'Vegetarisch' },
  { name: 'Gemüselasagne', category: 'Vegetarisch' },
  { name: 'Bratkartoffeln mit Spiegelei', category: 'Vegetarisch' },
  { name: 'Tomatensuppe mit Brot', category: 'Vegetarisch' },
  { name: 'Gemüsecurry', category: 'Vegetarisch' },
  { name: 'Reibekuchen mit Apfelmus', category: 'Vegetarisch' },
  { name: 'Pilzrisotto', category: 'Vegetarisch' },
];

async function seedDishes() {
  console.log('🌱 Seed 30 German Dishes to Supabase\n');

  // Get credentials interactively
  const email = await prompt('Email: ');
  const password = await promptPassword('Password: ');

  if (!email || !password) {
    console.error('\n❌ Email and password are required');
    process.exit(1);
  }

  console.log('\n🔌 Connecting to Supabase...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  // Sign in
  console.log(`🔐 Signing in as ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    console.error('❌ Authentication failed:', authError?.message);
    process.exit(1);
  }

  console.log(`✅ Signed in as ${authData.user.email}`);
  console.log(`👤 User ID: ${authData.user.id}`);

  // Insert dishes
  console.log(`\n📝 Inserting ${DISHES.length} dishes...`);

  const dishesWithUserId = DISHES.map(dish => ({
    user_id: authData.user.id,
    name: dish.name,
    category: dish.category,
    is_favorite: false,
  }));

  const { data, error } = await supabase
    .from('dishes')
    .insert(dishesWithUserId)
    .select();

  if (error) {
    console.error('❌ Error inserting dishes:', error.message);
    process.exit(1);
  }

  console.log(`✅ Successfully inserted ${data?.length || 0} dishes!`);

  // Show summary
  const summary = DISHES.reduce((acc, dish) => {
    acc[dish.category] = (acc[dish.category] || 0) + 1;
    return acc;
  }, {} as Record<DishCategory, number>);

  console.log('\n📊 Summary:');
  console.log(`   Fisch: ${summary.Fisch}`);
  console.log(`   Fleisch: ${summary.Fleisch}`);
  console.log(`   Vegetarisch: ${summary.Vegetarisch}`);
  console.log(`   Total: ${DISHES.length}`);

  // Sign out
  await supabase.auth.signOut();
  console.log('\n👋 Done!');
}

seedDishes().catch(console.error);

