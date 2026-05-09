import { Check, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  assignedTo?: string;
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Plan weekend family outing', completed: false, assignedTo: 'Dad' },
    { id: '2', text: 'Buy groceries for family dinner', completed: false, assignedTo: 'Mom' },
    { id: '3', text: 'Book tickets for movie night', completed: true, assignedTo: 'Dad' }
  ]);
  const [newTask, setNewTask] = useState('');

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, {
        id: Date.now().toString(),
        text: newTask,
        completed: false
      }]);
      setNewTask('');
    }
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
          placeholder="Add a new task..."
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={addTask}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      <AnimatePresence>
        {tasks.map(task => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <button
              onClick={() => toggleTask(task.id)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
              }`}
            >
              {task.completed && <Check className="w-3 h-3 text-white" />}
            </button>
            <div className="flex-1">
              <p className={task.completed ? 'line-through opacity-50' : ''}>{task.text}</p>
              {task.assignedTo && (
                <p className="text-xs text-gray-500 mt-1">Assigned to: {task.assignedTo}</p>
              )}
            </div>
            <button
              onClick={() => deleteTask(task.id)}
              className="p-1 hover:bg-red-50 rounded text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
