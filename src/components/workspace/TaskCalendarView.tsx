import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Task } from '../../types';
import { useApp } from '../../context/AppContext';

interface TaskCalendarViewProps {
  tasks: Task[];
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({ tasks }) => {
  const { setSelectedTaskId, openCreateTask } = useApp();
  // Fixed on November 2026 for cohesive demo state
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(10); // 0-indexed: 10 is November

  const monthNames = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ];

  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Calculate days in month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  // getDay(): 0 is Sunday, convert to Monday-based (0 is Monday, 6 is Sunday)
  let startDay = firstDayOfMonth.getDay() - 1;
  if (startDay === -1) startDay = 6;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Generate calendar grid cells (42 cells: 6 rows of 7)
  const calendarCells = [];
  // Empty padding cells before start of month
  for (let i = 0; i < startDay; i++) {
    calendarCells.push(null);
  }
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const getTasksForDay = (day: number) => {
    const formattedDay = day < 10 ? `0${day}` : `${day}`;
    const formattedMonth = currentMonth + 1 < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    return tasks.filter((t) => t.dueDate === dateStr);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
      {/* Month Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full font-mono">
            {tasks.length} задач в расписании
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCurrentYear(2026);
              setCurrentMonth(10);
            }}
            className="px-3 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            Сегодня
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            aria-label="Следующий месяц"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px mb-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
        {daysOfWeek.map((day, idx) => (
          <div key={idx} className="py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarCells.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[100px] rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-transparent"
              />
            );
          }

          const dayTasks = getTasksForDay(day);
          const isToday = currentYear === 2026 && currentMonth === 10 && day === 4;

          return (
            <div
              key={`day-${day}`}
              className={`min-h-[110px] p-2 rounded-xl border flex flex-col justify-between transition-colors ${
                isToday
                  ? 'border-blue-500/80 bg-blue-50/30 dark:bg-blue-950/20 shadow-xs'
                  : 'border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-mono tabular-nums ${
                    isToday
                      ? 'w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center'
                      : 'text-slate-700 dark:text-slate-300 font-medium pl-1'
                  }`}
                >
                  {day}
                </span>

                <button
                  onClick={() => openCreateTask()}
                  className="opacity-0 hover:opacity-100 p-0.5 text-slate-400 hover:text-blue-600 rounded transition-opacity"
                  title="Создать задачу"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks chips in this day */}
              <div className="space-y-1 overflow-y-auto max-h-[70px]">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`text-[11px] p-1 rounded-md truncate font-medium cursor-pointer transition-colors ${
                      task.completed
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 line-through'
                        : task.priority === 'high'
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                        : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
                    }`}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
