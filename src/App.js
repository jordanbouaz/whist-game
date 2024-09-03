import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Alert, AlertDescription } from './components/ui/alert';
import io from 'socket.io-client';

const WhistGameLobby = () => {
  const [playerName, setPlayerName] = React.useState('');
  const [isNameSet, setIsNameSet] = React.useState(false);
  const [openGames, setOpenGames] = React.useState([]);
  const [isCreatingGame, setIsCreatingGame] = React.useState(false);
  const [newGamePlayers, setNewGamePlayers] = React.useState(2);
  const [newGameName, setNewGameName] = React.useState('');
  const [currentGame, setCurrentGame] = React.useState(null);
  const [gameStarted, setGameStarted] = React.useState(false);
  const [gameNameError, setGameNameError] = React.useState('');

  const handleCreateGame = () => {
    if (newGameName.trim() === '') {
      setGameNameError('Game name is required');
      return;
    }
    setGameNameError('');
    const newGame = {
      id: Date.now(),
      name: newGameName,
      host: playerName,
      players: [playerName],
      maxPlayers: parseInt(newGamePlayers),
    };
    setOpenGames([...openGames, newGame]);
    setCurrentGame(newGame);
    setIsCreatingGame(false);
    setNewGameName('');
    setNewGamePlayers(2);
  };

  const handleJoinGame = (game) => {
    if (game.players.length < game.maxPlayers && !game.players.includes(playerName)) {
      const updatedGame = { ...game, players: [...game.players, playerName] };
      setOpenGames(openGames.map(g => g.id === game.id ? updatedGame : g));
      setCurrentGame(updatedGame);
    }
  };

  const handleSetName = () => {
    if (playerName.trim() === '') {
      alert('Please enter a valid name');
      return;
    }
    setIsNameSet(true);
    console.log(`Name set to ${playerName}`);
  };

  const handleStartGame = () => {
    if (currentGame && currentGame.players.length === currentGame.maxPlayers) {
      setGameStarted(true);
    } else {
      alert('Cannot start the game. Waiting for more players.');
    }
  };

  const handleLeaveGame = () => {
    setOpenGames(openGames.map(game => 
      game.id === currentGame.id 
        ? { ...game, players: game.players.filter(p => p !== playerName) }
        : game
    ));
    setCurrentGame(null);
  };

  useEffect(() => {
    const socket = const socket = io(process.env.REACT_APP_BACKEND_URL);
    socket.on('connect', () => {
      console.log('Connected to server');
    });
  
    return () => {
      socket.disconnect();
    };
  }, []);
  
  const renderLobby = () => (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Welcome, {playerName}</CardTitle>
        </CardHeader>
        <CardContent>
          {isCreatingGame ? (
            <div>
              <h3 className="text-lg font-semibold mb-2">Create New Game</h3>
              <Input 
                type="text" 
                placeholder="Game name" 
                value={newGameName} 
                onChange={(e) => {
                  setNewGameName(e.target.value);
                  if (e.target.value.trim() !== '') {
                    setGameNameError('');
                  }
                }}
                className={`mb-2 ${gameNameError ? 'border-red-500' : ''}`}
              />
              {gameNameError && (
                <Alert variant="destructive" className="mb-2">
                  <AlertDescription>{gameNameError}</AlertDescription>
                </Alert>
              )}
              <div className="flex items-center space-x-2 mb-2">
                <span>Number of players:</span>
                <Input 
                  type="number" 
                  min="2" 
                  max="6" 
                  value={newGamePlayers} 
                  onChange={(e) => setNewGamePlayers(e.target.value)}
                  className="w-16"
                />
              </div>
              <Button onClick={handleCreateGame}>Create Game</Button>
              <Button variant="secondary" onClick={() => {
                setIsCreatingGame(false);
                setGameNameError('');
              }} className="ml-2">
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsCreatingGame(true)}>Create New Game</Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Open Games</CardTitle>
        </CardHeader>
        <CardContent>
          {openGames.length === 0 ? (
            <p>No open games available. Why not create one?</p>
          ) : (
            <ul>
              {openGames.map((game) => (
                <li key={game.id} className="mb-2 p-2 border rounded">
                  {game.name} ({game.players.length}/{game.maxPlayers} players)
                  <Button 
                    onClick={() => handleJoinGame(game)} 
                    className="ml-2"
                    disabled={game.players.length === game.maxPlayers || game.players.includes(playerName)}
                  >
                    {game.players.includes(playerName) ? 'Joined' : 'Join'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );

  const renderWaitingRoom = () => (
    <Card>
      <CardHeader>
        <CardTitle>{currentGame.name} - Waiting Room</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Players: {currentGame.players.join(', ')}</p>
        <p>{currentGame.players.length}/{currentGame.maxPlayers} players joined</p>
        {currentGame.host === playerName && currentGame.players.length === currentGame.maxPlayers && (
          <Button onClick={handleStartGame} className="mt-2">Start Game</Button>
        )}
        <Button onClick={handleLeaveGame} variant="secondary" className="mt-2 ml-2">Leave Game</Button>
      </CardContent>
    </Card>
  );

  const renderGame = () => (
    <Card>
      <CardHeader>
        <CardTitle>{currentGame.name} - Game in Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Players: {currentGame.players.join(', ')}</p>
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Your Hand:</h3>
          {/* This is where you'd render the player's cards */}
          <p>Your cards would be shown here</p>
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Other Players:</h3>
          {currentGame.players.filter(p => p !== playerName).map(player => (
            <div key={player} className="mb-2">
              <p>{player}'s hand: [Hidden]</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Whist Game Lobby</h1>
      
      {!isNameSet ? (
        <Card>
          <CardHeader>
            <CardTitle>Enter Your Name</CardTitle>
          </CardHeader>
          <CardContent>
            <Input 
              type="text" 
              placeholder="Your name" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <Button className="mt-2" onClick={handleSetName}>
              Set Name
            </Button>
          </CardContent>
        </Card>
      ) : (
        gameStarted ? renderGame() : (currentGame ? renderWaitingRoom() : renderLobby())
      )}
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <WhistGameLobby />
    </div>
  );
}

export default App;
