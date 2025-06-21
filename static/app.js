const { useState, useRef } = React;

function TaskList({ tasks }) {
  return (
    <div className="task-list">
      {tasks.map((task, idx) => (
        <label key={idx} className="task-item">
          <input type="checkbox" className="task-checkbox" />
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
  onUpdateTitle
}) {
  return (
    <>
      {lists.map((list) => (
        <div key={list.id} className="box-container">
          <TaskBox
            id={list.id}
            title={list.title}
            tasks={list.tasks}
            onDrop={(e) => onDropTask(e, list.id)}
            onDragOver={onDragOver}
            onRemoveList={onRemoveList}
            onUpdateTitle={onUpdateTitle}
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
  onDrop,
  onDragOver,
  onRemoveList,
  onUpdateTitle
}) {
  const [position, setPosition] = useState({ x: 350, y: 300 });
  const boxRef = useRef(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  function startDrag(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;

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
      x: clientX - dragOffset.current.x,
      y: clientY - dragOffset.current.y
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
      onDrop={onDrop}
      onDragOver={onDragOver}
      className="floating-box"
      style={{ left: position.x, top: position.y, position: 'absolute' }}
    >
      <div className="floating-box-header">
        <input
          className="floating-box-title"
          placeholder="List name"
          type="text"
          value={title}
          onChange={(e) => onUpdateTitle(id, e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
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
      <TaskList tasks={tasks} />
    </div>
  );
}

function DraggableInput({ value, onChange, lists, sendTaskToList }) {
  const isDragging = React.useRef(false);
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const [showMenu, setShowMenu] = React.useState(false);

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
    const width = ctx.measureText(taskText).width;

    canvas.width = width + 20;
    canvas.height = 32;

    ctx.fillStyle = '#ffffffee';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0077cc';
    ctx.fillText(taskText, 10, 24);

    if (e.dataTransfer) {
      e.dataTransfer.setDragImage(canvas, canvas.width / 2, canvas.height / 2);
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
      />
      {value && (
        <>
          <button
            onClick={clearInput}
            style={{
              border: '0',
              background: 'transparent',
              marginLeft: '4px',
              fontSize: '1.2em'
            }}
            title="Limpiar"
          >
            ❌
          </button>
          {isMobile ? (
            <button
              onClick={() => setShowMenu(true)}
              className="mobile-send-trigger"
              style={{
                border: '0',
                background: 'transparent',
                marginLeft: '4px',
                fontSize: '1.3em'
              }}
              title="Enviar tarea"
            >
              📤
            </button>
          ) : (
            <span
              className="drag-hint"
              draggable
              onDragStart={handleDragStart}
              style={{ cursor: 'grab', marginLeft: '8px' }}
              title="Drag to add a task"
            >
              🟦 Drag me
            </span>
          )}
        </>
      )}

      {showMenu && (
        <div
          className="send-menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginTop: '4px',
            padding: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 10,
            maxWidth: '200px'
          }}
        >
          {lists.length === 0 && (
            <div style={{ padding: '4px' }}>No lists avalibles</div>
          )}
          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => handleSend(value, list.id)}
              style={{
                display: 'block',
                width: '100%',
                padding: '6px 8px',
                border: 'none',
                background: '#0077cc',
                color: 'white',
                marginBottom: '4px',
                borderRadius: '3px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              title={`Enviar a ${list.title}`}
            >
              Enviar a: {list.title}
            </button>
          ))}
          <button
            onClick={() => setShowMenu(false)}
            style={{
              display: 'block',
              width: '100%',
              padding: '6px 8px',
              border: 'none',
              background: '#ccc',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function Main() {
  const [taskText, setTaskText] = useState('');
  const [taskLists, setTaskLists] = useState([]);

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
  }

  function dropTask(e, listId) {
    e.preventDefault();
    const task = e.dataTransfer.getData('text/plain');
    if (task.trim() === '') return;

    setTaskLists((prev) =>
      prev.map((list) =>
        list.id === listId && !list.tasks.includes(task)
          ? { ...list, tasks: [...list.tasks, task] }
          : list
      )
    );
  }

  function allowDrop(e) {
    e.preventDefault();
  }

  function updateListTitle(id, newTitle) {
    setTaskLists((prev) =>
      prev.map((list) => (list.id === id ? { ...list, title: newTitle } : list))
    );
  }

  return (
    <div
      className="app-container"
      style={{
        padding: '20px',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
      }}
    >
      <h1>📝 To-do List App</h1>
      <h2>Drag tasks into floating lists</h2>

      <button
        onClick={addList}
        className="add-list-button"
        style={{ marginBottom: '12px', padding: '8px 12px', fontSize: '1rem' }}
      >
        ➕ Add new list
      </button>

      <div className="top-bar" style={{ marginBottom: '20px' }}>
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
      />
    </div>
  );
}

ReactDOM.render(<Main />, document.getElementById('root'));