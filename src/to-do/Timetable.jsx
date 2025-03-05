"use client";

import { useState, useEffect, useRef } from "react";
import "./Timetable.css";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DEFAULT_CELL_HEIGHT = 60; // pixels per hour

const Timetable = ({ darkMode, tasks, categories }) => {
  const [schedule, setSchedule] = useState(() => {
    const savedSchedule = localStorage.getItem("timetable");
    return savedSchedule ? JSON.parse(savedSchedule) : {};
  });
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [selectedHour, setSelectedHour] = useState(null);
  const [selectedEndHour, setSelectedEndHour] = useState(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventCategory, setEventCategory] = useState(categories[0] || "");
  const [eventColor, setEventColor] = useState("#3f51b5");
  const [cellHeight, setCellHeight] = useState(DEFAULT_CELL_HEIGHT);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [view, setView] = useState("week"); // week, day
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(
      today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)
    );
    return startOfWeek;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dragStartPosition, setDragStartPosition] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showAllDayEvents, setShowAllDayEvents] = useState(true);
  const [showTasksInTimetable, setShowTasksInTimetable] = useState(true);
  const [timeFormat, setTimeFormat] = useState("24h"); // 12h or 24h
  const [startHour, setStartHour] = useState(6); // Default start hour for display
  const [endHour, setEndHour] = useState(22); // Default end hour for display
  const [zoomLevel, setZoomLevel] = useState(1); // Zoom level for the timetable
  const [showWeekends, setShowWeekends] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showCurrentTime, setShowCurrentTime] = useState(true);
  const [currentTimeInterval, setCurrentTimeInterval] = useState(null);
  const [templates, setTemplates] = useState(() => {
    const savedTemplates = localStorage.getItem("timetableTemplates");
    return savedTemplates ? JSON.parse(savedTemplates) : [];
  });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationTimeout, setNotificationTimeout] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [highlightedEvent, setHighlightedEvent] = useState(null);
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);
  const [recurringType, setRecurringType] = useState("none"); // none, daily, weekly, monthly
  const [recurringEndDate, setRecurringEndDate] = useState("");
  const [recurringDays, setRecurringDays] = useState([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [conflictingEvents, setConflictingEvents] = useState([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPresets, setColorPresets] = useState([
    "#3f51b5",
    "#f44336",
    "#4caf50",
    "#ff9800",
    "#2196f3",
    "#9c27b0",
    "#009688",
    "#ff5722",
  ]);
  const [customColors, setCustomColors] = useState(() => {
    const savedColors = localStorage.getItem("timetableCustomColors");
    return savedColors ? JSON.parse(savedColors) : [];
  });

  const timetableRef = useRef(null);
  const formRef = useRef(null);
  const detailsRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("timetable", JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem("timetableTemplates", JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem("timetableCustomColors", JSON.stringify(customColors));
  }, [customColors]);

  useEffect(() => {
    if (showCurrentTime) {
      const interval = setInterval(() => {
        // Force re-render to update current time indicator
        setCellHeight((prev) => prev);
      }, 60000); // Update every minute
      setCurrentTimeInterval(interval);
      return () => clearInterval(interval);
    } else if (currentTimeInterval) {
      clearInterval(currentTimeInterval);
    }
  }, [showCurrentTime, currentTimeInterval]); // Added currentTimeInterval to dependencies

  useEffect(() => {
    // Adjust cell height based on zoom level
    setCellHeight(DEFAULT_CELL_HEIGHT * zoomLevel);
  }, [zoomLevel]);

  useEffect(() => {
    // Filter events based on search query
    if (searchQuery.trim() === "") {
      setFilteredEvents([]);
      setShowSearchResults(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = [];

    // Search through all events in the schedule
    Object.keys(schedule).forEach((day) => {
      Object.keys(schedule[day] || {}).forEach((hour) => {
        const events = schedule[day][hour];
        events.forEach((event) => {
          if (
            event.title.toLowerCase().includes(query) ||
            event.description.toLowerCase().includes(query) ||
            event.category.toLowerCase().includes(query)
          ) {
            results.push({ ...event, day, hour: parseInt(hour) });
          }
        });
      });
    });

    setFilteredEvents(results);
    setShowSearchResults(results.length > 0);
  }, [searchQuery, schedule]);

  // Handle click outside modals
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (formRef.current && !formRef.current.contains(e.target) && showForm) {
        setShowForm(false);
      }
      if (
        detailsRef.current &&
        !detailsRef.current.contains(e.target) &&
        showEventDetails
      ) {
        setShowEventDetails(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showForm, showEventDetails]);

  const handleCellClick = (day, hour) => {
    if (isResizing || isDragging) return;

    setSelectedDay(day);
    setSelectedHour(hour);
    setSelectedEndHour(hour + 1);
    setEventTitle("");
    setEventDescription("");
    setEventCategory(categories[0] || "");
    setEventColor("#3f51b5");
    setEditingEvent(null);
    setShowRecurringOptions(false);
    setRecurringType("none");
    setRecurringEndDate("");
    setRecurringDays([]);
    setShowForm(true);
  };

  const handleEventClick = (e, day, hour, eventIndex) => {
    e.stopPropagation();

    if (isResizing || isDragging) return;

    const event = schedule[day][hour][eventIndex];
    setSelectedEvent({ ...event, day, hour, index: eventIndex });
    setShowEventDetails(true);
  };

  const formatTime = (hour) => {
    if (timeFormat === "12h") {
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:00 ${period}`;
    }
    return `${hour.toString().padStart(2, "0")}:00`;
  };

  const getFormattedDateRange = () => {
    const startDate = new Date(currentWeek);
    const endDate = new Date(currentWeek);
    endDate.setDate(startDate.getDate() + 6);

    const options = { month: "short", day: "numeric" };
    return `${startDate.toLocaleDateString(
      undefined,
      options
    )} - ${endDate.toLocaleDateString(undefined, options)}`;
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(
      today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)
    );
    setCurrentWeek(startOfWeek);
  };

  const addEvent = () => {
    if (!eventTitle.trim()) {
      showNotificationMessage("Event title is required");
      return;
    }

    // Check for conflicts
    const conflicts = checkForConflicts(
      selectedDay,
      selectedHour,
      selectedEndHour
    );
    if (conflicts.length > 0 && !showConflictWarning) {
      setConflictingEvents(conflicts);
      setShowConflictWarning(true);
      return;
    }

    const newEvent = {
      title: eventTitle,
      description: eventDescription,
      category: eventCategory,
      color: eventColor,
      duration: selectedEndHour - selectedHour,
      isAllDay: selectedHour === "allDay",
      recurring:
        recurringType !== "none"
          ? {
              type: recurringType,
              endDate: recurringEndDate,
              days: recurringDays,
            }
          : null,
    };

    // Handle recurring events
    if (recurringType !== "none" && recurringEndDate) {
      addRecurringEvents(newEvent);
    } else {
      // Add single event
      const updatedSchedule = { ...schedule };

      if (!updatedSchedule[selectedDay]) {
        updatedSchedule[selectedDay] = {};
      }

      if (!updatedSchedule[selectedDay][selectedHour]) {
        updatedSchedule[selectedDay][selectedHour] = [];
      }

      updatedSchedule[selectedDay][selectedHour].push(newEvent);
      setSchedule(updatedSchedule);
    }

    setShowForm(false);
    setShowConflictWarning(false);
    showNotificationMessage("Event added successfully");
  };

  const addRecurringEvents = (eventTemplate) => {
    const updatedSchedule = { ...schedule };
    const startDate = new Date(currentWeek);
    const dayIndex = DAYS.indexOf(selectedDay);

    // Set start date to the selected day
    startDate.setDate(startDate.getDate() + dayIndex);

    const endDate = new Date(recurringEndDate);
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek =
        DAYS[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1];

      // For weekly recurrence, check if this day is selected
      if (
        recurringType === "weekly" &&
        recurringDays.length > 0 &&
        !recurringDays.includes(dayOfWeek)
      ) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      if (!updatedSchedule[dayOfWeek]) {
        updatedSchedule[dayOfWeek] = {};
      }

      if (!updatedSchedule[dayOfWeek][selectedHour]) {
        updatedSchedule[dayOfWeek][selectedHour] = [];
      }

      // Add the event
      updatedSchedule[dayOfWeek][selectedHour].push({
        ...eventTemplate,
        date: new Date(currentDate).toISOString().split("T")[0], // Store the specific date
      });

      // Increment date based on recurrence type
      if (recurringType === "daily") {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (recurringType === "weekly") {
        currentDate.setDate(
          currentDate.getDate() + (recurringDays.length > 0 ? 1 : 7)
        );
      } else if (recurringType === "monthly") {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    setSchedule(updatedSchedule);
  };

  const updateEvent = () => {
    if (!eventTitle.trim()) {
      showNotificationMessage("Event title is required");
      return;
    }

    const { day, hour, index } = editingEvent;

    const updatedSchedule = { ...schedule };
    const updatedEvent = {
      ...updatedSchedule[day][hour][index],
      title: eventTitle,
      description: eventDescription,
      category: eventCategory,
      color: eventColor,
      duration: selectedEndHour - selectedHour,
    };

    updatedSchedule[day][hour][index] = updatedEvent;
    setSchedule(updatedSchedule);
    setShowForm(false);
    showNotificationMessage("Event updated successfully");
  };

  const deleteEvent = () => {
    if (!eventToDelete) return;

    const { day, hour, index } = eventToDelete;

    const updatedSchedule = { ...schedule };
    updatedSchedule[day][hour].splice(index, 1);

    // Clean up empty arrays
    if (updatedSchedule[day][hour].length === 0) {
      delete updatedSchedule[day][hour];
    }

    if (Object.keys(updatedSchedule[day]).length === 0) {
      delete updatedSchedule[day];
    }

    setSchedule(updatedSchedule);
    setShowEventDetails(false);
    setShowConfirmDelete(false);
    setEventToDelete(null);
    showNotificationMessage("Event deleted successfully");
  };

  const editSelectedEvent = () => {
    if (!selectedEvent) return;

    const { day, hour, index } = selectedEvent;

    setSelectedDay(day);
    setSelectedHour(hour);
    setSelectedEndHour(hour + schedule[day][hour][index].duration);
    setEventTitle(schedule[day][hour][index].title);
    setEventDescription(schedule[day][hour][index].description || "");
    setEventCategory(
      schedule[day][hour][index].category || categories[0] || ""
    );
    setEventColor(schedule[day][hour][index].color || "#3f51b5");
    setEditingEvent({ day, hour, index });
    setShowEventDetails(false);
    setShowForm(true);
  };

  const confirmDeleteEvent = () => {
    setEventToDelete(selectedEvent);
    setShowConfirmDelete(true);
    setShowEventDetails(false);
  };

  const checkForConflicts = (day, startHour, endHour) => {
    if (!schedule[day]) return [];

    const conflicts = [];

    for (let hour = startHour; hour < endHour; hour++) {
      if (schedule[day][hour]) {
        conflicts.push(
          ...schedule[day][hour].map((event) => ({
            ...event,
            hour,
            conflictHour: formatTime(hour),
          }))
        );
      }
    }

    return conflicts;
  };

  const saveAsTemplate = () => {
    if (!templateName.trim()) {
      showNotificationMessage("Template name is required");
      return;
    }

    setTemplates([
      ...templates,
      {
        name: templateName,
        schedule: { ...schedule },
      },
    ]);

    setShowTemplateModal(false);
    setTemplateName("");
    showNotificationMessage("Template saved successfully");
  };

  const loadTemplate = () => {
    if (!selectedTemplate) return;

    const template = templates.find((t) => t.name === selectedTemplate);
    if (template) {
      setSchedule({ ...template.schedule });
      showNotificationMessage("Template loaded successfully");
    }
  };

  const exportSchedule = () => {
    let exportData = "";

    if (exportFormat === "csv") {
      exportData = "Day,Hour,Title,Description,Category,Duration\n";

      Object.keys(schedule).forEach((day) => {
        Object.keys(schedule[day] || {}).forEach((hour) => {
          schedule[day][hour].forEach((event) => {
            exportData += `${day},${hour},"${event.title}","${
              event.description || ""
            }","${event.category || ""}",${event.duration}\n`;
          });
        });
      });
    } else if (exportFormat === "json") {
      exportData = JSON.stringify(schedule, null, 2);
    }

    // Create download link
    const blob = new Blob([exportData], {
      type: exportFormat === "csv" ? "text/csv" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timetable-export.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowExportModal(false);
    showNotificationMessage("Schedule exported successfully");
  };

  const importSchedule = () => {
    try {
      if (importData.trim() === "") {
        showNotificationMessage("Import data is empty");
        return;
      }

      let parsedData;

      if (importData.startsWith("{")) {
        // JSON format
        parsedData = JSON.parse(importData);
        setSchedule(parsedData);
      } else {
        // CSV format
        const lines = importData.split("\n");
        const header = lines[0].split(",");

        parsedData = {};

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(",");
          const day = values[0];
          const hour = values[1];
          const title = values[2].replace(/^"|"$/g, "");
          const description = values[3].replace(/^"|"$/g, "");
          const category = values[4].replace(/^"|"$/g, "");
          const duration = parseInt(values[5]);

          if (!parsedData[day]) parsedData[day] = {};
          if (!parsedData[day][hour]) parsedData[day][hour] = [];

          parsedData[day][hour].push({
            title,
            description,
            category,
            duration,
            color: "#3f51b5",
          });
        }

        setSchedule(parsedData);
      }

      setShowImportModal(false);
      setImportData("");
      showNotificationMessage("Schedule imported successfully");
    } catch (error) {
      showNotificationMessage("Error importing schedule: " + error.message);
    }
  };

  const showNotificationMessage = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);

    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
    }

    const timeout = setTimeout(() => {
      setShowNotification(false);
    }, 3000);

    setNotificationTimeout(timeout);
  };

  const renderTimeGrid = () => {
    const visibleHours = HOURS.filter(
      (hour) => hour >= startHour && hour <= endHour
    );
    const visibleDays = showWeekends ? DAYS : DAYS.slice(0, 5);

    return (
      <div
        className="timetable-grid"
        style={{
          gridTemplateRows: `auto repeat(${visibleHours.length}, ${cellHeight}px)`,
        }}
      >
        {/* Header row with days */}
        <div className="timetable-header">
          <div className="timetable-time-column"></div>
          {visibleDays.map((day) => (
            <div key={day} className="timetable-day-header">
              {day}
            </div>
          ))}
        </div>

        {/* Time rows */}
        {visibleHours.map((hour) => (
          <div key={hour} className="timetable-row">
            <div className="timetable-time">{formatTime(hour)}</div>
            {visibleDays.map((day) => (
              <div
                key={`${day}-${hour}`}
                className={`timetable-cell ${showGrid ? "with-grid" : ""}`}
                onClick={() => handleCellClick(day, hour)}
              >
                {/* Render events in this cell */}
                {schedule[day] &&
                  schedule[day][hour] &&
                  schedule[day][hour].map((event, index) => (
                    <div
                      key={index}
                      className={`timetable-event ${
                        highlightedEvent === `${day}-${hour}-${index}`
                          ? "highlighted"
                          : ""
                      }`}
                      style={{
                        backgroundColor: event.color,
                        height: `${event.duration * cellHeight - 2}px`,
                        opacity: event.isCompleted ? 0.6 : 1,
                      }}
                      onClick={(e) => handleEventClick(e, day, hour, index)}
                    >
                      <div className="event-title">{event.title}</div>
                      {event.duration > 1 && (
                        <div className="event-time">
                          {formatTime(hour)} -{" "}
                          {formatTime(hour + event.duration)}
                        </div>
                      )}
                      {event.category && (
                        <div className="event-category">{event.category}</div>
                      )}
                    </div>
                  ))}

                {/* Current time indicator */}
                {showCurrentTime && isCurrentTimeCell(day, hour) && (
                  <div
                    className="current-time-indicator"
                    style={{ top: `${getCurrentTimeOffset(hour)}px` }}
                  ></div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const isCurrentTimeCell = (day, hour) => {
    const now = new Date();
    const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];
    const currentHour = now.getHours();

    return day === currentDay && hour === currentHour;
  };

  const getCurrentTimeOffset = (hour) => {
    const now = new Date();
    const minutes = now.getMinutes();
    return (minutes / 60) * cellHeight;
  };

  const renderTasksInTimetable = () => {
    if (!showTasksInTimetable || !tasks || tasks.length === 0) return null;

    // Filter tasks with due dates
    const tasksWithDueDates = tasks.filter(
      (task) => task.dueDate && !task.completed
    );

    return (
      <div className="timetable-tasks">
        <h3>Upcoming Tasks</h3>
        <ul>
          {tasksWithDueDates.map((task) => {
            const dueDate = new Date(task.dueDate);
            return (
              <li
                key={task.id}
                className={`task-item priority-${task.priority}`}
              >
                <span className="task-title">{task.text}</span>
                <span className="task-due-date">
                  {dueDate.toLocaleDateString()}{" "}
                  {formatTime(dueDate.getHours())}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className={`timetable-container ${darkMode ? "dark" : "light"}`}>
      <div className="timetable-header-controls">
        <div className="timetable-navigation">
          <button onClick={handlePreviousWeek} className="nav-button">
            &lt; Previous
          </button>
          <button onClick={handleToday} className="today-button">
            Today
          </button>
          <button onClick={handleNextWeek} className="nav-button">
            Next &gt;
          </button>
          <h2 className="current-date-range">{getFormattedDateRange()}</h2>
        </div>

        <div className="timetable-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="action-button"
          >
            ⚙️ Settings
          </button>
          <button
            onClick={() => setShowTemplateModal(true)}
            className="action-button"
          >
            📋 Templates
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="action-button"
          >
            📤 Export
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="action-button"
          >
            📥 Import
          </button>
          <button
            onClick={() => setShowPrintView(true)}
            className="action-button"
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="timetable-settings">
          <h3>Display Settings</h3>
          <div className="settings-grid">
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={showAllDayEvents}
                  onChange={() => setShowAllDayEvents(!showAllDayEvents)}
                />
                Show all-day events
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={showTasksInTimetable}
                  onChange={() =>
                    setShowTasksInTimetable(!showTasksInTimetable)
                  }
                />
                Show tasks
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={showWeekends}
                  onChange={() => setShowWeekends(!showWeekends)}
                />
                Show weekends
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={() => setShowGrid(!showGrid)}
                />
                Show grid lines
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={showCurrentTime}
                  onChange={() => setShowCurrentTime(!showCurrentTime)}
                />
                Show current time
              </label>
            </div>
            <div className="setting-item">
              <label>Time format:</label>
              <select
                value={timeFormat}
                onChange={(e) => setTimeFormat(e.target.value)}
              >
                <option value="12h">12-hour</option>
                <option value="24h">24-hour</option>
              </select>
            </div>
            <div className="setting-item">
              <label>Start hour:</label>
              <select
                value={startHour}
                onChange={(e) => setStartHour(parseInt(e.target.value))}
              >
                {HOURS.map((hour) => (
                  <option key={hour} value={hour}>
                    {formatTime(hour)}
                  </option>
                ))}
              </select>
            </div>
            <div className="setting-item">
              <label>End hour:</label>
              <select
                value={endHour}
                onChange={(e) => setEndHour(parseInt(e.target.value))}
              >
                {HOURS.map((hour) => (
                  <option key={hour} value={hour}>
                    {formatTime(hour)}
                  </option>
                ))}
              </select>
            </div>
            <div className="setting-item">
              <label>Zoom level:</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>
      )}

      <div className="timetable-main" ref={timetableRef}>
        {renderTimeGrid()}
        {showTasksInTimetable && renderTasksInTimetable()}
      </div>

      {/* Event Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="event-form" ref={formRef}>
            <h3>{editingEvent ? "Edit Event" : "Add New Event"}</h3>
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Event title"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Event description"
              ></textarea>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Time:</label>
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                >
                  {HOURS.map((hour) => (
                    <option key={hour} value={hour}>
                      {formatTime(hour)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>End Time:</label>
                <select
                  value={selectedEndHour}
                  onChange={(e) => setSelectedEndHour(parseInt(e.target.value))}
                >
                  {HOURS.filter((hour) => hour > selectedHour).map((hour) => (
                    <option key={hour} value={hour}>
                      {formatTime(hour)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category:</label>
                <select
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Color:</label>
                <div className="color-selector">
                  <div
                    className="selected-color"
                    style={{ backgroundColor: eventColor }}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  ></div>
                  {showColorPicker && (
                    <div className="color-picker">
                      <div className="color-presets">
                        {colorPresets.map((color) => (
                          <div
                            key={color}
                            className="color-preset"
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              setEventColor(color);
                              setShowColorPicker(false);
                            }}
                          ></div>
                        ))}
                      </div>
                      <input
                        type="color"
                        value={eventColor}
                        onChange={(e) => setEventColor(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!editingEvent && (
              <div className="form-group">
                <div
                  className="recurring-toggle"
                  onClick={() => setShowRecurringOptions(!showRecurringOptions)}
                >
                  <span>Recurring Event</span>
                  <span>{showRecurringOptions ? "▼" : "►"}</span>
                </div>

                {showRecurringOptions && (
                  <div className="recurring-options">
                    <div className="form-group">
                      <label>Recurrence:</label>
                      <select
                        value={recurringType}
                        onChange={(e) => setRecurringType(e.target.value)}
                      >
                        <option value="none">None</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    {recurringType === "weekly" && (
                      <div className="form-group">
                        <label>Repeat on:</label>
                        <div className="day-selector">
                          {DAYS.map((day) => (
                            <label key={day} className="day-checkbox">
                              <input
                                type="checkbox"
                                checked={recurringDays.includes(day)}
                                onChange={() => {
                                  if (recurringDays.includes(day)) {
                                    setRecurringDays(
                                      recurringDays.filter((d) => d !== day)
                                    );
                                  } else {
                                    setRecurringDays([...recurringDays, day]);
                                  }
                                }}
                              />
                              {day.substring(0, 1)}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {recurringType !== "none" && (
                      <div>
                        <label>End Date:</label>
                        <input
                          type="date"
                          value={recurringEndDate}
                          onChange={(e) => setRecurringEndDate(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="form-actions">
              <button
                onClick={() => setShowForm(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={editingEvent ? updateEvent : addEvent}
                className="save-button"
              >
                {editingEvent ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <div className="modal-overlay">
          <div className="event-details" ref={detailsRef}>
            <div
              className="event-details-header"
              style={{ backgroundColor: selectedEvent.color }}
            >
              <h3>{selectedEvent.title}</h3>
              <div className="event-time-details">
                {formatTime(selectedEvent.hour)} -{" "}
                {formatTime(selectedEvent.hour + selectedEvent.duration)}
              </div>
            </div>
            <div className="event-details-body">
              {selectedEvent.description && (
                <div className="event-description">
                  <h4>Description:</h4>
                  <p>{selectedEvent.description}</p>
                </div>
              )}
              {selectedEvent.category && (
                <div className="event-category-detail">
                  <h4>Category:</h4>
                  <p>{selectedEvent.category}</p>
                </div>
              )}
            </div>
            <div className="event-details-actions">
              <button
                onClick={() => setShowEventDetails(false)}
                className="close-button"
              >
                Close
              </button>
              <button onClick={editSelectedEvent} className="edit-button">
                Edit
              </button>
              <button onClick={confirmDeleteEvent} className="delete-button">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showConfirmDelete && (
        <div className="modal-overlay">
          <div className="confirm-dialog">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this event?</p>
            <div className="confirm-actions">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button onClick={deleteEvent} className="delete-button">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Warning Modal */}
      {showConflictWarning && (
        <div className="modal-overlay">
          <div className="conflict-warning">
            <h3>Time Conflict</h3>
            <p>This event conflicts with existing events:</p>
            <ul className="conflict-list">
              {conflictingEvents.map((event, index) => (
                <li key={index}>
                  <strong>{event.title}</strong> at {event.conflictHour}
                </li>
              ))}
            </ul>
            <div className="conflict-actions">
              <button
                onClick={() => setShowConflictWarning(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConflictWarning(false);
                  addEvent();
                }}
                className="continue-button"
              >
                Add Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="template-modal">
          <h3>Schedule Templates</h3>
          <div className="template-actions">
            <div className="save-template">
              <h4>Save Current Schedule</h4>
              <input
                type="text"
                placeholder="Template name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
              <button onClick={saveAsTemplate} className="save-button">
                Save
              </button>
            </div>
            <div className="load-template">
              <h4>Load Template</h4>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <option value="">Select a template</option>
                {templates.map((template) => (
                  <option key={template.name} value={template.name}>
                    {template.name}
                  </option>
                ))}
              </select>
              <button
                onClick={loadTemplate}
                disabled={!selectedTemplate}
                className="load-button"
              >
                Load
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowTemplateModal(false)}
            className="close-button"
          >
            Close
          </button>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay">
          <div className="export-modal">
            <h3>Export Schedule</h3>
            <div className="export-options">
              <div className="form-group">
                <label>Format:</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </div>
            </div>
            <div className="export-actions">
              <button
                onClick={() => setShowExportModal(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button onClick={exportSchedule} className="export-button">
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay">
          <div className="import-modal">
            <h3>Import Schedule</h3>
            <div className="import-instructions">
              <p>Paste CSV or JSON data below:</p>
            </div>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste your data here..."
              rows={10}
            ></textarea>
            <div className="import-actions">
              <button
                onClick={() => setShowImportModal(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button onClick={importSchedule} className="import-button">
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {showSearchResults && (
        <div className="search-results">
          <h3>Search Results</h3>
          <ul className="search-results-list">
            {filteredEvents.map((event, index) => (
              <li
                key={index}
                className="search-result-item"
                onClick={() => {
                  setHighlightedEvent(`${event.day}-${event.hour}-${index}`);
                  setShowSearchResults(false);
                  setSearchQuery("");
                }}
              >
                <div className="result-title">{event.title}</div>
                <div className="result-details">
                  {event.day} at {formatTime(event.hour)}
                </div>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setShowSearchResults(false)}
            className="close-button"
          >
            Close
          </button>
        </div>
      )}

      {/* Notification */}
      {showNotification && (
        <div className="notification">{notificationMessage}</div>
      )}
    </div>
  );
};

export default Timetable;
