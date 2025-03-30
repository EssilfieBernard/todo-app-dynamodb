document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const taskInput = document.getElementById("taskInput");
    const addTaskBtn = document.getElementById("addTaskBtn");
    const tasksList = document.getElementById("tasksList");
    const tasksCount = document.getElementById("tasksCount");
    const clearCompletedBtn = document.getElementById("clearCompletedBtn");
    const filters = document.querySelectorAll(".filter");
    const emptyState = document.querySelector(".empty-state");
    const editModal = document.getElementById("editModal");
    const editTaskInput = document.getElementById("editTaskInput");
    const saveTaskBtn = document.getElementById("saveTaskBtn");
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    const closeModalBtn = document.querySelector(".close-modal");
    const themeToggle = document.querySelector(".theme-toggle");

    // State
    let tasks = []; // Tasks will be fetched from the backend.
    let currentFilter = "all"; // 'all', 'active', or 'completed'
    let editingTaskId = null;
    let isDarkTheme = localStorage.getItem("darkTheme") === "true";

    init();

    function init() {
        fetchTasks();
        setupEventListeners();
        applyTheme();
    }

    function setupEventListeners() {
        // Add task events
        addTaskBtn.addEventListener("click", addTask);
        taskInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") addTask();
        });

        // Filter tasks
        filters.forEach((filter) => {
            filter.addEventListener("click", () => {
                setCurrentFilter(filter.dataset.filter);
            });
        });

        // Clear completed tasks
        clearCompletedBtn.addEventListener("click", clearCompletedTasks);

        // Modal events
        closeModalBtn.addEventListener("click", closeModal);
        cancelEditBtn.addEventListener("click", closeModal);
        saveTaskBtn.addEventListener("click", saveEditedTask);

        // Theme toggle
        themeToggle.addEventListener("click", toggleTheme);
    }

    // Fetch tasks from the backend
    function fetchTasks() {
        let url = "/tasks";
        if (currentFilter !== "all") {
            url += `?filter=${currentFilter}`;
        }

        fetch(url)
            .then((response) => {
                if (!response.ok) throw new Error(response.statusText);
                return response.json();
            })
            .then((data) => {
                tasks = data;
                renderTasks();
            })
            .catch((error) => console.error("Error fetching tasks:", error));
    }

    // Add a new task via POST /tasks
    function addTask() {
        const text = taskInput.value.trim();
        if (text === "") {
            showToast("Warning", "Task cannot be empty", "warning");
            return;
        }

        const newTask = {
            text: text,
            completed: false,
        };

        fetch("/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTask),
        })
            .then((response) => {
                if (!response.ok) throw new Error(response.statusText);
                return response.json();
            })
            .then(() => {
                fetchTasks();
                taskInput.value = "";
                showToast("Success", "Task added successfully", "success");
            })
            .catch((error) => console.error("Error creating task:", error));
    }

    // Toggle task completion via PUT /tasks/{id}
    function toggleTaskStatus(id) {
        const task = tasks.find((task) => task.id === id);
        if (!task) return;

        const updatedTask = { ...task, completed: !task.completed };

        fetch(`/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedTask),
        })
            .then((response) => {
                if (!response.ok) throw new Error(response.statusText);
                return response.json();
            })
            .then(() => fetchTasks())
            .catch((error) => console.error("Error updating task:", error));
    }

    // Delete a task via DELETE /tasks/{id}
    function deleteTask(id) {
        fetch(`/tasks/${id}`, { method: "DELETE" })
            .then((response) => {
                if (!response.ok) throw new Error(response.statusText);
                fetchTasks();
                showToast("Info", "Task deleted", "info");
            })
            .catch((error) => console.error("Error deleting task:", error));
    }

    // Open modal to edit task
    function editTask(id) {
        const task = tasks.find((task) => task.id === id);
        if (task) {
            editingTaskId = id;
            editTaskInput.value = task.text;
            openModal();
        }
    }

    // Save edited task via PUT /tasks/{id} (updating text only)
    function saveEditedTask() {
        if (editingTaskId === null) return;
        const newText = editTaskInput.value.trim();
        if (newText === "") {
            showToast("Warning", "Task cannot be empty", "warning");
            return;
        }
        const updatedTask = { text: newText };

        fetch(`/tasks/${editingTaskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedTask),
        })
            .then((response) => {
                if (!response.ok) throw new Error(response.statusText);
                return response.json();
            })
            .then(() => {
                fetchTasks();
                closeModal();
                showToast("Success", "Task updated successfully", "success");
            })
            .catch((error) => console.error("Error updating task:", error));
    }

    // Clear completed tasks via DELETE /tasks/completed
    function clearCompletedTasks() {
        fetch("/tasks/completed", { method: "DELETE" })
            .then((response) => {
                if (!response.ok) throw new Error(response.statusText);
                fetchTasks();
                showToast("Info", "Completed tasks cleared", "info");
            })
            .catch((error) =>
                console.error("Error clearing completed tasks:", error)
            );
    }

    // Set filter and fetch tasks accordingly
    function setCurrentFilter(filter) {
        currentFilter = filter;
        filters.forEach((f) => {
            f.classList.toggle("active", f.dataset.filter === filter);
        });
        fetchTasks();
    }

    // Render tasks in the DOM
    function renderTasks() {
        if (tasks.length === 0) {
            tasksList.innerHTML = "";
            emptyState.classList.remove("hidden");
            tasksCount.textContent = "0 items left";
            return;
        }
        emptyState.classList.add("hidden");
        tasksList.innerHTML = tasks
            .map(
                (task) => `
      <li class="task-item ${task.completed ? "completed" : ""}" data-id="${task.id}">
        <div class="task-checkbox ${task.completed ? "checked" : ""}" onclick="toggleTaskStatus('${task.id}')">
          ${task.completed ? '<i class="fas fa-check"></i>' : ""}
        </div>
        <div class="task-content">
          <div class="task-text">${escapeHtml(task.text)}</div>
        </div>
        <div class="task-actions">
          <button class="task-action-btn edit-btn" onclick="editTask('${task.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="task-action-btn delete-btn" onclick="deleteTask('${task.id}')">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </li>
    `
            )
            .join("");

        const activeCount = tasks.filter((task) => !task.completed).length;
        tasksCount.textContent = `${activeCount} item${activeCount !== 1 ? "s" : ""} left`;
    }

    function openModal() {
        editModal.classList.remove("hidden");
    }

    function closeModal() {
        editModal.classList.add("hidden");
        editingTaskId = null;
    }

    // Toast notifications
    function showToast(title, message, type = "info") {
        const toastContainer = document.querySelector(".toast-container");
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
      <div class="toast-icon">
        <i class="fas ${getToastIcon(type)}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
    `;
        toastContainer.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 3000);
    }

    function getToastIcon(type) {
        switch (type) {
            case "success":
                return "fa-check";
            case "error":
                return "fa-exclamation-circle";
            case "warning":
                return "fa-exclamation-triangle";
            default:
                return "fa-info-circle";
        }
    }

    // Theme toggling
    function toggleTheme() {
        isDarkTheme = !isDarkTheme;
        localStorage.setItem("darkTheme", isDarkTheme);
        applyTheme();
    }

    function applyTheme() {
        if (isDarkTheme) {
            document.body.classList.add("dark-theme");
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.classList.remove("dark-theme");
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    function escapeHtml(html) {
        const div = document.createElement("div");
        div.textContent = html;
        return div.innerHTML;
    }

    // Expose functions for inline onclick handlers
    window.toggleTaskStatus = toggleTaskStatus;
    window.deleteTask = deleteTask;
    window.editTask = editTask;
});
