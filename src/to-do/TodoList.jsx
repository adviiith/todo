"use client"

import { useState, useEffect } from "react"
import "./TodoList.css"

const TodoListApp = () => {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem("tasks")
    return savedTasks ? JSON.parse(savedTasks) : []
  })
  const [newTask, setNewTask] = useState("")
  const [filter, setFilter] = useState("all")
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode")
    return savedMode ? JSON.parse(savedMode) : false
  })
  const [priority, setPriority] = useState("medium")
  const [editTask, setEditTask] = useState(null)
  const [editText, setEditText] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [categories, setCategories] = useState(["Scaler", "Personal", "Freelancing", "Verdict.ai"])
  const [selectedCategory, setSelectedCategory] = useState("Personal")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [view, setView] = useState("list")
  const [showSidebar, setShowSidebar] = useState(true)

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode))
    document.body.className = darkMode ? "dark-mode" : "light-mode"
  }, [darkMode])

  const handleAddTask = (e) => {
    e.preventDefault()
    if (newTask.trim() === "") return

    const task = {
      id: Date.now(),
      text: newTask,
      completed: false,
      ongoing: false,
      priority: priority,
      createdAt: new Date().toISOString(),
      dueDate: dueDate || null,
      category: selectedCategory,
    }

    setTasks([...tasks, task])
    setNewTask("")
    setDueDate("")
  }

  const toggleComplete = (id) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const startEditTask = (task) => {
    setEditTask(task.id)
    setEditText(task.text)
    setDueDate(task.dueDate || "")
    setPriority(task.priority)
    setSelectedCategory(task.category)
  }

  const saveEditTask = () => {
    if (editText.trim() === "") return

    setTasks(
      tasks.map((task) =>
        task.id === editTask
          ? {
              ...task,
              text: editText,
              dueDate: dueDate || task.dueDate,
              priority: priority,
              category: selectedCategory,
              ongoing: task.ongoing, // Preserving ongoing state
            }
          : task,
      ),
    )
    setEditTask(null)
  }

  const addCategory = (categoryName) => {
    if (categoryName && !categories.includes(categoryName)) {
      setCategories([...categories, categoryName])
    }
  }

  const filterTasksByCategory = (category) => {
    return filteredAndSearchedTasks.filter((task) => task.category === category)
  }

  const getUpcomingTasks = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return tasks.filter((task) => {
      if (!task.dueDate || task.completed) return false
      const dueDate = new Date(task.dueDate)
      const diffTime = dueDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && diffDays <= 3
    })
  }

  const getOverdueTasks = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return tasks.filter((task) => {
      if (!task.dueDate || task.completed) return false
      const dueDate = new Date(task.dueDate)
      return dueDate < today
    })
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.completed
    if (filter === "active") return !task.completed
    if (filter === "high-priority") return task.priority === "high"
    if (filter === "upcoming") return getUpcomingTasks().includes(task)
    if (filter === "overdue") return getOverdueTasks().includes(task)
    return true
  })

  const filteredAndSearchedTasks = filteredTasks.filter(
    (task) =>
      task.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const completedCount = tasks.filter((task) => task.completed).length
  const completionPercentage = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0

  const getTasksByPriority = (priority) => {
    return tasks.filter((task) => task.priority === priority)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const isOverdue = (dateString) => {
    if (!dateString) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDate = new Date(dateString)
    return dueDate < today
  }

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar)
  }

  const toggleOngoing = (id) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, ongoing: !task.ongoing } : task)))
  }

  return (
    <div className={`app-container ${darkMode ? "dark" : "light"}`}>
      <nav className="navbar">
        <div className="nav-left">
          <button className="menu-toggle" onClick={toggleSidebar}>
            ☰
          </button>
          <h1 className="app-title">TodoList</h1>
        </div>
        <div className="nav-center">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="nav-right">
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          <div className="mobile-menu-button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <span>•••</span>
          </div>
          <div className={`mobile-menu ${isMobileMenuOpen ? "open" : ""}`}>
            <button
              onClick={() => {
                setFilter("all")
                setIsMobileMenuOpen(false)
              }}
            >
              All Tasks
            </button>
            <button
              onClick={() => {
                setFilter("active")
                setIsMobileMenuOpen(false)
              }}
            >
              Active
            </button>
            <button
              onClick={() => {
                setFilter("completed")
                setIsMobileMenuOpen(false)
              }}
            >
              Completed
            </button>
            <button
              onClick={() => {
                setFilter("high-priority")
                setIsMobileMenuOpen(false)
              }}
            >
              High Priority
            </button>
            <button
              onClick={() => {
                setView("analytics")
                setIsMobileMenuOpen(false)
              }}
            >
              Analytics
            </button>
          </div>
        </div>
      </nav>

      <div className="main-content">
        {showSidebar && (
          <aside className="sidebar">
            <div className="sidebar-header">
              <h2>Views</h2>
            </div>
            <ul className="sidebar-menu">
              <li
                className={view === "list" && filter === "all" ? "active" : ""}
                onClick={() => {
                  setView("list")
                  setFilter("all")
                }}
              >
                <span className="menu-icon">📋</span> All Tasks
              </li>
              <li
                className={filter === "active" ? "active" : ""}
                onClick={() => {
                  setView("list")
                  setFilter("active")
                }}
              >
                <span className="menu-icon">🔄</span> In Progress
              </li>
              <li
                className={filter === "completed" ? "active" : ""}
                onClick={() => {
                  setView("list")
                  setFilter("completed")
                }}
              >
                <span className="menu-icon">✅</span> Completed
              </li>
              <li
                className={filter === "high-priority" ? "active" : ""}
                onClick={() => {
                  setView("list")
                  setFilter("high-priority")
                }}
              >
                <span className="menu-icon">🔥</span> High Priority
              </li>
              <li
                className={filter === "upcoming" ? "active" : ""}
                onClick={() => {
                  setView("list")
                  setFilter("upcoming")
                }}
              >
                <span className="menu-icon">⏰</span> Upcoming
              </li>
              <li
                className={filter === "overdue" ? "active" : ""}
                onClick={() => {
                  setView("list")
                  setFilter("overdue")
                }}
              >
                <span className="menu-icon">⚠️</span> Overdue
              </li>
              <li className={view === "analytics" ? "active" : ""} onClick={() => setView("analytics")}>
                <span className="menu-icon">📊</span> Analytics
              </li>
            </ul>

            <div className="sidebar-header">
              <h2>Categories</h2>
            </div>
            <ul className="sidebar-categories">
              {categories.map((category) => (
                <li
                  key={category}
                  className={selectedCategory === category ? "active" : ""}
                  onClick={() => setSelectedCategory(category)}
                >
                  <span className="menu-icon">🔖</span> {category}
                  <span className="category-count">{tasks.filter((task) => task.category === category).length}</span>
                </li>
              ))}
              <li className="add-category">
                <input
                  type="text"
                  placeholder="Add category..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      addCategory(e.target.value)
                      e.target.value = ""
                    }
                  }}
                />
              </li>
            </ul>
          </aside>
        )}

        <div className="content">
          {view === "list" && (
            <>
              <div className="add-task-card">
                <form onSubmit={handleAddTask} className="add-task-form">
                  <div className="form-row">
                    <input
                      type="text"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      placeholder="What needs to be done?"
                      className="task-input"
                    />
                  </div>
                  <div className="form-row extra-options">
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} className="priority-select">
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>

                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="category-select"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>

                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="date-input"
                    />

                    <button type="submit" className="add-button">
                      Add Task
                    </button>
                  </div>
                </form>
              </div>

              <div className="progress-overview">
                <div className="progress-container">
                  <div className="progress-bar" style={{ width: `${completionPercentage}%` }}>
                    {completionPercentage}%
                  </div>
                </div>
                <div className="progress-stats">
                  <span>
                    Completed: {completedCount}/{tasks.length}
                  </span>
                  <span>High Priority: {getTasksByPriority("high").filter((t) => !t.completed).length} pending</span>
                  <span>Overdue: {getOverdueTasks().length}</span>
                </div>
              </div>

              {filteredAndSearchedTasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h3>No tasks found</h3>
                  <p>Try changing your filters or adding a new task.</p>
                </div>
              ) : (
                <div className="task-cards">
                  {filteredAndSearchedTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`task-card ${task.priority} ${task.completed ? "completed" : ""} ${task.ongoing ? "ongoing" : ""}`}
                    >
                      <div className="task-card-header">
                        <div className="checkbox-group">
                          <label className="checkbox-container">
                            <input type="checkbox" checked={task.completed} onChange={() => toggleComplete(task.id)} />
                            <span className="checkmark"></span>
                          </label>
                          <label className="checkbox-container ongoing">
                            <input type="checkbox" checked={task.ongoing} onChange={() => toggleOngoing(task.id)} />
                            <span className="checkmark ongoing"></span>
                          </label>
                        </div>
                        <div className="task-meta">
                          <span className={`priority-badge ${task.priority}`}>
                            {task.priority === "high" ? "🔥 High" : task.priority === "medium" ? "⚡ Medium" : "🔵 Low"}
                          </span>
                          <span className="category-badge">{task.category}</span>
                        </div>
                      </div>

                      <div className="task-card-body">
                        {editTask === task.id ? (
                          <div className="edit-form">
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="edit-input"
                              autoFocus
                            />
                            <div className="edit-options">
                              <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="priority-select-sm"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>

                              <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="category-select-sm"
                              >
                                {categories.map((category) => (
                                  <option key={category} value={category}>
                                    {category}
                                  </option>
                                ))}
                              </select>

                              <input
                                type="date"
                                value={dueDate || ""}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="date-input-sm"
                              />

                              <button onClick={saveEditTask} className="save-edit-btn">
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="task-text" onDoubleClick={() => startEditTask(task)}>
                            {task.text}
                          </div>
                        )}
                      </div>

                      <div className="task-card-footer">
                        {task.dueDate && (
                          <div className={`due-date ${isOverdue(task.dueDate) && !task.completed ? "overdue" : ""}`}>
                            {isOverdue(task.dueDate) && !task.completed ? "⚠️ Overdue: " : "📅 Due: "}
                            {formatDate(task.dueDate)}
                          </div>
                        )}

                        <div className="task-actions">
                          <button className="edit-button" onClick={() => startEditTask(task)} title="Edit">
                            ✏️
                          </button>
                          <button className="delete-button" onClick={() => deleteTask(task.id)} title="Delete">
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredAndSearchedTasks.length > 0 && filter === "completed" && (
                <div className="clear-completed">
                  <button onClick={() => setTasks(tasks.filter((task) => !task.completed))}>Clear All Completed</button>
                </div>
              )}
            </>
          )}

          {view === "analytics" && (
            <div className="analytics-view">
              <h2 className="analytics-title">Task Analytics</h2>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{tasks.length}</div>
                  <div className="stat-label">Total Tasks</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{completedCount}</div>
                  <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{tasks.length - completedCount}</div>
                  <div className="stat-label">Pending</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{getOverdueTasks().length}</div>
                  <div className="stat-label">Overdue</div>
                </div>
              </div>

              <div className="analytics-section">
                <h3>Completion Rate</h3>
                <div className="progress-container large">
                  <div className="progress-bar" style={{ width: `${completionPercentage}%` }}>
                    {completionPercentage}%
                  </div>
                </div>
              </div>

              <div className="analytics-section">
                <h3>Tasks by Priority</h3>
                <div className="priority-distribution">
                  <div className="priority-bar-container">
                    <div className="priority-bar-label">High</div>
                    <div className="priority-bar">
                      <div
                        className="priority-bar-fill high"
                        style={{
                          width: `${tasks.length ? (getTasksByPriority("high").length / tasks.length) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                    <div className="priority-bar-count">{getTasksByPriority("high").length}</div>
                  </div>
                  <div className="priority-bar-container">
                    <div className="priority-bar-label">Medium</div>
                    <div className="priority-bar">
                      <div
                        className="priority-bar-fill medium"
                        style={{
                          width: `${tasks.length ? (getTasksByPriority("medium").length / tasks.length) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                    <div className="priority-bar-count">{getTasksByPriority("medium").length}</div>
                  </div>
                  <div className="priority-bar-container">
                    <div className="priority-bar-label">Low</div>
                    <div className="priority-bar">
                      <div
                        className="priority-bar-fill low"
                        style={{
                          width: `${tasks.length ? (getTasksByPriority("low").length / tasks.length) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                    <div className="priority-bar-count">{getTasksByPriority("low").length}</div>
                  </div>
                </div>
              </div>

              <div className="analytics-section">
                <h3>Tasks by Category</h3>
                <div className="category-distribution">
                  {categories.map((category) => {
                    const categoryTasks = tasks.filter((task) => task.category === category)
                    return (
                      <div key={category} className="category-item">
                        <div className="category-name">{category}</div>
                        <div className="category-bar">
                          <div
                            className="category-bar-fill"
                            style={{
                              width: `${tasks.length ? (categoryTasks.length / tasks.length) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                        <div className="category-count">{categoryTasks.length}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TodoListApp

