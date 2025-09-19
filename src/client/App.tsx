import { useState } from 'react';
import { Landing } from './pages/Landing';
import { Game } from './pages/Game';

export const App = () => {
  const [route, setRoute] = useState<'landing' | 'game'>('landing');

  if (route === 'landing') {
    return <Landing onStartGame={() => setRoute('game')} />;
  }

  return <Game onBackHome={() => setRoute('landing')} />;
};
