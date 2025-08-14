import React, { useState, useEffect, useMemo } from 'react';
import type { Task } from '../types';

interface DiaryProps {
  entries: Record<string, string>;
  notes: string;
  tasks: Task[];
  onSaveEntry: (date: string, text: string) => void;
  onSaveNotes: (text: string) => void;
  onUpdateTasks: (tasks: Task[]) => void;
  onClose: () => void;
}

type ActiveTab = 'diary' | 'notes' | 'tasks';

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getReadableDate = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
}

// --- Sub-components for each tab ---

const DiarySection: React.FC<{entries: Record<string, string>, onSaveEntry: (d: string, t: string) => void}> = ({ entries, onSaveEntry }) => {
    const todayStr = useMemo(() => formatDate(new Date()), []);
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);
    const [currentText, setCurrentText] = useState<string>('');

    const sortedEntryDates = useMemo(() => {
        return Object.keys(entries)
        .filter(date => entries[date]?.trim() !== '')
        .sort((a, b) => b.localeCompare(a));
    }, [entries]);

    useEffect(() => {
        setCurrentText(entries[selectedDate] || '');
    }, [selectedDate, entries]);

    // Debounced save
    useEffect(() => {
        if (currentText !== (entries[selectedDate] || '')) {
        const handler = setTimeout(() => {
            onSaveEntry(selectedDate, currentText);
        }, 1000);

        return () => clearTimeout(handler);
        }
    }, [currentText, selectedDate, onSaveEntry, entries]);

    return (
        <div className="flex flex-col md:flex-row h-full">
            {/* Left Page - Entries List */}
            <div className="w-full md:w-1/3 h-1/3 md:h-full p-4 overflow-y-auto border-b-2 md:border-b-0 md:border-r-2 border-dashed border-amber-300">
                <h2 className="text-xl font-bold text-amber-800 mb-4 border-b border-amber-200 pb-2">As tuas memórias 💖</h2>
                <ul className="space-y-2">
                    <li>
                        <button onClick={() => setSelectedDate(todayStr)} className={`w-full text-left p-2 rounded-lg transition-colors ${selectedDate === todayStr ? 'bg-rose-200/80 font-bold' : 'hover:bg-amber-100'}`}>
                            📝 Hoje ({getReadableDate(todayStr)})
                        </button>
                    </li>
                    {sortedEntryDates.map(date => {
                    if (date === todayStr && (entries[date] || '').trim() === '') return null;
                    return (
                        <li key={date}>
                        <button onClick={() => setSelectedDate(date)} className={`w-full text-left p-2 rounded-lg transition-colors ${selectedDate === date ? 'bg-rose-200/80 font-bold' : 'hover:bg-amber-100'}`}>
                            {getReadableDate(date)}
                        </button>
                        </li>
                    );
                    })}
                    {sortedEntryDates.length === 0 && (!entries[todayStr] || entries[todayStr].trim() === '') && (
                        <p className="text-sm text-amber-600 mt-4 p-2">Ainda não tens nenhuma entrada. Começa a escrever sobre o teu dia de hoje!</p>
                    )}
                </ul>
            </div>
            {/* Right Page - Editor */}
            <div className="w-full md:w-2/3 h-2/3 md:h-full p-4 flex flex-col">
                <h3 className="text-2xl font-bold text-rose-500 mb-4">{getReadableDate(selectedDate)}</h3>
                <textarea
                    value={currentText}
                    onChange={(e) => setCurrentText(e.target.value)}
                    placeholder="Querido diário..."
                    className="w-full h-full bg-transparent resize-none focus:outline-none text-gray-700 leading-relaxed text-lg"
                    aria-label="Entrada do diário"
                ></textarea>
            </div>
        </div>
    );
};

const NotesSection: React.FC<{notes: string, onSaveNotes: (t: string) => void}> = ({ notes, onSaveNotes }) => {
    const [currentText, setCurrentText] = useState(notes);
    
    // Debounced save for notes
    useEffect(() => {
        if(currentText !== notes) {
            const handler = setTimeout(() => {
                onSaveNotes(currentText);
            }, 1000);
            return () => clearTimeout(handler);
        }
    }, [currentText, notes, onSaveNotes]);

    return (
        <div className="p-4 flex flex-col h-full">
            <textarea
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                placeholder="As tuas anotações, ideias e pensamentos vivem aqui..."
                className="w-full h-full bg-amber-50/50 resize-none focus:outline-none text-gray-700 leading-relaxed text-lg p-4 rounded-lg border border-amber-200"
                aria-label="Anotações"
            ></textarea>
        </div>
    );
};

const TasksSection: React.FC<{tasks: Task[], onUpdateTasks: (t: Task[]) => void}> = ({ tasks, onUpdateTasks }) => {
    const [newTaskText, setNewTaskText] = useState('');

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskText.trim()) {
            const newTask: Task = {
                id: Date.now().toString(),
                text: newTaskText.trim(),
                completed: false,
            };
            onUpdateTasks([...tasks, newTask]);
            setNewTaskText('');
        }
    };

    const handleToggleTask = (taskId: string) => {
        const updatedTasks = tasks.map(task => 
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        onUpdateTasks(updatedTasks);
    };

    const handleDeleteTask = (taskId: string) => {
        onUpdateTasks(tasks.filter(task => task.id !== taskId));
    };

    const completedCount = useMemo(() => tasks.filter(t => t.completed).length, [tasks]);

    return (
        <div className="p-4 flex flex-col h-full">
            <form onSubmit={handleAddTask} className="flex items-center gap-2 mb-4">
                <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Adicionar uma nova tarefa..."
                    className="flex-grow px-4 py-2 border border-amber-300 rounded-full focus:ring-2 focus:ring-rose-400 focus:outline-none transition"
                />
                <button type="submit" className="bg-rose-500 text-white rounded-full p-2 hover:bg-rose-600 transition-transform transform hover:scale-110 active:scale-95 disabled:bg-rose-300" disabled={!newTaskText.trim()}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"></line><line x1="5" x2="19" y1="12" y2="12"></line></svg>
                </button>
            </form>
            <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                {tasks.length > 0 ? tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 bg-white/70 p-3 rounded-lg shadow-sm transition-all hover:shadow-md">
                       <input 
                         type="checkbox"
                         checked={task.completed}
                         onChange={() => handleToggleTask(task.id)}
                         className="w-5 h-5 rounded text-rose-500 focus:ring-rose-400 border-gray-300"
                       />
                       <span className={`flex-grow text-gray-700 transition-colors ${task.completed ? 'line-through text-gray-400' : ''}`}>
                         {task.text}
                       </span>
                       <button onClick={() => handleDeleteTask(task.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                       </button>
                    </div>
                )) : (
                    <p className="text-center text-amber-700 pt-10">A tua lista de tarefas está vazia. Adiciona algo para começar! ✨</p>
                )}
            </div>
            {tasks.length > 0 && <div className="mt-4 text-sm text-center text-amber-800">
                {completedCount} de {tasks.length} tarefas concluídas. {completedCount === tasks.length && tasks.length > 0 ? "Bom trabalho! 🎉" : ""}
            </div>}
        </div>
    );
};

// --- Main Diary Component ---

const Diary: React.FC<DiaryProps> = ({ entries, notes, tasks, onSaveEntry, onSaveNotes, onUpdateTasks, onClose }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('diary');

    const TabButton: React.FC<{tab: ActiveTab, label: string, emoji: string}> = ({ tab, label, emoji }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm md:text-base font-bold transition-colors border-b-4 ${activeTab === tab ? 'text-rose-600 border-rose-500' : 'text-amber-700/80 border-transparent hover:bg-amber-100/50'}`}
            role="tab"
            aria-selected={activeTab === tab}
        >
            <span className="text-xl">{emoji}</span> {label}
        </button>
    );

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-5xl h-[95vh] max-h-[800px] bg-amber-50 rounded-2xl shadow-2xl flex flex-col font-sans">
        <button onClick={onClose} className="absolute top-3 right-3 text-amber-700/70 hover:text-amber-900 transition-colors z-20" aria-label="Fechar diário">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        
        {/* Tabs Navigation */}
        <div className="flex border-b border-amber-200" role="tablist">
            <TabButton tab="diary" label="Diário" emoji="📖" />
            <TabButton tab="notes" label="Anotações" emoji="📝" />
            <TabButton tab="tasks" label="Tarefas" emoji="✅" />
        </div>
        
        {/* Content Area */}
        <div className="flex-grow overflow-hidden">
            {activeTab === 'diary' && <DiarySection entries={entries} onSaveEntry={onSaveEntry} />}
            {activeTab === 'notes' && <NotesSection notes={notes} onSaveNotes={onSaveNotes} />}
            {activeTab === 'tasks' && <TasksSection tasks={tasks} onUpdateTasks={onUpdateTasks} />}
        </div>
      </div>
    </div>
  );
};

export default Diary;