"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Puzzle, Brain, X, Circle, RotateCcw } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"
import { Button } from "@/components/ui/button"

function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null))
  const [xIsNext, setXIsNext] = useState(true)

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  }

  const handleClick = (i: number) => {
    if (board[i] || calculateWinner(board)) return;
    const newBoard = [...board]
    newBoard[i] = xIsNext ? "X" : "O"
    setBoard(newBoard)
    setXIsNext(!xIsNext)
  }

  const winner = calculateWinner(board)
  const isDraw = !winner && board.every(Boolean)

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <div className="text-2xl font-bold bg-muted/50 px-6 py-2 rounded-full text-indigo-600 dark:text-indigo-400">
        {winner ? `Winner: ${winner}` : isDraw ? "Draw!" : `Next Player: ${xIsNext ? "X" : "O"}`}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className="w-24 h-24 bg-card border-2 border-indigo-500/20 shadow-sm rounded-2xl flex items-center justify-center hover:bg-indigo-500/10 transition-all hover:scale-105"
          >
            {cell === "X" && <X className="h-12 w-12 text-teal-500" />}
            {cell === "O" && <Circle className="h-10 w-10 text-orange-500" />}
          </button>
        ))}
      </div>
      <Button onClick={() => { setBoard(Array(9).fill(null)); setXIsNext(true); }} variant="outline" className="mt-4 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-800 dark:hover:bg-indigo-950">
        <RotateCcw className="h-4 w-4 mr-2" /> Restart Game
      </Button>
    </div>
  )
}

const INITIAL_SUDOKU = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9]
]

function Sudoku() {
  const [grid, setGrid] = useState(INITIAL_SUDOKU.map(row => [...row]))
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null)

  const handleCellClick = (r: number, c: number) => {
    if (INITIAL_SUDOKU[r][c] !== 0) return; // Cannot edit initial numbers
    setSelectedCell({ r, c })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell) return;
    const num = parseInt(e.key);
    if (!isNaN(num) && num >= 1 && num <= 9) {
      const newGrid = [...grid];
      newGrid[selectedCell.r][selectedCell.c] = num;
      setGrid(newGrid);
    } else if (e.key === "Backspace" || e.key === "Delete") {
      const newGrid = [...grid];
      newGrid[selectedCell.r][selectedCell.c] = 0;
      setGrid(newGrid);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 p-8" onKeyDown={handleKeyDown} tabIndex={0}>
      <p className="text-sm text-indigo-600/80 dark:text-indigo-400/80 font-medium text-center bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-lg">
        Click an empty cell and type a number (1-9). Press Backspace to clear.
      </p>
      <div className="grid grid-cols-9 border-2 border-indigo-800/40 rounded-sm overflow-hidden shadow-lg focus:outline-none bg-card">
        {grid.map((row, r) => (
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              onClick={() => handleCellClick(r, c)}
              className={`w-9 h-9 md:w-12 md:h-12 flex items-center justify-center text-lg md:text-xl font-bold border border-indigo-200/50 dark:border-indigo-800/50 transition-colors
                ${INITIAL_SUDOKU[r][c] !== 0 ? 'bg-indigo-50/50 dark:bg-indigo-950/30 text-foreground' : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/30 cursor-pointer'}
                ${selectedCell?.r === r && selectedCell?.c === c ? 'bg-indigo-200 dark:bg-indigo-800 ring-2 ring-indigo-500 z-10' : ''}
                ${c % 3 === 2 && c !== 8 ? 'border-r-2 border-r-indigo-800/40' : ''}
                ${r % 3 === 2 && r !== 8 ? 'border-b-2 border-b-indigo-800/40' : ''}
              `}
            >
              {cell !== 0 ? cell : ""}
            </div>
          ))
        ))}
      </div>
      <Button onClick={() => { setGrid(INITIAL_SUDOKU.map(row => [...row])); setSelectedCell(null); }} variant="outline" className="border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-800 dark:hover:bg-indigo-950">
        <RotateCcw className="h-4 w-4 mr-2" /> Reset Sudoku
      </Button>
    </div>
  )
}

export default function GamesPage() {
  const { t } = useLanguage()
  const [activeGame, setActiveGame] = useState("Sudoku")

  return (
    <div className="flex flex-col flex-1 items-center bg-background/50 py-12 px-4 relative min-h-[calc(100vh-4rem)]">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] -z-10" />

      <main className="w-full max-w-4xl space-y-12">
        <section className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-teal-500">
              {t({ EN: "Brain Games", HI: "दिमागी खेल", TE: "మెదడు ఆటలు" })}
             </span>
          </h1>
          <p className="max-w-xl mx-auto text-lg text-muted-foreground font-medium">
            {t({ EN: "Exercise your mind with our collection of interactive puzzles and games.", HI: "हमारे पहेलियों के साथ अपने दिमाग का व्यायाम करें।", TE: "ఆటలు ఆడుతూ మీ మెదడుకు పని చెప్పండి." })}
          </p>
        </section>

        <div className="flex justify-center gap-4 bg-card/60 border border-border/50 p-2 rounded-2xl mx-auto max-w-md shadow-sm backdrop-blur-md">
          <button 
            onClick={() => setActiveGame("Sudoku")}
            className={`flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${activeGame === "Sudoku" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            <Brain className="h-5 w-5" /> Sudoku
          </button>
          <button 
            onClick={() => setActiveGame("TicTacToe")}
            className={`flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${activeGame === "TicTacToe" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            <Puzzle className="h-5 w-5" /> Tic Tac Toe
          </button>
        </div>

        <motion.div 
          key={activeGame}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
          className="bg-card/80 backdrop-blur-md border border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden max-w-2xl mx-auto"
        >
          {activeGame === "Sudoku" && <Sudoku />}
          {activeGame === "TicTacToe" && <TicTacToe />}
        </motion.div>

      </main>
    </div>
  )
}
