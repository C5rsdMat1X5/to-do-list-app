const { useState, useRef, useEffect } = React;

function TaskList({ tasks, completedTasks, onToggleComplete }) {
  return (
    <div className="task-list" role="list" aria-label="Task list">
      {tasks.map((task, idx) => (
        <label
          key={idx}
          className={`task-item${completedTasks.includes(task) ? ' completed' : ''}`}
        >
          <input
            type="checkbox"
            checked={completedTasks.includes(task)}
            onChange={() => onToggleComplete(task)}
            className="task-checkbox"
            aria-checked={completedTasks.includes(task)}
          />
          <span className="task-text">{task}</span>
        </label>
      ))}
    </div>
  );
}

function TaskBoard({
  lists,
  onDropTask,
  onDragOver,
  onRemoveList,
  onUpdateTitle,
  completedTasks,
  onToggleComplete,
  dragOverListId,
  onDragLeave
}) {
  return (
    <>
      {lists.map((list) => (
        <div
          key={list.id}
          className={`box-container${dragOverListId === list.id ? ' drag-over' : ''}`}
          onDragOver={(e) => onDragOver(e, list.id)}
          onDrop={(e) => onDropTask(e, list.id)}
          onDragLeave={onDragLeave}
        >
          <TaskBox
            id={list.id}
            title={list.title}
            tasks={list.tasks}
            onRemoveList={onRemoveList}
            onUpdateTitle={onUpdateTitle}
            completedTasks={completedTasks}
            onToggleComplete={onToggleComplete}
          />
        </div>
      ))}
    </>
  );
}

function TaskBox({
  id,
  title,
  tasks,
  onRemoveList,
  onUpdateTitle,
  completedTasks,
  onToggleComplete
}) {
  const [position, setPosition] = useState({ x: 350, y: 300 });
  const boxRef = useRef(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (boxRef.current) {
      //boxRef.current.style.transition = 'left 0.3s ease, top 0.3s ease';
    }
  }, []);

  function startDrag(e) {
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'BUTTON' ||
      e.target.closest('input') ||
      e.target.closest('button')
    )
      return;

    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;

    isDragging.current = true;
    dragOffset.current = {
      x: clientX - position.x,
      y: clientY - position.y
    };

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100vw';

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
  }

  function onDrag(e) {
    if (!isDragging.current) return;

    e.preventDefault();

    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;

    setPosition({
      x: Math.max(10, clientX - dragOffset.current.x),
      y: Math.max(10, clientY - dragOffset.current.y)
    });
  }

  function endDrag() {
    isDragging.current = false;
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';

    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', endDrag);
  }

  return (
    <div
      ref={boxRef}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
      className="floating-box"
      style={{ left: position.x, top: position.y, position: 'absolute' }}
      aria-label={`Task list: ${title}`}
      role="region"
    >
      <div className="floating-box-header">
        <input
          className="floating-box-title"
          placeholder="List name"
          type="text"
          value={title}
          onChange={(e) => onUpdateTitle(id, e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Edit list title"
        />
        <button
          onClick={() => onRemoveList(id)}
          className="floating-box-remove"
          title="Delete list"
          aria-label="Delete list"
        >
          ❌
        </button>
      </div>
      <TaskList
        tasks={tasks}
        completedTasks={completedTasks}
        onToggleComplete={onToggleComplete}
      />
    </div>
  );
}

function DraggableInput({ value, onChange, lists, sendTaskToList }) {
  const isDragging = React.useRef(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);

  React.useEffect(() => {
    function checkMobile() {
      setIsMobile(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth <= 768
      );
    }
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleInput = (e) => onChange(e.target.value);

  const clearInput = (e) => {
    e.stopPropagation();
    onChange('');
    setShowMenu(false);
  };

  const handleDragStart = (e) => {
    if (isMobile || !value.trim()) {
      e.preventDefault();
      return;
    }

    isDragging.current = true;
    const taskText = value.trim();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `bold 16px Segoe UI`;
    const width = Math.min(ctx.measureText(taskText).width + 30, 200);

    canvas.width = width;
    canvas.height = 34;

    // Fondo degradado
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#5c4033cc');
    gradient.addColorStop(1, '#d4b8a8cc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Texto blanco con sombra suave
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 3;
    ctx.fillText(taskText, 15, 24);

    if (e.dataTransfer) {
      e.dataTransfer.setDragImage(canvas, width / 2, canvas.height / 2);
      e.dataTransfer.setData('text/plain', taskText);
    }
  };

  const handleTouchEnd = () => {
    setTimeout(() => {
      if (value.trim()) setShowMenu(true);
    }, 300);
  };

  const handleSend = (task, listId) => {
    sendTaskToList(task, listId);
    onChange('');
    setShowMenu(false);
  };

  React.useEffect(() => {
    const stopDrag = () => (isDragging.current = false);
    document.addEventListener('dragend', stopDrag);
    document.addEventListener('touchend', stopDrag);
    return () => {
      document.removeEventListener('dragend', stopDrag);
      document.removeEventListener('touchend', stopDrag);
    };
  }, []);

  return (
    <div className="task-input-box" style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder="Write a task"
        value={value}
        onChange={handleInput}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
        aria-label="New task input"
      />
      {value && (
        <>
          <button
            onClick={clearInput}
            className="input-clear-button"
            title="Clear input"
            aria-label="Clear task input"
          >
            ❌
          </button>
          {isMobile ? (
            <button
              onClick={() => setShowMenu(true)}
              className="mobile-send-trigger"
              title="Send task"
              aria-haspopup="true"
              aria-expanded={showMenu}
            >
              📤
            </button>
          ) : (
            <span
              className="drag-hint"
              draggable
              onDragStart={handleDragStart}
              title="Drag to add a task"
            >
              🟦 Drag me
            </span>
          )}
        </>
      )}

      {showMenu && (
        <div className="send-menu" role="menu" aria-label="Send task to list menu">
          {lists.length === 0 && (
            <div className="send-menu-empty">No lists available</div>
          )}
          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => handleSend(value, list.id)}
              role="menuitem"
              className="send-menu-button"
              title={`Send to ${list.title}`}
            >
              Enviar a: {list.title}
            </button>
          ))}
          <button
            onClick={() => setShowMenu(false)}
            className="send-menu-cancel"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

function Main() {
  const [taskText, setTaskText] = useState('');
  const [taskLists, setTaskLists] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [dragOverListId, setDragOverListId] = useState(null);

  function addList() {
    const id = Math.random().toString(36).slice(2, 8);
    setTaskLists((prev) => [...prev, { id, title: 'New List', tasks: [] }]);
  }

  function sendTaskToList(task, listId) {
    const cleanTask = task.trim();
    if (cleanTask === '') return;

    setTaskLists((prev) =>
      prev.map((list) =>
        list.id === listId && !list.tasks.includes(cleanTask)
          ? { ...list, tasks: [...list.tasks, cleanTask] }
          : list
      )
    );
  }

  function removeList(id) {
    setTaskLists((prev) => prev.filter((list) => list.id !== id));
    setCompletedTasks((prev) =>
      prev.filter(
        (task) => !taskLists.find((list) => list.id === id && list.tasks.includes(task))
      )
    );
  }

  function dropTask(e, listId) {
    e.preventDefault();
    const task = e.dataTransfer.getData('text/plain');
    if (task.trim() === '') return;

    sendTaskToList(task, listId);
    setDragOverListId(null);
  }

  function allowDrop(e, listId) {
    e.preventDefault();
    setDragOverListId(listId);
  }

  function onDragLeave() {
    setDragOverListId(null);
  }

  function updateListTitle(id, newTitle) {
    setTaskLists((prev) =>
      prev.map((list) => (list.id === id ? { ...list, title: newTitle } : list))
    );
  }

  function toggleCompleteTask(task) {
    setCompletedTasks((prev) =>
      prev.includes(task) ? prev.filter((t) => t !== task) : [...prev, task]
    );
  }

  return (
    <div className="app-container">
      <h1>📝 To-do List App</h1>
      <h2>Drag tasks into floating lists</h2>

      <button onClick={addList} className="add-list-button" aria-label="Add new list">
        ➕ Add new list
      </button>

      <div className="top-bar">
        <DraggableInput
          value={taskText}
          onChange={setTaskText}
          sendTaskToList={sendTaskToList}
          lists={taskLists}
        />
      </div>

      <TaskBoard
        lists={taskLists}
        onDropTask={dropTask}
        onDragOver={allowDrop}
        onRemoveList={removeList}
        onUpdateTitle={updateListTitle}
        completedTasks={completedTasks}
        onToggleComplete={toggleCompleteTask}
        dragOverListId={dragOverListId}
        onDragLeave={onDragLeave}
      />
    </div>
  );
}

ReactDOM.render(<Main />, document.getElementById('root'));