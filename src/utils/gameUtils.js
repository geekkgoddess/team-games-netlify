// Game utilities

export const generateGameCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const formatCode = (code) => {
  if (!code) return '';
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
};

export const generatePlayerId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export const avatars = [
  '🎭', '🦸', '🧑‍🚀', '🐱', '🐹', '🦊', '🦖', '🐙', '🦉', '🐢',
  '🦄', '🧙', '🎪', '🚀', '⚡', '🎸', '🐺', '🦅', '🐉', '🧛'
];

export const guessTheCoworkerClues = [
  'Always early to meetings',
  'Camera always off',
  'Makes coffee for the team',
  'Speaks up in standups',
  'Always has snacks',
  'Works late most nights',
  'First to volunteer',
  'Great sense of humor',
  'Very organized',
  'Tells the best stories'
];
