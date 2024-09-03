import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Alert, AlertDescription } from './components/ui/alert';

const WhistGameLobby = () => {
  const [socket, setSocket] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  const [games, setGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [newGameName, setNewGameName] = useState('');

  useEffect(() => {
    if (isNameSet) {
      const newSocket = io(process.env.REACT_APP_BACKEND_URL, {
        query: { playerName }
      });
      setSocket(newSocket);

      newSocket.on('gameListUpdate', (updatedGames) => {
        setGames(updatedGames);
      });

      newSocket.on('gameCreated', (game) => {
        setCurrentGame(game);
      });

      newSocket.on('playerJoined', (game) => {
        setCurrentGame(game);
      });

      newSocket.on('gameReady', (game) => {
        setCurrentGame(game);
        // Here you would transition to the actual game component
        console.log('Game is ready to start!');
      });

      return () => newSocket.close();
    }
  }, [isNameSet, playerName]);

  const handleSetName = () => {
    if (playerName.trim() === '') {
      alert('Please enter a valid name');
      return;
    }
    setIsNameSet(true);
  };

  const handleCreateGame = () => {
    if (newGameName.trim() === '') {
      alert('Please enter a game name');
      return;
    }
    socket.emit('createGame', newGameName);
    setNewGameName('');
  };

  const handleJoinGame = (gameId) => {
    socket.emit('joinGame', gameId);
  };

  const renderLobby = () => (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Create New Game</CardTitle>
        </CardHeader>
        <CardContent>
          <Input 
            type="text" 
            placeholder="Game name" 
            value={newGameName} 
            onChange={(e) => setNewGameName(e.target.value)}
            className="mb-2"
          />
          <Button onClick={handleCreateGame}>Create Game</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Open Games</CardTitle>
        </CardHeader>
        <CardContent>
          {games.length === 0 ? (
            <p>No open games available. Why not create one?</p>
          ) : (
            <ul>
              {games.map((game) => (
                <li key={game.id} className="mb-2 p-2 border rounded">
                  {game.name} ({game.players.length}/{game.maxPlayers} players)
                  <Button 
                    onClick={() => handleJoinGame(game.id)} 
                    className="ml-2"
                    disabled={game.players.length === game.maxPlayers || game.players.some(p => p.name === playerName)}
                  >
                    {game.players.some(p => p.name === playerName) ? 'Joined' : 'Join'}
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
        <p>Players: {currentGame.players.map(p => p.name).join(', ')}</p>
        <p>{currentGame.players.length}/{currentGame.maxPlayers} players joined</p>
        {currentGame.players.length === currentGame.maxPlayers && (
          <p>Game is ready to start!</p>
        )}
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
        currentGame ? renderWaitingRoom() : renderLobby()
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